"use client"

import type React from "react"
import { Suspense } from "react"
import { Bricolage_Grotesque } from "next/font/google"
import AppLoadingManager from "@/components/AppLoadingManager"

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
})

export default function ClientLayout({
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
        {/* 添加内联关键CSS，确保页面结构立即显示 */}
        <style jsx global>{`
          body {
            margin: 0;
            padding: 0;
            font-family: inherit;
          }
          .page-container {
            display: flex;
            height: 100vh;
            width: 100%;
            overflow: hidden;
          }
          .left-container {
            width: 50%;
            height: 100%;
            position: relative;
            color: #ffffff;
            background-color: #000000; /* 临时背景色，等图片加载 */
          }
          .right-container {
            width: 50%;
            height: 100%;
            position: relative;
            background: #f5f5f5;
            border-left: 1px solid #e5e5e5;
          }
          .skeleton-text {
            height: 24px;
            background: rgba(0,0,0,0.05);
            margin: 8px 0;
            border-radius: 4px;
            animation: pulse 1.5s infinite;
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 0.8; }
          }
        `}</style>
        {/* 预加载第一张背景图片 */}
        <link rel="preload" href="https://cdn.midjourney.com/2acdc00d-1f4e-4404-be8b-ba82a3838e2f/0_3.png" as="image" />
        {/* 预加载第一个音频文件 */}
        <link rel="preload" href="https://files.catbox.moe/1nc8ou.mp3" as="audio" />
      </head>
      <body className="js-loading">
        <AppLoadingManager>
          <Suspense fallback={null}>{children}</Suspense>
        </AppLoadingManager>
      </body>
    </html>
  )
}
