import { db } from "./db";
import { eq, desc, ilike, or, and } from "drizzle-orm";
import { entries, photos, songRecommendations, emojiReactions, quotes, type Entry, type InsertEntry, type Photo, type InsertPhoto, type SongRecommendation, type InsertSongRecommendation, type EmojiReaction, type InsertEmojiReaction, type Quote, type InsertQuote } from "@shared/schema";

export interface IStorage {
  getEntries(userId: string): Promise<(Entry & { photos: Photo[] })[]>;
  getEntry(id: number): Promise<(Entry & { photos: Photo[] }) | undefined>;
  createEntry(entry: InsertEntry, photosData: InsertPhoto[]): Promise<Entry & { photos: Photo[] }>;
  deleteEntry(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getEntries(userId: string): Promise<(Entry & { photos: Photo[] })[]> {
    const userEntries = await db.query.entries.findMany({
      where: eq(entries.userId, userId),
      orderBy: [desc(entries.date)],
      with: {
        photos: true,
      },
    });
    return userEntries;
  }

  async getEntry(id: number): Promise<(Entry & { photos: Photo[] }) | undefined> {
    const entry = await db.query.entries.findFirst({
      where: eq(entries.id, id),
      with: {
        photos: true,
      },
    });
    return entry;
  }

  async createEntry(entryData: InsertEntry, photosData: InsertPhoto[]): Promise<Entry & { photos: Photo[] }> {
    // Transaction to ensure both entry and photos are created
    return await db.transaction(async (tx) => {
      const [newEntry] = await tx.insert(entries).values(entryData).returning();
      
      const photosWithEntryId = photosData.map(p => ({
        ...p,
        entryId: newEntry.id,
      }));

      let newPhotos: Photo[] = [];
      if (photosWithEntryId.length > 0) {
        newPhotos = await tx.insert(photos).values(photosWithEntryId).returning();
      }

      return { ...newEntry, photos: newPhotos };
    });
  }

  async deleteEntry(id: number): Promise<void> {
    await db.delete(entries).where(eq(entries.id, id));
  }

  async getSongRecommendations(): Promise<SongRecommendation[]> {
    return await db.query.songRecommendations.findMany({
      orderBy: [desc(songRecommendations.createdAt)],
    });
  }

  async getSongsByMood(mood: string): Promise<SongRecommendation[]> {
    return await db.select().from(songRecommendations).where(
      or(
        ilike(songRecommendations.mood, `%${mood}%`),
        ilike(songRecommendations.tags, `%${mood}%`)
      )
    );
  }

  async createSongRecommendation(data: InsertSongRecommendation): Promise<SongRecommendation> {
    const [song] = await db.insert(songRecommendations).values(data).returning();
    return song;
  }

  async deleteSongRecommendation(id: number): Promise<void> {
    await db.delete(songRecommendations).where(eq(songRecommendations.id, id));
  }

  async updateSongRecommendation(id: number, data: Partial<InsertSongRecommendation>): Promise<SongRecommendation> {
    const [updated] = await db.update(songRecommendations).set(data).where(eq(songRecommendations.id, id)).returning();
    return updated;
  }

  async createEmojiReaction(data: InsertEmojiReaction): Promise<EmojiReaction> {
    const existing = await db.select().from(emojiReactions).where(
      and(
        eq(emojiReactions.userId, data.userId),
        eq(emojiReactions.entryId, data.entryId!),
        eq(emojiReactions.recommendationId, data.recommendationId)
      )
    );
    if (existing.length > 0) {
      const [updated] = await db.update(emojiReactions)
        .set({ emoji: data.emoji })
        .where(eq(emojiReactions.id, existing[0].id))
        .returning();
      return updated;
    }
    const [reaction] = await db.insert(emojiReactions).values(data).returning();
    return reaction;
  }

  async getEmojiReactions(entryId: number): Promise<EmojiReaction[]> {
    return await db.select().from(emojiReactions).where(eq(emojiReactions.entryId, entryId));
  }

  async getQuotes(): Promise<Quote[]> {
    return await db.query.quotes.findMany({
      orderBy: [desc(quotes.createdAt)],
    });
  }

  async getActiveQuotes(): Promise<Quote[]> {
    return await db.select().from(quotes).where(eq(quotes.isActive, true)).orderBy(desc(quotes.createdAt));
  }

  async createQuote(data: InsertQuote): Promise<Quote> {
    const [quote] = await db.insert(quotes).values(data).returning();
    return quote;
  }

  async updateQuote(id: number, data: Partial<InsertQuote>): Promise<Quote> {
    const [updated] = await db.update(quotes).set(data).where(eq(quotes.id, id)).returning();
    return updated;
  }

  async deleteQuote(id: number): Promise<void> {
    await db.delete(quotes).where(eq(quotes.id, id));
  }

  async getUserReactionHistory(userId: string): Promise<EmojiReaction[]> {
    return await db.select().from(emojiReactions)
      .where(eq(emojiReactions.userId, userId))
      .orderBy(desc(emojiReactions.createdAt))
      .limit(50);
  }
}

export const storage = new DatabaseStorage();
