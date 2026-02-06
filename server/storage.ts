import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { entries, photos, type Entry, type InsertEntry, type Photo, type InsertPhoto } from "@shared/schema";

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
}

export const storage = new DatabaseStorage();
