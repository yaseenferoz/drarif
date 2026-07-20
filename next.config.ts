import type { NextConfig } from "next";

const legacy = [
  ["about.html", "/about"], ["appointment.html", "/booking"], ["treatments.html", "/treatments"],
  ["health-articles.html", "/articles"], ["contact.html", "/contact"], ["privacy-policy.html", "/privacy"],
  ["terms-conditions.html", "/terms"]
];

const treatmentSlugs = [
  "advanced-laparoscopic-surgery", "bariatric-surgery", "colonoscopy", "colorectal-surgery",
  "emergency-gi-surgery", "ercp", "gi-cancer-surgery", "hernia-surgery", "hpb-surgery",
  "laser-proctology", "upper-gi-endoscopy", "upper-gi-surgery"
];

const nextConfig: NextConfig = {
  distDir: "dist",
  images: { unoptimized: true },
  async redirects() {
    return [
      ...legacy.map(([source, destination]) => ({ source: `/${source}`, destination, permanent: true })),
      ...treatmentSlugs.map(slug => ({ source: `/${slug}.html`, destination: `/treatments/${slug}`, permanent: true }))
    ];
  }
};

export default nextConfig;
