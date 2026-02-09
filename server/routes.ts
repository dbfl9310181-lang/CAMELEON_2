import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth } from "./replit_integrations/auth";
import { registerAuthRoutes } from "./replit_integrations/auth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { openai } from "./replit_integrations/image/client";
import { generateDiarySchema, insertSongRecommendationSchema } from "@shared/schema";
import { getUncachableSpotifyClient } from "./spotify";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Auth
  await setupAuth(app);
  registerAuthRoutes(app);
  
  // Setup Object Storage for file uploads
  registerObjectStorageRoutes(app);

  // Helper to ensure authentication
  const requireAuth = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  app.get(api.entries.list.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const entries = await storage.getEntries(userId);
    res.json(entries);
  });

  app.get(api.entries.get.path, requireAuth, async (req, res) => {
    const id = Number(req.params.id);
    const entry = await storage.getEntry(id);
    
    if (!entry) {
      return res.status(404).json({ message: "Entry not found" });
    }

    // Ensure user owns the entry
    if (entry.userId !== (req.user as any).claims.sub) {
       return res.status(403).json({ message: "Forbidden" });
    }

    res.json(entry);
  });

  app.post(api.entries.create.path, requireAuth, async (req, res) => {
    try {
      const input = generateDiarySchema.parse(req.body);
      const userId = (req.user as any).claims.sub;

      const allText = input.photos.map(p => p.description || "").join(" ") + " " + (input.photos.map(p => p.location || "").join(" "));
      const languageInstruction = `\n\nCRITICAL LANGUAGE RULE: You MUST write the diary entry in the EXACT SAME language that the user used in their photo descriptions. If the descriptions are in Korean, the entire diary MUST be in Korean. If in English, write in English. If in Japanese, write in Japanese. Do NOT translate or switch languages. The output language must perfectly match the input description language.`;

      const styleSection = input.styleReference 
        ? `
Writing style:
Write this diary entry as if ${input.styleReference} were writing their own personal diary.
- Strongly reflect their unique voice, sentence structure, vocabulary choices, and emotional expression
- Capture how they would naturally describe everyday moments in their own words
- Match their characteristic tone (e.g. poetic, witty, philosophical, casual, dramatic)
- Do NOT mention ${input.styleReference} by name in the output
- Do NOT use their famous quotes or catchphrases directly
- The reader should clearly feel the influence of ${input.styleReference}'s style
`
        : `
Writing style:
Use a modern, conversational tone.
- Natural, spoken-language flow
- Warm, relatable, and personal
- Clear emotional beats without exaggeration
- Short to medium-length sentences, easy to read
`;

      const prompt = `
You are an auto-diary writing assistant.

Write a daily journal entry based on the user's photos and timestamps.
${styleSection}
Guidelines:
- Let the diary feel like a quiet conversation with oneself.
- Focus on everyday moments and how they felt, not on storytelling drama.
- Reflect the flow of the day from morning to night.
- Keep the entry between 5 and 7 sentences.
- End with a short, emotionally grounded closing sentence.

Photos:
${input.photos.map((p, i) => `
Photo ${i + 1}:
- Time taken: ${p.takenAt || "Unknown"}
- Description: ${p.description}
- Location: ${p.location || "Unknown"}
- Weather: ${p.weather || "Unknown"}
`).join("\n")}
${languageInstruction}

Output ONLY the diary text.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_completion_tokens: 500,
      });

      const generatedContent = response.choices[0].message.content || "Could not generate diary entry.";

      // Save to DB
      const entry = await storage.createEntry(
        {
          userId,
          content: generatedContent,
          date: new Date(),
          entryType: "diary",
          styleReference: input.styleReference || null,
        },
        input.photos.map(p => ({
            url: p.url || "",
            description: p.description,
            takenAt: p.takenAt,
            location: p.location,
            weather: p.weather
        }))
      );

      res.status(201).json(entry);
    } catch (err) {
      console.error("Error creating entry:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/suggest-styles", requireAuth, async (req, res) => {
    try {
      const { descriptions } = req.body;
      if (!descriptions || !Array.isArray(descriptions) || descriptions.length === 0) {
        return res.status(400).json({ message: "Descriptions are required" });
      }

      const combinedText = descriptions.filter(Boolean).join("\n");
      if (!combinedText.trim()) {
        return res.status(400).json({ message: "At least one non-empty description is required" });
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: `Based on the following diary descriptions, recommend 5 famous people / influencers / writers / celebrities whose writing style would best match the mood and content of these moments. Consider the emotions, topics, and atmosphere described.

Descriptions:
${combinedText}

CRITICAL LANGUAGE RULE: You MUST respond in the EXACT SAME language as the descriptions above. If the descriptions are in Korean, respond entirely in Korean. If in English, respond in English. If in Japanese, respond in Japanese.

Respond in this exact JSON format (no markdown, no code blocks):
[
  {"name": "Person Name", "reason": "One short sentence explaining why this style fits"},
  {"name": "Person Name", "reason": "One short sentence explaining why this style fits"},
  {"name": "Person Name", "reason": "One short sentence explaining why this style fits"},
  {"name": "Person Name", "reason": "One short sentence explaining why this style fits"},
  {"name": "Person Name", "reason": "One short sentence explaining why this style fits"}
]

Include a diverse mix: writers, celebrities, YouTubers, musicians, philosophers, etc. Choose people whose actual writing or speaking style matches the mood.` }],
        max_completion_tokens: 500,
      });

      const content = response.choices[0].message.content || "[]";
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const suggestions = JSON.parse(cleaned);
      res.json({ suggestions });
    } catch (err) {
      console.error("Error suggesting styles:", err);
      res.status(500).json({ message: "Failed to suggest styles" });
    }
  });

  app.delete(api.entries.delete.path, requireAuth, async (req, res) => {
      const id = Number(req.params.id);
      const entry = await storage.getEntry(id);

      if (!entry) {
          return res.status(404).json({ message: "Entry not found" });
      }
      
      if (entry.userId !== (req.user as any).claims.sub) {
          return res.status(403).json({ message: "Forbidden" });
      }

      await storage.deleteEntry(id);
      res.status(204).send();
  });

  const ADMIN_USER_ID = process.env.ADMIN_USER_ID || "";

  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = (req.user as any).claims.sub;
    if (ADMIN_USER_ID && userId !== ADMIN_USER_ID) {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  };

  app.get("/api/admin/check", requireAuth, (req, res) => {
    const userId = (req.user as any).claims.sub;
    const isAdmin = !ADMIN_USER_ID || userId === ADMIN_USER_ID;
    res.json({ isAdmin, userId });
  });

  app.get("/api/songs", requireAuth, async (req, res) => {
    const songs = await storage.getSongRecommendations();
    res.json(songs);
  });

  app.get("/api/songs/mood/:mood", requireAuth, async (req, res) => {
    const songs = await storage.getSongsByMood(req.params.mood);
    res.json(songs);
  });

  app.post("/api/songs", requireAdmin, async (req, res) => {
    try {
      const data = insertSongRecommendationSchema.parse(req.body);
      const song = await storage.createSongRecommendation(data);
      res.status(201).json(song);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/songs/:id", requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const song = await storage.updateSongRecommendation(id, req.body);
      res.json(song);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/songs/:id", requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    await storage.deleteSongRecommendation(id);
    res.status(204).send();
  });

  app.get("/api/spotify/playlists", requireAuth, async (req, res) => {
    try {
      const spotify = await getUncachableSpotifyClient();
      const result = await spotify.currentUser.playlists.playlists(50);
      const playlists = result.items.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        imageUrl: p.images?.[0]?.url || null,
        trackCount: p.tracks?.total ?? 0,
      }));
      res.json(playlists);
    } catch (err) {
      console.error("Error fetching Spotify playlists:", err);
      res.status(500).json({ message: "Failed to fetch playlists" });
    }
  });

  app.get("/api/entries/:id/recommendations", requireAuth, async (req, res) => {
    try {
      const entryId = Number(req.params.id);
      const entry = await storage.getEntry(entryId);

      if (!entry) {
        return res.status(404).json({ message: "Entry not found" });
      }

      if (entry.userId !== (req.user as any).claims.sub) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const moodResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: `Analyze the mood of the following diary entry. Return a JSON object with two fields:
1. "mood": ONE word from this list: happy, sad, calm, energetic, romantic, nostalgic, hopeful, melancholy, excited, peaceful, angry, dreamy
2. "searchQueries": An array of 3 short Spotify search queries (2-4 words each) that would find songs matching this mood. Mix genres and languages. Consider the diary content's language and cultural context.

Diary entry:
${entry.content}

Respond with ONLY valid JSON, no markdown.` }],
        max_completion_tokens: 200,
      });

      const moodContent = moodResponse.choices[0].message.content || '{"mood":"calm","searchQueries":["calm acoustic","peaceful piano","relaxing vibes"]}';
      let moodData: { mood: string; searchQueries: string[] };
      try {
        moodData = JSON.parse(moodContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
      } catch {
        moodData = { mood: "calm", searchQueries: ["calm acoustic", "peaceful piano", "relaxing vibes"] };
      }

      const detectedMood = moodData.mood;

      let spotifyTracks: any[] = [];
      try {
        const spotify = await getUncachableSpotifyClient();

        const userPlaylists = await spotify.currentUser.playlists.playlists(50);
        
        if (userPlaylists.items.length > 0) {
          const allTracks: any[] = [];
          const playlistsToSearch = userPlaylists.items.slice(0, 10);
          
          for (const playlist of playlistsToSearch) {
            try {
              const tracks = await spotify.playlists.getPlaylistItems(playlist.id, undefined, undefined, 50);
              for (const item of tracks.items) {
                if (item.track && item.track.type === 'track') {
                  allTracks.push({
                    id: item.track.id,
                    title: item.track.name,
                    artist: (item.track as any).artists?.map((a: any) => a.name).join(", ") || "Unknown",
                    albumArt: (item.track as any).album?.images?.[0]?.url || null,
                    spotifyUrl: item.track.external_urls?.spotify || "",
                    previewUrl: (item.track as any).preview_url || null,
                    playlistName: playlist.name,
                  });
                }
              }
            } catch {
            }
          }

          if (allTracks.length > 0) {
            const trackListStr = allTracks.map((t, i) => `${i}: "${t.title}" by ${t.artist}`).join("\n");
            
            const pickResponse = await openai.chat.completions.create({
              model: "gpt-4o",
              messages: [{ role: "user", content: `The mood is "${detectedMood}". From this playlist, pick up to 5 tracks that best match this mood. Return ONLY a JSON array of index numbers, e.g. [0, 3, 7, 12, 20]. No other text.

Tracks:
${trackListStr}` }],
              max_completion_tokens: 100,
            });

            try {
              const indices: number[] = JSON.parse(pickResponse.choices[0].message.content || "[]");
              spotifyTracks = indices
                .filter(i => i >= 0 && i < allTracks.length)
                .map(i => allTracks[i])
                .slice(0, 5);
            } catch {
              const shuffled = allTracks.sort(() => Math.random() - 0.5);
              spotifyTracks = shuffled.slice(0, 5);
            }
          }
        }

        if (spotifyTracks.length < 3) {
          for (const query of moodData.searchQueries.slice(0, 2)) {
            try {
              const searchResult = await spotify.search(query, ["track"], undefined, 5);
              for (const track of searchResult.tracks.items) {
                if (!spotifyTracks.find(t => t.id === track.id)) {
                  spotifyTracks.push({
                    id: track.id,
                    title: track.name,
                    artist: track.artists.map(a => a.name).join(", "),
                    albumArt: track.album.images?.[0]?.url || null,
                    spotifyUrl: track.external_urls?.spotify || "",
                    previewUrl: track.preview_url || null,
                    playlistName: null,
                  });
                }
              }
            } catch {
            }
          }
          spotifyTracks = spotifyTracks.slice(0, 5);
        }
      } catch (spotifyErr) {
        console.error("Spotify error, falling back to DB:", spotifyErr);
      }

      const dbSongs = await storage.getSongsByMood(detectedMood);

      res.json({ mood: detectedMood, spotifyTracks, dbSongs });
    } catch (err) {
      console.error("Error getting recommendations:", err);
      res.status(500).json({ message: "Failed to get recommendations" });
    }
  });

  return httpServer;
}
