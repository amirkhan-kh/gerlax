import Link from "next/link"

import { logout } from "@/actions/shop"
import { Toaster } from "@/components/toast"
import { getMe, rethrow } from "@/lib/api"
import { roleLabel, type User } from "@/lib/types"

import { LiveRefresh } from "./_components/live-refresh"
import { NavLinks } from "./_components/nav-links"
import { ThemeToggle } from "./_components/theme-toggle"

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  let me: User
  try {
    me = await getMe()
  } catch (error) {
    rethrow(error)
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <p>Server bilan aloqa yo&apos;q.</p>
      </main>
    )
  }

  return (
    <div className="min-h-full">
      <LiveRefresh />
      <Toaster />
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#12100d]/75 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5">
          <Link href="/" className="py-1 text-2xl font-extrabold italic tracking-[-0.04em] text-[#c6f135]">
            GERLAX
          </Link>
          <p className="text-xs text-white/50">
            {me.name} · {roleLabel(me.role)}
          </p>
          <nav className="ml-auto flex flex-wrap items-center gap-1 text-sm">
            <NavLinks isAdmin={me.role === "admin"} />
            <ThemeToggle />
            <form action={logout}>
              <button className="nav-link border border-white/15" type="submit">
                Chiqish
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-4 pb-24">{children}</main>
    </div>
  )
}
