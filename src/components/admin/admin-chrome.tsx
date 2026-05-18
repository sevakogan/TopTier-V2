"use client";

// Sidebar collapse state, shared by the bar and the content margin and
// persisted across sessions. Keeps the nav rail a single source of truth.

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const KEY = "ttmc.nav";

const Ctx = createContext<{ collapsed: boolean; toggle: () => void }>({
  collapsed: false,
  toggle: () => {},
});

export function AdminChromeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCollapsed(window.localStorage.getItem(KEY) === "mini");
    }
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(KEY, next ? "mini" : "full");
      }
      return next;
    });
  }

  return (
    <Ctx.Provider value={{ collapsed, toggle }}>{children}</Ctx.Provider>
  );
}

export const useAdminChrome = () => useContext(Ctx);
