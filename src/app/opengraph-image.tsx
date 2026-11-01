import { ImageResponse } from "next/og";

export const alt =
  "Orgaflow: estimate and invoice software for small businesses";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: "#FFD84D",
        color: "#13142A",
      }}
    >
      <div style={{ fontSize: 40, fontWeight: 800 }}>Orgaflow</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{
            fontSize: 104,
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: -4,
          }}
        >
          Quote it. Get paid. Do the work.
        </div>
        <div style={{ fontSize: 34 }}>
          Estimate and invoice software for small businesses
        </div>
      </div>
    </div>,
    size,
  );
}
