import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Pencil, Check, X, Music } from "lucide-react";
import { Link } from "wouter";

const MOOD_OPTIONS = [
  "happy", "sad", "calm", "energetic", "romantic", "nostalgic",
  "hopeful", "melancholy", "excited", "peaceful", "angry", "dreamy",
];

interface Song {
  id: number;
  title: string;
  artist: string;
  youtubeUrl: string;
  mood: string;
  genre: string | null;
  tags: string | null;
  createdAt: string;
}

export default function AdminSongs() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: adminCheck, isLoading: adminLoading } = useQuery({
    queryKey: ["/api/admin/check"],
    queryFn: async () => {
      const res = await fetch("/api/admin/check", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to check admin status");
      return res.json() as Promise<{ isAdmin: boolean }>;
    },
  });

  const { data: songs, isLoading: songsLoading } = useQuery({
    queryKey: ["/api/songs"],
    queryFn: async () => {
      const res = await fetch("/api/songs", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch songs");
      return res.json() as Promise<Song[]>;
    },
    enabled: adminCheck?.isAdmin === true,
  });

  const createMutation = useMutation({
    mutationFn: async (data: Omit<Song, "id" | "createdAt">) => {
      const res = await fetch("/api/songs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create song");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/songs"] });
      toast({ title: "Song added", description: "New song recommendation created." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add song.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Song> & { id: number }) => {
      const res = await fetch(`/api/songs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update song");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/songs"] });
      toast({ title: "Updated", description: "Song updated successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update song.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/songs/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete song");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/songs"] });
      toast({ title: "Deleted", description: "Song removed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete song.", variant: "destructive" });
    },
  });

  const [newSong, setNewSong] = useState({
    title: "",
    artist: "",
    youtubeUrl: "",
    mood: "happy",
    genre: "",
    tags: "",
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<Song>>({});

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSong.title || !newSong.artist || !newSong.youtubeUrl) {
      toast({ title: "Missing fields", description: "Title, artist and YouTube URL are required.", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      title: newSong.title,
      artist: newSong.artist,
      youtubeUrl: newSong.youtubeUrl,
      mood: newSong.mood,
      genre: newSong.genre || null,
      tags: newSong.tags || null,
    });
    setNewSong({ title: "", artist: "", youtubeUrl: "", mood: "happy", genre: "", tags: "" });
  };

  const startEdit = (song: Song) => {
    setEditingId(song.id);
    setEditData({ title: song.title, artist: song.artist, youtubeUrl: song.youtubeUrl, mood: song.mood, genre: song.genre, tags: song.tags });
  };

  const saveEdit = () => {
    if (editingId === null) return;
    updateMutation.mutate({ id: editingId, ...editData });
    setEditingId(null);
    setEditData({});
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  if (adminLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!adminCheck?.isAdmin) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-display font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-4">You do not have admin privileges.</p>
        <Link href="/" className="text-primary hover:underline">Return Home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="flex items-center gap-3 mb-8">
        <Music className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-display font-bold text-foreground">Song Recommendations</h1>
      </div>

      <form onSubmit={handleAdd} className="paper-card p-6 mb-8">
        <h2 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-primary" />
          Add New Song
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <input
            type="text"
            placeholder="Title *"
            value={newSong.title}
            onChange={(e) => setNewSong({ ...newSong, title: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <input
            type="text"
            placeholder="Artist *"
            value={newSong.artist}
            onChange={(e) => setNewSong({ ...newSong, artist: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <input
            type="url"
            placeholder="YouTube URL *"
            value={newSong.youtubeUrl}
            onChange={(e) => setNewSong({ ...newSong, youtubeUrl: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <select
            value={newSong.mood}
            onChange={(e) => setNewSong({ ...newSong, mood: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {MOOD_OPTIONS.map((m) => (
              <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Genre"
            value={newSong.genre}
            onChange={(e) => setNewSong({ ...newSong, genre: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <input
            type="text"
            placeholder="Tags (comma-separated)"
            value={newSong.tags}
            onChange={(e) => setNewSong({ ...newSong, tags: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all duration-300 disabled:opacity-50"
        >
          {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Add Song
        </button>
      </form>

      {songsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !songs || songs.length === 0 ? (
        <div className="paper-card p-12 text-center">
          <Music className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground font-serif">No songs added yet. Add your first recommendation above.</p>
        </div>
      ) : (
        <div className="paper-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="px-4 py-3 text-left text-xs font-bold tracking-wider uppercase text-muted-foreground">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-bold tracking-wider uppercase text-muted-foreground">Artist</th>
                  <th className="px-4 py-3 text-left text-xs font-bold tracking-wider uppercase text-muted-foreground">YouTube URL</th>
                  <th className="px-4 py-3 text-left text-xs font-bold tracking-wider uppercase text-muted-foreground">Mood</th>
                  <th className="px-4 py-3 text-left text-xs font-bold tracking-wider uppercase text-muted-foreground">Genre</th>
                  <th className="px-4 py-3 text-left text-xs font-bold tracking-wider uppercase text-muted-foreground">Tags</th>
                  <th className="px-4 py-3 text-right text-xs font-bold tracking-wider uppercase text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {songs.map((song) => (
                  <tr key={song.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    {editingId === song.id ? (
                      <>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={editData.title || ""}
                            onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                            className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={editData.artist || ""}
                            onChange={(e) => setEditData({ ...editData, artist: e.target.value })}
                            className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="url"
                            value={editData.youtubeUrl || ""}
                            onChange={(e) => setEditData({ ...editData, youtubeUrl: e.target.value })}
                            className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <select
                            value={editData.mood || ""}
                            onChange={(e) => setEditData({ ...editData, mood: e.target.value })}
                            className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                          >
                            {MOOD_OPTIONS.map((m) => (
                              <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={editData.genre || ""}
                            onChange={(e) => setEditData({ ...editData, genre: e.target.value })}
                            className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={editData.tags || ""}
                            onChange={(e) => setEditData({ ...editData, tags: e.target.value })}
                            className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={saveEdit} className="p-1.5 rounded-lg hover:bg-green-100 text-green-600 transition-colors" title="Save">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={cancelEdit} className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-colors" title="Cancel">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-sm font-medium text-foreground">{song.title}</td>
                        <td className="px-4 py-3 text-sm text-foreground/80">{song.artist}</td>
                        <td className="px-4 py-3 text-sm">
                          <a href={song.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block max-w-[200px]">
                            {song.youtubeUrl}
                          </a>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {song.mood}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground/70">{song.genre || "—"}</td>
                        <td className="px-4 py-3 text-sm text-foreground/70">{song.tags || "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => startEdit(song)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Edit">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm("Delete this song?")) deleteMutation.mutate(song.id);
                              }}
                              disabled={deleteMutation.isPending}
                              className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
