import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { navigationItems } from "@/lib/navigation";
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

const preferenceBootScript = `(function(){try{var d=document.documentElement;var s=localStorage.getItem('together.fontScale');var c=localStorage.getItem('together.contrast');var t=localStorage.getItem('together.theme');d.setAttribute('data-font-scale',(s==='large'||s==='xlarge')?s:'normal');d.setAttribute('data-contrast',c==='high'?'high':'normal');d.setAttribute('data-theme',(t==='blue'||t==='warm')?t:'clear');}catch(e){}})();`;
const mobileSwipeNavigationScript = `(function(){var items=${JSON.stringify(navigationItems.map((item) => item.href))};var media=window.matchMedia('(max-width: 560px)');var reduce=window.matchMedia('(prefers-reduced-motion: reduce)');var selector='a,button,input,select,textarea,label,summary,[contenteditable="true"],[role="button"],[role="tab"],.bottom-nav,.nav-strip,.mobile-settings,.modal-backdrop';var threshold=72;var ratio=1.35;var point=null;var lastAt=0;var navigating=false;var transitionMs=240;function setRoot(name,value){document.documentElement.setAttribute(name,value);}function clearRoot(name){document.documentElement.removeAttribute(name);}function directionName(dir){return dir>0?'forward':'back';}function markEnter(){try{var direction=sessionStorage.getItem('together.swipeDirection');if(!direction)return;sessionStorage.removeItem('together.swipeDirection');if(!media.matches||reduce.matches)return;setRoot('data-swipe-enter',direction);window.setTimeout(function(){clearRoot('data-swipe-enter');},320);}catch(e){}}if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',markEnter,{once:true});}else{markEnter();}function active(){var p=window.location.pathname;if(p==='/admin')p='/';var i=items.indexOf(p);return i>=0?i:0;}function blocked(target){return !document.querySelector('.app-shell')||target instanceof Element&&!!target.closest(selector);}function move(next,dir){if(!next||next===window.location.pathname||navigating)return;navigating=true;var direction=directionName(dir);try{sessionStorage.setItem('together.swipeDirection',direction);}catch(e){}if(reduce.matches){window.location.assign(next);return;}clearRoot('data-swipe-enter');setRoot('data-swipe-transition',direction);window.setTimeout(function(){window.location.assign(next);},transitionMs);window.setTimeout(function(){clearRoot('data-swipe-transition');navigating=false;},900);}function done(x,y){if(!point||!media.matches)return;var dx=x-point.x;var dy=y-point.y;var ax=Math.abs(dx);var ay=Math.abs(dy);point=null;if(ax<threshold||ax<ay*ratio)return;var now=Date.now();if(now-lastAt<700)return;lastAt=now;var dir=dx<0?1:-1;move(items[(active()+dir+items.length)%items.length],dir);}document.addEventListener('touchstart',function(e){if(!media.matches||e.touches.length!==1||blocked(e.target))return;var t=e.touches[0];point={x:t.clientX,y:t.clientY};},{passive:true});document.addEventListener('touchend',function(e){var t=e.changedTouches[0];if(t)done(t.clientX,t.clientY);},{passive:true});document.addEventListener('touchcancel',function(){point=null;},{passive:true});document.addEventListener('pointerdown',function(e){if(!media.matches||e.button!==0||e.pointerType==='pen'||blocked(e.target))return;point={x:e.clientX,y:e.clientY,id:e.pointerId};},{passive:true});document.addEventListener('pointerup',function(e){if(point&&point.id!==undefined&&point.id!==e.pointerId)return;done(e.clientX,e.clientY);},{passive:true});document.addEventListener('pointercancel',function(){point=null;},{passive:true});})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html data-contrast="normal" data-font-scale="normal" data-theme="clear" lang="ko" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: preferenceBootScript }} />
        <script dangerouslySetInnerHTML={{ __html: mobileSwipeNavigationScript }} />
        {children}
      </body>
    </html>
  );
}
