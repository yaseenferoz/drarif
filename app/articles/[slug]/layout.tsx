import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Digestive Health Article",
  description: "Doctor-reviewed digestive health guidance from Dr. Arif Raza.",
};

export default function ArticleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
