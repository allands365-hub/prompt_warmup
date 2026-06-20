import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "600", "900"],
  variable: "--font-display-face",
});
const body = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-body-face",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono-face",
});

export const metadata: Metadata = {
  title: "Aaj ka Kitchen — your day's cooking, planned",
  description:
    "Tell us about your day and get a personal cooking to-do list: meal plan, grocery receipt, smart substitutions, and a budget that actually adds up.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
