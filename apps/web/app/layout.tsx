import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/navigation/navbar";

const siteUrl = "https://ghardekho.tech";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "GharDekho | Find a place that feels like home", template: "%s | GharDekho" },
  description: "Discover considered homes, apartments and properties across India with GharDekho.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "GharDekho",
    title: "GharDekho | Find a place that feels like home",
    description: "Discover considered homes, apartments and properties across India.",
    images: [{ url: "/brand/ghardekhologo.png", width: 2172, height: 724, alt: "GharDekho — Find a place that feels like home" }],
  },
  twitter: { card: "summary_large_image", title: "GharDekho", description: "Find a place that feels like home." },
  icons: { icon: "/brand/favicon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#fafaf8",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN">
      <body>
        <a className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-white focus:p-3" href="#main">Skip to content</a>
        <Navbar />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
