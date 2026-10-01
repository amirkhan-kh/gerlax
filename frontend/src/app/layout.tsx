import type { Metadata } from "next"

import "./globals.css"

export const metadata: Metadata = {
  title: "Gerlax",
  description: "Beyond your Imagination.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" className="h-full">
      <body className="min-h-full antialiased">{children}</body>
    </html>
  )
}
