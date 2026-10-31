import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { getContent } from "@/lib/store";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mainflow-school.vercel.app";

// School content is edited from the admin dashboard and stored on disk — render
// pages per request so published changes appear immediately (no rebuild needed).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Mainflow School | Private School in Ngong, Kajiado County",
    template: "%s | Mainflow School, Ngong",
  },
  description:
    "Mainflow School is a private school in Ngong, Kajiado County, Kenya, offering a caring, disciplined and academically strong foundation for young learners. Call 0725 958 589.",
  keywords: [
    "Mainflow School",
    "Mainflow School Ngong",
    "private primary schools in Ngong",
    "private school Ngong Kajiado",
    "primary school Kajiado County",
    "private school admissions Ngong Kenya",
  ],
  authors: [{ name: "Mainflow School" }],
  creator: "Mainflow School",
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: SITE_URL,
    siteName: "Mainflow School",
    title: "Mainflow School | Private School in Ngong, Kajiado County",
    description:
      "A private school in Ngong, Kajiado County, Kenya — strong academic foundations, good values and a caring environment.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mainflow School | Ngong, Kajiado County",
    description:
      "A private school in Ngong, Kajiado County, Kenya. Admissions enquiries welcome — call 0725 958 589.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#5a1521",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const content = getContent();
  const { site } = content;
  const activeAnnouncements = content.announcements
    .filter((a) => a.active)
    .map(({ id, title, body }) => ({ id, title, body }));

  const phoneJsonLd = site.phones.map((p) => `+254${p.replace(/[^\d]/g, "").replace(/^0/, "")}`);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "School",
    name: site.name,
    description:
      "Private school in Ngong, Kajiado County, Kenya, offering classes from early years through Grade 9 with a strong academic foundation and caring environment.",
    url: SITE_URL,
    email: site.email,
    telephone: phoneJsonLd,
    postalAddress: {
      "@type": "PostalAddress",
      streetAddress: site.postalAddress,
      addressLocality: "Ngong Hills",
      addressRegion: "Kajiado County",
      addressCountry: "KE",
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Ngong",
      addressRegion: "Kajiado County",
      addressCountry: "KE",
    },
    areaServed: [
      { "@type": "Place", name: "Ngong" },
      { "@type": "Place", name: "Kajiado County" },
      { "@type": "Place", name: "Kenya" },
    ],
    sameAs: [] as string[],
  };

  return (
    <html lang="en">
      <head>
        <link rel="preload" as="font" type="font/woff2" href="/fonts/poppins-700.woff2" crossOrigin="anonymous" />
        <link rel="preload" as="font" type="font/woff2" href="/fonts/inter-400.woff2" crossOrigin="anonymous" />
        <link rel="stylesheet" href="/fonts/fonts.css" />
        <script
          type="application/ld+json"
          // Static, verified school data only — no personal information.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="flex min-h-screen flex-col bg-white antialiased">
        <AnnouncementBar announcements={activeAnnouncements} />
        <Navbar />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
        <WhatsAppButton />
      </body>
    </html>
  );
}
