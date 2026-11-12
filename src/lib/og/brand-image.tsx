import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_ALT =
  "Orgaflow: estimate, invoice, and job software for small businesses";

/** Shared social card for the marketing site (Open Graph + Twitter). */
export function renderBrandImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        color: "#FFFFFF",
        backgroundColor: "#070A1A",
        backgroundImage:
          "radial-gradient(circle at 15% 10%, rgba(99,102,241,0.55), transparent 45%), radial-gradient(circle at 85% 0%, rgba(168,85,247,0.45), transparent 40%), radial-gradient(circle at 70% 90%, rgba(16,185,129,0.25), transparent 45%)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            fontWeight: 800,
            backgroundImage: "linear-gradient(135deg, #6366F1, #A855F7)",
          }}
        >
          O
        </div>
        <div style={{ fontSize: 38, fontWeight: 800 }}>Orgaflow</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
        <div
          style={{
            display: "flex",
            fontSize: 22,
            color: "#C7D2FE",
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          Quote → Approved → Paid → Done
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            fontSize: 84,
            fontWeight: 800,
            lineHeight: 1.02,
            letterSpacing: -3,
          }}
        >
          From the first quote to the finished job
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#CBD5E1" }}>
          Estimates, invoices, payments, and tasks in one place. Free plan.
        </div>
      </div>
    </div>,
    OG_SIZE,
  );
}
