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
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";
import type { PipelineItem, PersonType } from "@/lib/backend/pipeline";
import type { PersonRecord } from "@/lib/backend/person";

interface AdminPipelineState {
  items: PipelineItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  /** Synchronous cache read — returns undefined if not warmed yet. */
  getPerson: (
    type: PersonType,
    recordId: string
  ) => PersonRecord | undefined;
  /** Fetch + cache a full record. Dedupes in-flight requests. */
  loadPerson: (
    type: PersonType,
    recordId: string,
    force?: boolean
  ) => Promise<PersonRecord | null>;
}

const personKey = (type: PersonType, recordId: string) =>
  `${type}:${recordId}`;

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
  const personCache = useRef<Map<string, PersonRecord>>(new Map());
  const personInflight = useRef<
    Map<string, Promise<PersonRecord | null>>
  >(new Map());

  const getPerson = useCallback(
    (type: PersonType, recordId: string) =>
      personCache.current.get(personKey(type, recordId)),
    []
  );

  const loadPerson = useCallback(
    async (
      type: PersonType,
      recordId: string,
      force = false
    ): Promise<PersonRecord | null> => {
      const key = personKey(type, recordId);
      if (!force && personCache.current.has(key)) {
        return personCache.current.get(key) ?? null;
      }
      const existing = personInflight.current.get(key);
      if (existing && !force) return existing;

      const task = (async (): Promise<PersonRecord | null> => {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          const token = session?.access_token;
          if (!token) return null;
          const res = await fetch(
            `/api/admin/person?type=${encodeURIComponent(
              type
            )}&id=${encodeURIComponent(recordId)}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (!res.ok) return null;
          const payload = (await res.json()) as {
            record?: PersonRecord;
          };
          const rec = payload.record ?? null;
          if (rec) personCache.current.set(key, rec);
          return rec;
        } catch {
          return null;
        } finally {
          personInflight.current.delete(key);
        }
      })();

      personInflight.current.set(key, task);
      return task;
    },
    []
  );

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

  // Keep the board live: a paid member (Stripe webhook) / converted lead
  // slides into Clients on its own. Quiet 30s poll + refresh on focus.
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void refetch();
    }, 30000);
    const onFocus = () => void refetch();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [refetch]);

  // Stable identity: only changes when pipeline data actually changes,
  // NOT on every parent (layout/pathname) re-render — so the sidebar
  // never churns when you switch tabs.
  const value = useMemo(
    () => ({ items, loading, error, refetch, getPerson, loadPerson }),
    [items, loading, error, refetch, getPerson, loadPerson]
  );

  return (
    <AdminPipelineContext.Provider value={value}>
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
