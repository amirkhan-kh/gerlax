import Link from "next/link"

import { logout } from "@/actions/shop"
import { api, rethrow } from "@/lib/api"
import { roleLabel, type User } from "@/lib/types"

import { LiveRefresh } from "./_components/live-refresh"

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  let me: User
  try {
    me = await api<User>("/api/v1/auth/me")
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
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#12100d]/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
          <Link href="/" className="text-2xl font-extrabold italic tracking-[-0.04em] text-[#c6f135]">
            GERLAX
          </Link>
          <p className="text-xs text-white/50">
            {me.name} · {roleLabel(me.role)}
          </p>
          <nav className="ml-auto flex flex-wrap items-center gap-2 text-sm">
            <Link className="rounded-full px-3 py-1 text-white/80" href="/">
              Tovarlar
            </Link>
            <Link className="rounded-full px-3 py-1 text-white/80" href="/sales">
              Sotuvlar
            </Link>
            {me.role === "admin" ? (
              <Link className="rounded-full px-3 py-1 text-white/80" href="/admin">
                Boshqaruv
              </Link>
            ) : null}
            <form action={logout}>
              <button className="rounded-full border border-white/15 px-3 py-1" type="submit">
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
