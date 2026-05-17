"use client";

import type {
  PaymentRow,
  PaymentStats,
} from "@/lib/backend/payments";
import { PAYMENT_STATUSES } from "@/lib/backend/payments";
import { useAdminResource, adminMutate } from "@/lib/admin/use-admin-api";

type Payload = { payments: PaymentRow[]; stats: PaymentStats };

const STATUS_COLOR: Record<string, string> = {
  SUCCEEDED: "#22c55e",
  PENDING: "#eab308",
  FAILED: "#ef4444",
  REFUNDED: "#9aa0a6",
};

function money(cents: number, ccy = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: ccy,
  }).format(cents / 100);
}

export default function PaymentsPage() {
  const { data, loading, error, refetch } = useAdminResource<Payload>(
    "/api/admin/payments",
    ""
  );
  const payments = data?.payments ?? [];
  const stats = data?.stats;

  async function setStatus(id: string, status: string) {
    await adminMutate("/api/admin/payments", "PATCH", { id, status });
    await refetch();
  }

  async function remove(id: string) {
    await adminMutate("/api/admin/payments", "DELETE", { id });
    await refetch();
  }

  const cards = stats
    ? [
        {
          label: "Total revenue",
          value: money(stats.totalRevenueCents),
          color: "#C9A84C",
        },
        {
          label: "Succeeded",
          value: String(stats.succeeded),
          color: "#22c55e",
        },
        {
          label: "Pending",
          value: String(stats.pending),
          color: "#eab308",
        },
        {
          label: "Failed / Refunded",
          value: `${stats.failed} / ${stats.refunded}`,
          color: "#ef4444",
        },
      ]
    : [];

  return (
    <div>
      <h1 className="text-[22px] font-bold leading-tight text-[#F5F5F0] mb-1">
        Payments
      </h1>
      <p className="text-[13px] text-[rgba(245,245,240,0.45)] mb-5">
        Revenue and transaction status across memberships, events,
        sponsorships and listings.
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.1)] px-3.5 py-2.5 text-[12px] text-[#ef8c8c]">
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {(stats ? cards : [1, 2, 3, 4]).map((c, i) => (
          <div
            key={i}
            className="rounded-xl border border-[rgba(255,255,255,0.07)] bg-[#111111] p-4"
          >
            {typeof c === "object" ? (
              <>
                <div className="text-[10px] tracking-[1.5px] uppercase text-[rgba(245,245,240,0.45)] mb-2">
                  {c.label}
                </div>
                <div
                  className="text-[24px] font-bold"
                  style={{ color: c.color }}
                >
                  {c.value}
                </div>
              </>
            ) : (
              <div className="h-12 animate-pulse rounded bg-[rgba(255,255,255,0.04)]" />
            )}
          </div>
        ))}
      </div>

      {loading && payments.length === 0 ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-14 rounded-lg bg-[#111111] border border-[rgba(255,255,255,0.06)] animate-pulse"
            />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111111] p-12 text-center text-[13px] text-[rgba(245,245,240,0.45)]">
          No payments recorded yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[rgba(255,255,255,0.07)] bg-[#111111]">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {[
                  "Member",
                  "Type",
                  "Amount",
                  "Status",
                  "Date",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left text-[10px] tracking-[1.5px] uppercase text-[rgba(245,245,240,0.25)] px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] font-semibold"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr
                  key={p.id}
                  className="hover:bg-[rgba(201,168,76,0.04)]"
                >
                  <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-[13px]">
                    <div className="font-semibold text-[#F5F5F0]">
                      {p.memberName}
                    </div>
                    <div className="text-[11px] text-[rgba(245,245,240,0.45)]">
                      {p.memberEmail}
                    </div>
                  </td>
                  <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-[12px] text-[rgba(245,245,240,0.7)]">
                    {p.type.replace(/_/g, " ")}
                  </td>
                  <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-[13px] font-semibold text-[#F5F5F0]">
                    {money(p.amountCents, p.currency)}
                  </td>
                  <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)]">
                    <select
                      value={p.status}
                      onChange={(e) => setStatus(p.id, e.target.value)}
                      className="rounded-full bg-[rgba(255,255,255,0.06)] px-2 py-1 text-[11px] font-semibold outline-none cursor-pointer"
                      style={{ color: STATUS_COLOR[p.status] }}
                    >
                      {PAYMENT_STATUSES.map((s) => (
                        <option
                          key={s}
                          value={s}
                          style={{ color: "#F5F5F0" }}
                        >
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-[13px] text-[rgba(245,245,240,0.45)]">
                    {new Date(p.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-3.5 py-3 border-b border-[rgba(255,255,255,0.07)] text-right">
                    <button
                      type="button"
                      onClick={() => remove(p.id)}
                      className="text-[11px] font-semibold text-[rgba(245,245,240,0.45)] hover:text-[#ef4444]"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
