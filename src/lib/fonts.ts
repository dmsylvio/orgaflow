import { Kalam, Poppins, Schibsted_Grotesk } from "next/font/google";

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

/** Marketing site only. The app keeps Poppins. */
export const schibsted = Schibsted_Grotesk({
  subsets: ["latin"],
  variable: "--font-marketing",
  display: "swap",
});

/** Handwritten values on the sample carbon-copy estimate. */
export const kalam = Kalam({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-hand",
  display: "swap",
});
