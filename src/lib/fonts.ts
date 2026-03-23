import { Poppins } from "next/font/google";

/**
 * Poppins is not a variable font, so weights must be listed explicitly.
 * `variable` exposes `--font-sans` which Tailwind picks up via tailwind.config.ts.
 */
export const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-sans",
  display: "swap",
});
