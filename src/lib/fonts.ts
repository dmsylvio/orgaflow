import { Plus_Jakarta_Sans } from "next/font/google";

/**
 * One typeface for the whole product (marketing site, auth, and app).
 * `variable` exposes `--font-sans`, which Tailwind picks up via tailwind.config.ts.
 */
export const appFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-sans",
  display: "swap",
});
