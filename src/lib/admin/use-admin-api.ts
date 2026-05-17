"use client";

// Shared authed fetch for admin feature pages. Attaches the Supabase
// session bearer, exposes a typed GET loader (with refetch) and a
// mutate() helper. Keeps each feature page small and consistent.

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

async function token(): Promise<string | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

export function useAdminResource<T>(path: string, key: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setError(null);
    try {
      const t = await token();
      if (!t) {
        setError("Session expired. Please sign in again.");
        setLoading(false);
        return;
      }
      const res = await fetch(path, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!res.ok) {
        setError("Could not load this data.");
        setLoading(false);
        return;
      }
      const payload = await res.json();
      setData(payload[key] ?? null);
    } catch {
      setError("Could not load this data.");
    } finally {
      setLoading(false);
    }
  }, [path, key]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

export async function adminMutate(
  path: string,
  method: "POST" | "PATCH" | "DELETE" | "PUT",
  body: unknown
): Promise<{ ok: boolean; error?: string }> {
  const t = await token();
  if (!t) return { ok: false, error: "Session expired. Sign in again." };
  try {
    const res = await fetch(path, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${t}`,
      },
      body: JSON.stringify(body),
    });
    if (res.ok) return { ok: true };
    let msg = "That action failed.";
    try {
      const j = (await res.json()) as { error?: string };
      if (j.error) msg = j.error;
    } catch {
      // keep default
    }
    return { ok: false, error: msg };
  } catch {
    return { ok: false, error: "Something went wrong. Try again." };
  }
}
