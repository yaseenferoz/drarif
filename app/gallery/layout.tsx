import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clinic Gallery",
  description:
    "A look at Dr. Arif Raza’s specialist clinic, team and patient education resources at NK Hospital, Kalaburagi.",
};

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
