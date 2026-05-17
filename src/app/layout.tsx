import type { Metadata } from "next";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import "./globals.css";
import { SiteChrome } from "@/components/site-chrome";

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
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
