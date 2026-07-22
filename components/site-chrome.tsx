"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { DoctorLoader } from "@/components/doctor-loader";
import { ContentProvider } from "@/components/content-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ScrollToTop } from "@/components/scroll-to-top";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [booting, setBooting] = useState(true);
  const isAdmin = pathname?.startsWith("/admin");

  useEffect(() => {
    const timer = window.setTimeout(() => setBooting(false), 850);
    return () => window.clearTimeout(timer);
  }, []);

  if (isAdmin)
    return (
      <>
        {booting && <DoctorLoader />}
        <main className="admin-page-root">{children}</main>
      </>
    );

  return (
    <ContentProvider>
      {booting && <DoctorLoader />}
      <Header />
      <main>{children}</main>
      <Footer />
      <ScrollToTop />
    </ContentProvider>
  );
}
