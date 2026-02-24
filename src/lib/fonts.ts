import { Open_Sans, Poppins } from "next/font/google";

export const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700", "800"],
});

export const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
});
