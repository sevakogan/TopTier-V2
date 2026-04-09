"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user.email) {
        setEmail(session.user.email);
      }
    });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A]">
      <div className="text-center max-w-md">
        <div className="text-[11px] tracking-[4px] text-[#C9A84C] mb-6">
          TTMC ADMIN
        </div>
        <p className="text-[#F5F5F0] text-2xl font-bold mb-2">
          Welcome, Admin
        </p>
        <p className="text-[rgba(245,245,240,0.4)] text-sm mb-2">{email}</p>
        <p className="text-[rgba(245,245,240,0.3)] text-xs mb-8">
          CRM dashboard coming soon. Auth is connected.
        </p>
        <button
          onClick={() =>
            supabase.auth.signOut().then(() => router.push("/"))
          }
          className="rounded-lg px-6 py-2 text-[11px] tracking-[2px] font-semibold border border-[#C9A84C] text-[#C9A84C] bg-transparent transition-colors hover:bg-[#C9A84C] hover:text-[#0A0A0A]"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
