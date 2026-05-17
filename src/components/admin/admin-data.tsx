"use client";

// Admin-scoped pipeline cache. Lives in the persisted /admin layout so
// navigating between tabs (Pipeline ⇄ Events) never refetches or flashes a
// skeleton — pages read cached data instantly and revalidate in the
// background. One fetch on first admin load; explicit refetch after mutations.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";
import type { PipelineItem } from "@/lib/backend/pipeline";

interface AdminPipelineState {
  items: PipelineItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const AdminPipelineContext = createContext<AdminPipelineState | null>(null);

export function AdminDataProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<PipelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const refetch = useCallback(async () => {
    setError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setError("Session expired. Please sign in again.");
        setLoading(false);
        return;
      }
      const res = await fetch("/api/admin/pipeline", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setError("Could not load the pipeline.");
        setLoading(false);
        return;
      }
      const payload = (await res.json()) as { items?: PipelineItem[] };
      setItems(payload.items ?? []);
    } catch {
      setError("Could not load the pipeline.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    refetch();
  }, [refetch]);

  return (
    <AdminPipelineContext.Provider
      value={{ items, loading, error, refetch }}
    >
      {children}
    </AdminPipelineContext.Provider>
  );
}

export function useAdminPipeline(): AdminPipelineState {
  const ctx = useContext(AdminPipelineContext);
  if (!ctx) {
    throw new Error(
      "useAdminPipeline must be used within AdminDataProvider"
    );
  }
  return ctx;
}
