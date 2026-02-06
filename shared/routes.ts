import { z } from 'zod';
import { insertEntrySchema, entries, photos, generateDiarySchema } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  entries: {
    list: {
      method: 'GET' as const,
      path: '/api/entries',
      responses: {
        200: z.array(z.custom<typeof entries.$inferSelect & { photos: typeof photos.$inferSelect[] }>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/entries/:id',
      responses: {
        200: z.custom<typeof entries.$inferSelect & { photos: typeof photos.$inferSelect[] }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/entries',
      input: generateDiarySchema,
      responses: {
        201: z.custom<typeof entries.$inferSelect & { photos: typeof photos.$inferSelect[] }>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
        method: 'DELETE' as const,
        path: '/api/entries/:id',
        responses: {
            204: z.void(),
            404: errorSchemas.notFound
        }
    }
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type GenerateDiaryRequest = z.infer<typeof api.entries.create.input>;
export type EntryResponse = z.infer<typeof api.entries.create.responses[201]>;
