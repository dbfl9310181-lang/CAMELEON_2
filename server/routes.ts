import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth } from "./replit_integrations/auth";
import { registerAuthRoutes } from "./replit_integrations/auth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { openai } from "./replit_integrations/image/client";
import { generateDiarySchema } from "@shared/schema";

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

      // Generate the entry using OpenAI
      const isPortfolio = input.entryType === "portfolio";
      
      // Detect input language (Korean vs English)
      const allText = input.photos.map(p => p.description || "").join(" ");
      const hasKorean = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/.test(allText);
      const languageInstruction = hasKorean 
        ? "\n\nIMPORTANT: The user wrote in Korean. You MUST write the entire output in Korean (한국어)."
        : "\n\nIMPORTANT: Write the entire output in English.";
      
      let prompt: string;
      
      if (isPortfolio) {
        const workNotes = input.photos[0]?.description || "No details provided";
        
        // Extract career info if provided
        const hasCurrentRole = workNotes.includes("Current Role:");
        const hasTargetRole = workNotes.includes("Target Role:");
        const careerSection = (hasCurrentRole || hasTargetRole) ? `

Career Alignment:
If career information is provided, explicitly connect this work to the user's career trajectory. Explain how the skills demonstrated, lessons learned, or outcomes achieved relate to their target role or desired career path. Be specific about transferable competencies.
` : "";

        prompt = `
You are a professional business writer creating portfolio content for career advancement.

Convert the following work notes into a structured, polished portfolio entry suitable for a professional case study or performance review.

Work notes:
${workNotes}

Format Requirements:
- Use clear section headings (e.g., **Challenge**, **Approach**, **Outcome**, **Key Takeaways**)
- Write in first person, professional and objective tone
- Be concise and data-driven where possible
- Focus on measurable impact, decisions made, and business value delivered
- Avoid emotional or reflective language—keep it factual and results-oriented
${careerSection}
Writing Style:
- Business report format with clear structure
- Active voice, direct statements
- Quantify results when possible (e.g., "reduced by 30%", "delivered in 2 weeks")
- Professional vocabulary appropriate for executive audiences
${languageInstruction}

Output ONLY the formatted portfolio text with headings.
        `;
      } else {
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

        prompt = `
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
      }

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
          entryType: input.entryType || "diary",
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

  return httpServer;
}
