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
      const languageInstruction = `\n\nIMPORTANT: Detect the language used in the user's descriptions below. Write the ENTIRE output in that SAME language. If the user wrote in Korean, write in Korean. If in Japanese, write in Japanese. If in French, write in French. Match the user's language exactly.`;

      const styleSection = input.styleReference 
        ? `
Writing style:
Write in a style inspired by the GENERAL COMMUNICATION STYLE of ${input.styleReference}.
- Reflect their abstract stylistic traits (tone, rhythm, emotional register)
- Do NOT imitate, role-play, or claim to be the real person
- Do NOT use or reference real quotes, slogans, or catchphrases
- Do NOT mention the public figure by name in the output
- Write in an original voice that only reflects abstract stylistic traits
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
        messages: [{ role: "user", content: `Analyze the mood of the following diary entry and return ONE word from this list: happy, sad, calm, energetic, romantic, nostalgic, hopeful, melancholy, excited, peaceful, angry, dreamy.\n\nDiary entry:\n${entry.content}\n\nRespond with ONLY one word from the list above.` }],
        max_completion_tokens: 50,
      });

      const detectedMood = (moodResponse.choices[0].message.content || "calm").trim().toLowerCase();
      const songs = await storage.getSongsByMood(detectedMood);

      res.json({ mood: detectedMood, songs });
    } catch (err) {
      console.error("Error getting recommendations:", err);
      res.status(500).json({ message: "Failed to get recommendations" });
    }
  });

  return httpServer;
}
