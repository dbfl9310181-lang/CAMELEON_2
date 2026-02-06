import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type GenerateDiaryRequest, type EntryResponse } from "@shared/routes";
import { z } from "zod";

// Helper to parse responses safely
function parseResponse<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error("[Zod] Validation failed:", result.error);
    throw new Error("Invalid response from server");
  }
  return result.data;
}

// GET /api/entries
export function useEntries() {
  return useQuery({
    queryKey: [api.entries.list.path],
    queryFn: async () => {
      const res = await fetch(api.entries.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch entries");
      const data = await res.json();
      return parseResponse(api.entries.list.responses[200], data);
    },
  });
}

// GET /api/entries/:id
export function useEntry(id: number) {
  return useQuery({
    queryKey: [api.entries.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.entries.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch entry");
      const data = await res.json();
      return parseResponse(api.entries.get.responses[200], data);
    },
    enabled: !isNaN(id),
  });
}

// POST /api/entries (Generate Diary)
export function useCreateEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: GenerateDiaryRequest) => {
      const res = await fetch(api.entries.create.path, {
        method: api.entries.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const errorData = await res.json();
          // Try to parse as validation error
          const validationError = api.entries.create.responses[400].safeParse(errorData);
          if (validationError.success) {
            throw new Error(validationError.data.message);
          }
        }
        throw new Error("Failed to create entry");
      }

      const responseData = await res.json();
      return parseResponse(api.entries.create.responses[201], responseData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.entries.list.path] });
    },
  });
}

// DELETE /api/entries/:id
export function useDeleteEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.entries.delete.path, { id });
      const res = await fetch(url, { 
        method: api.entries.delete.method,
        credentials: "include" 
      });
      if (!res.ok) throw new Error("Failed to delete entry");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.entries.list.path] });
    },
  });
}
