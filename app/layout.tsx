import type { Metadata } from "next";
import { SiteChrome } from "@/components/site-chrome";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://drarif.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Dr. Arif Raza | Gastrointestinal Surgeon in Kalaburagi",
    template: "%s | Dr. Arif Raza",
  },
  description:
    "Dr. Arif Raza is a gastrointestinal, GI oncology, HPB and advanced laparoscopic surgeon at NK Hospital, Kalaburagi. Book a specialist consultation.",
  keywords: [
    "Dr Arif Raza",
    "Dr Arif Raza Kalaburagi",
    "gastroenterologist in Kalaburagi",
    "GI surgeon in Kalaburagi",
    "laparoscopic surgeon Kalaburagi",
    "GI oncology surgeon Karnataka",
  ],
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Dr. Arif Raza",
    title: "Dr. Arif Raza | Gastrointestinal Surgeon in Kalaburagi",
    description:
      "Specialist gastrointestinal, GI oncology, HPB and advanced laparoscopic care at NK Hospital, Kalaburagi.",
    locale: "en_IN",
    images: [
      {
        url: "/assets/img/gastroarif.png",
        width: 1200,
        height: 630,
        alt: "Dr. Arif Raza",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dr. Arif Raza | Gastrointestinal Surgeon in Kalaburagi",
    description:
      "Specialist GI, HPB, GI oncology and advanced laparoscopic surgical care.",
    images: ["/assets/img/gastroarif.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon: "/assets/img/gastroarif-mark.png",
    shortcut: "/assets/img/gastroarif-mark.png",
    apple: "/assets/img/gastroarif-mark.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Physician",
    name: "Dr. Arif Raza",
    url: siteUrl,
    image: `${siteUrl}/assets/img/gastroarif.png`,
    description:
      "Gastrointestinal, GI oncology, HPB and advanced laparoscopic surgeon in Kalaburagi.",
    medicalSpecialty: ["Gastroenterology", "Surgery", "Oncology"],
    telephone: "+91 91879 66771",
    email: "dr.raza@nkhospital.in",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Kalaburagi",
      addressRegion: "Karnataka",
      addressCountry: "IN",
    },
    sameAs: [
      "https://www.instagram.com/dr.raza.gastro/?hl=en",
      "https://www.linkedin.com/in/dr-raza-ahmed-cancer-gi-surgeon-kalaburagi/",
      "https://www.youtube.com/watch?v=PaOw-1U30NM",
    ],
    worksFor: { "@type": "Hospital", name: "NK Hospital" },
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body suppressHydrationWarning>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
