"use client"

import Link, { useLinkStatus } from "next/link"
import { usePathname } from "next/navigation"

const LINKS = [
  { href: "/", label: "Tovarlar" },
  { href: "/sales", label: "Sotuvlar" },
  { href: "/archive", label: "Arxiv" },
  { href: "/admin", label: "Boshqaruv", admin: true },
  { href: "/profile", label: "Profil" },
]

function Pending() {
  const { pending } = useLinkStatus()
  return pending ? <span className="nav-pending" aria-hidden="true" /> : null
}

export function NavLinks({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()
  return (
    <>
      {LINKS.filter((item) => !item.admin || isAdmin).map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
        return (
          <Link key={item.href} className="nav-link" href={item.href} aria-current={active ? "page" : undefined}>
            {item.label}
            <Pending />
          </Link>
        )
      })}
    </>
  )
}
