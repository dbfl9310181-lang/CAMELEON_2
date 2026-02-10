import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Export auth models
export * from "./models/auth";
// Export chat models
export * from "./models/chat";

import { users } from "./models/auth";

export const entries = pgTable("entries", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  content: text("content").notNull(),
  entryType: text("entry_type").notNull().default("diary"),
  styleReference: text("style_reference"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  entryId: integer("entry_id").references(() => entries.id, { onDelete: 'cascade' }),
  url: text("url").notNull(),
  description: text("description").notNull(),
  takenAt: text("taken_at"), // e.g. "10:00 AM"
  location: text("location"),
  weather: text("weather"),
});

export const entriesRelations = relations(entries, ({ one, many }) => ({
  photos: many(photos),
  user: one(users, {
    fields: [entries.userId],
    references: [users.id],
  }),
}));

export const photosRelations = relations(photos, ({ one }) => ({
  entry: one(entries, {
    fields: [photos.entryId],
    references: [entries.id],
  }),
}));

export const insertEntrySchema = createInsertSchema(entries).omit({ id: true, createdAt: true });
export const insertPhotoSchema = createInsertSchema(photos).omit({ id: true });

export type Entry = typeof entries.$inferSelect;
export type InsertEntry = z.infer<typeof insertEntrySchema>;
export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;

// Types for the generation request
export const songRecommendations = pgTable("song_recommendations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  youtubeUrl: text("youtube_url").notNull(),
  mood: text("mood").notNull(),
  genre: text("genre"),
  tags: text("tags"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSongRecommendationSchema = createInsertSchema(songRecommendations).omit({ id: true, createdAt: true });
export type SongRecommendation = typeof songRecommendations.$inferSelect;
export type InsertSongRecommendation = z.infer<typeof insertSongRecommendationSchema>;

export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  author: text("author").notNull(),
  comment: text("comment"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertQuoteSchema = createInsertSchema(quotes).omit({ id: true, createdAt: true });
export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;

export const emojiReactions = pgTable("emoji_reactions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  entryId: integer("entry_id").references(() => entries.id, { onDelete: 'cascade' }),
  recommendationType: text("recommendation_type").notNull(),
  recommendationId: text("recommendation_id").notNull(),
  emoji: text("emoji").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEmojiReactionSchema = createInsertSchema(emojiReactions).omit({ id: true, createdAt: true });
export type EmojiReaction = typeof emojiReactions.$inferSelect;
export type InsertEmojiReaction = z.infer<typeof insertEmojiReactionSchema>;

export const generateDiarySchema = z.object({
  photos: z.array(z.object({
    url: z.string().optional().default("https://placehold.co/600x400?text=Photo"),
    description: z.string(),
    takenAt: z.string().optional(),
    location: z.string().optional(),
    weather: z.string().optional(),
  })),
  styleReference: z.string().optional(),
});

export type GenerateDiaryRequest = z.infer<typeof generateDiarySchema>;
