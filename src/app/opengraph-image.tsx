import { ImageResponse } from "next/og";

export const alt = "Orgaflow";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 20% 10%, rgba(0, 103, 255, 0.18), transparent 55%), radial-gradient(circle at 85% 35%, rgba(124, 58, 237, 0.16), transparent 45%), linear-gradient(135deg, #ffffff 0%, #f6f7fb 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
            padding: 64,
            borderRadius: 40,
            border: "1px solid rgba(0,0,0,0.06)",
            background: "rgba(255,255,255,0.85)",
            boxShadow:
              "0 22px 70px rgba(15,23,42,0.12), 0 1px 0 rgba(255,255,255,0.7) inset",
            maxWidth: 980,
            width: "92%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: "linear-gradient(135deg, #0067ff 0%, #7c3aed 100%)",
                boxShadow: "0 12px 32px rgba(0,103,255,0.25)",
              }}
            />
            <div
              style={{
                fontSize: 44,
                fontWeight: 800,
                letterSpacing: -1.2,
                color: "#0f172a",
              }}
            >
              Orgaflow
            </div>
          </div>

          <div
            style={{
              fontSize: 56,
              fontWeight: 800,
              letterSpacing: -1.6,
              lineHeight: 1.05,
              color: "#0f172a",
            }}
          >
            Estimates, invoices, payments, tasks, and automations in one place.
          </div>

          <div
            style={{
              fontSize: 26,
              fontWeight: 500,
              lineHeight: 1.35,
              color: "rgba(15,23,42,0.72)",
              maxWidth: 860,
            }}
          >
            Built for small businesses to run quoting-to-payment workflows with
            clarity and speed.
          </div>
        </div>
      </div>
    ),
    size,
  );
}

