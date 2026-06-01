import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

const appName = "소원권역 동행이동 OS";
const appDescription = "공동예약형 생활이동 및 동행링커 운영관리 시스템";
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");
const ogImage = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "소원권역 동행이동 OS 대표 이미지",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: appName,
  description: appDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: appName,
    description: appDescription,
    url: "/",
    siteName: appName,
    images: [ogImage],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: appName,
    description: appDescription,
    images: [ogImage],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7faf7",
};

const preferenceBootScript = `(function(){try{var d=document.documentElement;var allowed=['smaller-3','smaller-2','smaller-1','normal','larger-1','larger-2','larger-3'];var legacy={large:'larger-1',xlarge:'larger-2'};var colors={clear:'#f7faf7',blue:'#f6fbff',warm:'#fffaf2'};var s=localStorage.getItem('together.fontScale');var c=localStorage.getItem('together.contrast');var t=localStorage.getItem('together.theme');s=allowed.indexOf(s)>=0?s:(legacy[s]||'normal');t=(t==='blue'||t==='warm')?t:'clear';d.setAttribute('data-font-scale',s);d.setAttribute('data-contrast',c==='high'?'high':'normal');d.setAttribute('data-theme',t);var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',colors[t]);if(legacy[localStorage.getItem('together.fontScale')])localStorage.setItem('together.fontScale',s);}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html data-contrast="normal" data-font-scale="normal" data-theme="clear" lang="ko" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: preferenceBootScript }} />
        {children}
      </body>
    </html>
  );
}
