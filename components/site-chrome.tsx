"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { DoctorLoader } from "@/components/doctor-loader";
import { ContentProvider } from "@/components/content-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ScrollToTop } from "@/components/scroll-to-top";
import { getSupabase } from "@/lib/supabase";

const INACTIVITY_LIMIT = 60 * 60 * 1000;

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [booting, setBooting] = useState(true);
  const isAdmin = pathname?.startsWith("/admin");

  useEffect(() => {
    const timer = window.setTimeout(() => setBooting(false), 850);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const client = getSupabase();
    if (!client) return;

    let timeout: number | undefined;
    let signedIn = false;
    let activityScheduled = false;

    const signOutForInactivity = async () => {
      if (!signedIn) return;
      signedIn = false;
      await client.auth.signOut();
      window.location.assign("/login");
    };

    const armTimeout = () => {
      if (!signedIn) return;
      if (timeout) window.clearTimeout(timeout);
      timeout = window.setTimeout(signOutForInactivity, INACTIVITY_LIMIT);
    };

    const onActivity = () => {
      if (activityScheduled) return;
      activityScheduled = true;
      window.setTimeout(() => {
        activityScheduled = false;
        armTimeout();
      }, 500);
    };

    const activityEvents = [
      "pointerdown",
      "keydown",
      "touchstart",
      "scroll",
      "mousemove",
    ];
    activityEvents.forEach((event) =>
      window.addEventListener(event, onActivity, { passive: true }),
    );

    const authSubscription = client.auth.onAuthStateChange(
      (_event, session) => {
        signedIn = Boolean(session);
        armTimeout();
      },
    );

    client.auth.getSession().then(({ data }) => {
      signedIn = Boolean(data.session);
      armTimeout();
    });

    return () => {
      if (timeout) window.clearTimeout(timeout);
      activityEvents.forEach((event) =>
        window.removeEventListener(event, onActivity),
      );
      authSubscription.data.subscription.unsubscribe();
    };
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
