import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Pencil, Check, X, Quote, ToggleLeft, ToggleRight } from "lucide-react";
import { Link } from "wouter";

interface QuoteItem {
  id: number;
  text: string;
  author: string;
  comment: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function AdminQuotes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: adminCheck, isLoading: adminLoading } = useQuery({
    queryKey: ["/api/admin/check"],
    queryFn: async () => {
      const res = await fetch("/api/admin/check", { credentials: "include" });
      return res.json() as Promise<{ isAdmin: boolean }>;
    },
  });

  const { data: allQuotes, isLoading: quotesLoading } = useQuery({
    queryKey: ["/api/admin/quotes"],
    queryFn: async () => {
      const res = await fetch("/api/admin/quotes", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch quotes");
      return res.json() as Promise<QuoteItem[]>;
    },
    enabled: adminCheck?.isAdmin === true,
  });

  const createMutation = useMutation({
    mutationFn: async (data: { text: string; author: string; comment: string | null; isActive: boolean }) => {
      const res = await fetch("/api/admin/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create quote");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quotes"] });
      toast({ title: "Quote added" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add quote.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<QuoteItem> & { id: number }) => {
      const res = await fetch(`/api/admin/quotes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update quote");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quotes"] });
      toast({ title: "Updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/quotes/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quotes"] });
      toast({ title: "Deleted" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
    },
  });

  const [newQuote, setNewQuote] = useState({ text: "", author: "", comment: "" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<QuoteItem>>({});

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuote.text || !newQuote.author) {
      toast({ title: "Missing fields", description: "Text and author are required.", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      text: newQuote.text,
      author: newQuote.author,
      comment: newQuote.comment || null,
      isActive: true,
    });
    setNewQuote({ text: "", author: "", comment: "" });
  };

  const startEdit = (q: QuoteItem) => {
    setEditingId(q.id);
    setEditData({ text: q.text, author: q.author, comment: q.comment, isActive: q.isActive });
  };

  const saveEdit = () => {
    if (editingId === null) return;
    updateMutation.mutate({ id: editingId, ...editData });
    setEditingId(null);
    setEditData({});
  };

  const toggleActive = (q: QuoteItem) => {
    updateMutation.mutate({ id: q.id, isActive: !q.isActive });
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
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex items-center gap-3 mb-8">
        <Quote className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-display font-bold text-foreground">Quotes Management</h1>
      </div>

      <form onSubmit={handleAdd} className="paper-card p-6 mb-8">
        <h2 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-primary" />
          Add New Quote
        </h2>
        <div className="space-y-4 mb-4">
          <textarea
            placeholder="Quote text *"
            value={newQuote.text}
            onChange={(e) => setNewQuote({ ...newQuote, text: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[80px] resize-none font-serif"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Author *"
              value={newQuote.author}
              onChange={(e) => setNewQuote({ ...newQuote, author: e.target.value })}
              className="px-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <input
              type="text"
              placeholder="Comment (optional)"
              value={newQuote.comment}
              onChange={(e) => setNewQuote({ ...newQuote, comment: e.target.value })}
              className="px-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all disabled:opacity-50"
        >
          {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Add Quote
        </button>
      </form>

      {quotesLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !allQuotes || allQuotes.length === 0 ? (
        <div className="paper-card p-12 text-center">
          <Quote className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground font-serif">No quotes yet. Add your first one above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {allQuotes.map((q) => (
            <div key={q.id} className={`paper-card p-5 ${!q.isActive ? "opacity-50" : ""}`}>
              {editingId === q.id ? (
                <div className="space-y-3">
                  <textarea
                    value={editData.text || ""}
                    onChange={(e) => setEditData({ ...editData, text: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[60px] resize-none font-serif"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={editData.author || ""}
                      onChange={(e) => setEditData({ ...editData, author: e.target.value })}
                      className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="Author"
                    />
                    <input
                      type="text"
                      value={editData.comment || ""}
                      onChange={(e) => setEditData({ ...editData, comment: e.target.value })}
                      className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="Comment"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setEditingId(null); setEditData({}); }} className="p-2 rounded-lg bg-red-100 text-red-500 hover:bg-red-200 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="font-serif text-foreground/90 italic mb-2">"{q.text}"</p>
                  <p className="text-sm text-muted-foreground mb-1">— {q.author}</p>
                  {q.comment && <p className="text-xs text-primary/70">{q.comment}</p>}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
                    <button
                      onClick={() => toggleActive(q)}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      title={q.isActive ? "Deactivate" : "Activate"}
                    >
                      {q.isActive ? <ToggleRight className="w-5 h-5 text-primary" /> : <ToggleLeft className="w-5 h-5" />}
                      {q.isActive ? "Active" : "Inactive"}
                    </button>
                    <div className="flex-1" />
                    <button onClick={() => startEdit(q)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { if (confirm("Delete this quote?")) deleteMutation.mutate(q.id); }}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
