"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
    _fbq: unknown;
  }
}

function PixelPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Persistir UTMs no localStorage sempre que chegarem na URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const utms: Record<string, string> = {};
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach((key) => {
      const val = params.get(key);
      if (val) utms[key] = val;
    });
    if (Object.keys(utms).length > 0) {
      localStorage.setItem("plugfacil_utms", JSON.stringify(utms));
    }
  }, [searchParams]);

  // Disparar PageView a cada mudança de rota
  useEffect(() => {
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "PageView");
    }
  }, [pathname, searchParams]);

  return null;
}

export function MetaPixel() {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  if (!pixelId) return null;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${pixelId}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
      <Suspense>
        <PixelPageView />
      </Suspense>
    </>
  );
}

// Helpers para disparar eventos do Pixel em componentes client
export function trackLead(email?: string) {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("track", "Lead", email ? { em: email } : {});
}

export function trackInitiateCheckout(value: number, currency = "BRL") {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("track", "InitiateCheckout", { value, currency });
}
