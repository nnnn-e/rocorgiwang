import type { Metadata } from "next"
import "./globals.css"
import type React from "react"
import { Suspense } from "react"
import { Bricolage_Grotesque } from "next/font/google"
import LoadingIndicator from "@/components/LoadingIndicator"
import Script from "next/script"

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "Long Wang",
  description: "Personal AI Assistant - Your intelligent companion for productivity and creativity",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/icon-192x192.png",
  },
  manifest: "/manifest.json",
  themeColor: "#121212",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Long Wang AI",
  },
  openGraph: {
    title: "Long Wang - Personal AI Assistant",
    description: "An intelligent AI companion for productivity and creativity",
    url: "https://your-domain.com",
    siteName: "Long Wang AI",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Long Wang AI Assistant Interface",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Long Wang - Personal AI Assistant",
    description: "An intelligent AI companion for productivity and creativity",
    images: ["/twitter-image.png"],
    creator: "@yourusername",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={bricolageGrotesque.className}>
      <head>
        {/* 添加预连接和预加载 */}
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        {/* 如果使用CDN，添加预连接 */}
        <link rel="preconnect" href="https://your-cdn-url.com" crossOrigin="anonymous" />
        {/* 添加Midjourney CDN预连接 */}
        <link rel="preconnect" href="https://cdn.midjourney.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn.midjourney.com" />

        {/* Apple PWA meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Long Wang AI" />

        {/* Apple touch icons */}
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icon-192x192.png" />

        {/* 添加内联样式来覆盖 ReactMarkdown 的默认列表样式 */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
          /* 强制覆盖 ReactMarkdown 生成的列表标记颜色 */
          .premium-markdown ul li::marker,
          .premium-markdown ol li::marker {
            color: rgba(255, 255, 255, 0.6) !important;
          }

          /* 确保列表文本颜色正确 */
          .premium-markdown ul li,
          .premium-markdown ol li {
            color: rgba(255, 255, 255, 0.8) !important;
          }

          /* 移除 Tailwind prose 的默认列表样式 */
          .premium-markdown .prose ol,
          .premium-markdown .prose ul {
            list-style-type: revert !important;
            margin-left: 1.5rem !important;
          }

          /* 确保代码块内的文本颜色正确 */
          .premium-markdown pre code {
            color: rgba(255, 255, 255, 0.8) !important;
          }
        `,
          }}
        />
      </head>
      <body>
        <Suspense fallback={<LoadingIndicator />}>{children}</Suspense>

        {/* 注册 Service Worker */}
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(
                  function(registration) {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                  },
                  function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                  }
                );
              });
            }
          `}
        </Script>
      </body>
    </html>
  )
}
