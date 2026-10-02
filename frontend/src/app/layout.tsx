import type { Metadata } from "next"

import "./globals.css"

export const metadata: Metadata = {
  title: "Gerlax",
  description: "Beyond your Imagination.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" className="dark h-full" suppressHydrationWarning>
      <body className="min-h-full antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem("gerlax-theme")==="light"){document.documentElement.classList.remove("dark");document.documentElement.classList.add("light")}}catch(e){}})()`,
          }}
        />
        {children}
      </body>
    </html>
  )
}
