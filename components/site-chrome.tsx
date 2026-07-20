"use client";

import { usePathname } from "next/navigation";
import { ContentProvider } from "@/components/content-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export function SiteChrome({children}:{children:React.ReactNode}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) return <main className="admin-page-root">{children}</main>;

  return (
    <ContentProvider>
      <Header/>
      <main>{children}</main>
      <Footer/>
    </ContentProvider>
  );
}
