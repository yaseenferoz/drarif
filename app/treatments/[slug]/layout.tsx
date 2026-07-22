import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GI Surgical Treatment",
  description:
    "Learn about specialist gastrointestinal and advanced laparoscopic treatment options with Dr. Arif Raza in Kalaburagi.",
};

export default function TreatmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
