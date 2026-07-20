import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ContentProvider } from "@/components/content-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: { default:"Dr. Arif Raza | GI & Advanced Laparoscopic Surgeon", template:"%s | Dr. Arif Raza" },
  description:"Specialist gastrointestinal, GI oncology, HPB and advanced laparoscopic surgical care at NK Hospital, Kalaburagi."
};

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body><ContentProvider><Header/><main>{children}</main><Footer/></ContentProvider></body></html>;
}
