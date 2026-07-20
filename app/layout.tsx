import type { Metadata } from "next";
import { SiteChrome } from "@/components/site-chrome";
import "./globals.css";

export const metadata: Metadata = {
  title: { default:"Dr. Arif Raza | GI & Advanced Laparoscopic Surgeon", template:"%s | Dr. Arif Raza" },
  description:"Specialist gastrointestinal, GI oncology, HPB and advanced laparoscopic surgical care at NK Hospital, Kalaburagi.",
  icons: { icon:"/assets/img/gastroarif-mark.png", shortcut:"/assets/img/gastroarif-mark.png", apple:"/assets/img/gastroarif-mark.png" }
};

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en" suppressHydrationWarning><body suppressHydrationWarning><SiteChrome>{children}</SiteChrome></body></html>;
}
