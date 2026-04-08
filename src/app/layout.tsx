import type { Metadata } from "next";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import "./globals.css";
import { LenisProvider } from "@/components/lenis-provider";
import { NoiseOverlay } from "@/components/noise-overlay";
import { CursorGlow } from "@/components/cursor-glow";
import { ScrollProgress } from "@/components/scroll-progress";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://toptiermiamiclub.com"),
  title: "Top Tier Miami Club",
  description:
    "The convoy is the experience. The dinner is the connection.",
  openGraph: {
    title: "Top Tier Miami Club",
    description: "The convoy is the experience. The dinner is the connection.",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col overflow-x-hidden bg-[var(--background)] font-sans text-[var(--foreground)]">
        <LenisProvider>
          {/* <NoiseOverlay /> */}
          <CursorGlow />
          <ScrollProgress />
          <Nav />
          <main className="flex-1">{children}</main>
          <Footer />
        </LenisProvider>
      </body>
    </html>
  );
}
