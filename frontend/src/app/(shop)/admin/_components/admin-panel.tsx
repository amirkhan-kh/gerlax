"use client"

import { useEffect, useState } from "react"

import { createType, createUser, deleteUser, updateUser } from "@/actions/shop"
import { ProfileForm } from "@/components/profile-form"
import { duration, money, when } from "@/lib/format"
import {
  ROLES,
  roleLabel,
  type Product,
  type ProductType,
  type Sale,
  type SalesSummary,
  type User,
  type UserStat,
} from "@/lib/types"

const TABS = [
  { id: "overview", label: "Umumiy" },
  { id: "staff", label: "Xodimlar" },
  { id: "types", label: "Turlar" },
  { id: "profile", label: "Profil" },
] as const

type Tab = (typeof TABS)[number]["id"]

const ONLINE_MS = 2 * 60 * 1000

type Result = { error: string } | { ok: true }

export function AdminPanel({
  me,
  users,
  stats,
  types,
  products,
  sales,
  summary,
}: {
  me: User
  users: User[]
  stats: UserStat[]
  types: ProductType[]
  products: Product[]
  sales: Sale[]
  summary: SalesSummary
}) {
  const [tab, setTab] = useState<Tab>("overview")
  const [error, setError] = useState("")
  const [modal, setModal] = useState<User | "new" | null>(null)
  const [pending, setPending] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15000)
    return () => clearInterval(timer)
  }, [])

  const debt = sales.reduce((sum, sale) => sum + sale.debt_amount, 0)
  const statOf = new Map(stats.map((item) => [item.user_id, item]))
  const online = (stat: UserStat | undefined) =>
    Boolean(stat?.last_seen_at && now - new Date(stat.last_seen_at).getTime() < ONLINE_MS)
  const onlineCount = users.filter((user) => online(statOf.get(user.id))).length
  const monthSales = stats.reduce((sum, item) => sum + item.sales_count, 0)
  const monthRevenue = stats.reduce((sum, item) => sum + item.sales_sum, 0)

  async function run(action: (formData: FormData) => Promise<Result>, formData: FormData) {
    setPending(true)
    const result = await action(formData)
    setPending(false)
    if ("error" in result) {
      setError(result.error)
      return
    }
    setError("")
    setModal(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">Boshqaruv</h1>
          <p className="text-sm text-white/55">Xodimlar, tovar turlari va profil</p>
        </div>
      </div>

      <div className="tabs" role="tablist">
        {TABS.map((item) => (
          <button
            key={item.id}
            className="tab"
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => {
              setTab(item.id)
              setError("")
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <Stat label="Xodimlar" value={String(users.length)} hint={`${onlineCount} ta onlayn`} />
          <Stat label="Tovarlar" value={String(products.length)} hint="Sotuvda va buyurtmada" />
          <Stat label="Sotuvlar" value={String(sales.filter((sale) => sale.status === "sold").length)} hint="Qaytarilganlarsiz" />
          <Stat label="Bu oy sotuv" value={String(monthSales)} hint="Qaytarilganlarsiz" />
          <Stat label="Bu oy tushum" value={money(monthRevenue)} hint="Sof, qaytarishlarsiz" />
          <Stat label="Nasiya" value={money(debt)} hint="Qolgan qarz" />
          <Stat label="Bu oy qaytarilgan" value={String(summary.month_returns)} hint={`${money(summary.month_refund)} qaytarildi`} />
          <Stat
            label="Bu oy bekor qilingan"
            value={String(summary.month_cancellations)}
            hint={`${summary.month_archived} tasi arxivda`}
          />
        </div>
      ) : null}

      {tab === "staff" ? (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-white/60">
              Jami <span className="font-semibold text-white/90">{users.length}</span> ta xodim ·{" "}
              <span className="text-emerald-500">{onlineCount} onlayn</span>
            </p>
            <button
              className="btn shrink-0 px-4 py-2 text-sm"
              type="button"
              onClick={() => {
                setError("")
                setModal("new")
              }}
            >
              + Yangi xodim
            </button>
          </div>

          <div className="card hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-[11px] uppercase tracking-[0.06em] text-white/45">
                  <th className="px-4 py-3 font-medium">Xodim</th>
                  <th className="px-4 py-3 font-medium">Telefon</th>
                  <th className="px-4 py-3 font-medium">Login</th>
                  <th className="px-4 py-3 font-medium">Bu oy faol</th>
                  <th className="px-4 py-3 font-medium">Bu oy sotuv</th>
                  <th className="px-4 py-3 font-medium">Oxirgi faollik</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const stat = statOf.get(user.id)
                  return (
                    <tr key={user.id} className="border-b border-white/10 last:border-0">
                      <td className="px-4 py-3">
                        <Person user={user} online={online(stat)} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-white/75">{user.phone}</td>
                      <td className="px-4 py-3 text-white/75">{user.login}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{duration(stat?.active_seconds ?? 0)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-semibold">{stat?.sales_count ?? 0} ta</span>
                        <span className="block text-xs text-white/50">{money(stat?.sales_sum ?? 0)}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-white/60">
                        {online(stat) ? "Hozir" : stat?.last_seen_at ? when(stat.last_seen_at) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Actions user={user} me={me} pending={pending} onEdit={() => setModal(user)} onDelete={(fd) => run(deleteUser, fd)} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:hidden">
            {users.map((user) => {
              const stat = statOf.get(user.id)
              return (
                <article key={user.id} className="card flex flex-col gap-3 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <Person user={user} online={online(stat)} />
                    <Actions user={user} me={me} pending={pending} onEdit={() => setModal(user)} onDelete={(fd) => run(deleteUser, fd)} />
                  </div>
                  <dl className="grid grid-cols-3 gap-2 rounded-xl border border-white/10 p-2 text-center">
                    <Metric label="Bu oy faol" value={duration(stat?.active_seconds ?? 0)} />
                    <Metric label="Bu oy sotuv" value={`${stat?.sales_count ?? 0} ta`} />
                    <Metric
                      label="Oxirgi"
                      value={online(stat) ? "Hozir" : stat?.last_seen_at ? when(stat.last_seen_at) : "—"}
                    />
                  </dl>
                  <p className="flex flex-wrap gap-x-3 text-xs text-white/55">
                    <span>{user.phone}</span>
                    <span>Login: {user.login}</span>
                  </p>
                </article>
              )
            })}
          </div>
          {error && modal === null ? <p className="text-sm text-red-300">{error}</p> : null}
        </section>
      ) : null}

      {tab === "types" ? (
        <section className="card flex flex-col gap-4 p-4">
          <form className="flex gap-2" action={(formData) => run(createType, formData)}>
            <input className="field" name="name" placeholder="Yangi tovar turi" required />
            <button className="btn shrink-0 px-5" type="submit" disabled={pending}>
              Qo&apos;shish
            </button>
          </form>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.06em] text-white/45">
              Mavjud turlar · {types.length}
            </p>
            <div className="flex flex-wrap gap-2">
              {types.map((item) => (
                <span key={item.id} className="rounded-lg border border-white/10 px-3 py-1.5 text-sm">
                  {item.name}
                </span>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {tab === "profile" ? <ProfileForm me={me} /> : null}

      {modal ? (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/60 p-3 sm:items-center" onClick={() => setModal(null)}>
          <form
            className="glass max-h-[90vh] w-full max-w-md overflow-auto p-5"
            action={(formData) => run(modal === "new" ? createUser : updateUser, formData)}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">{modal === "new" ? "Yangi xodim" : "Xodimni tahrirlash"}</h2>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full text-2xl leading-none text-white/70 hover:text-white"
                type="button"
                aria-label="Yopish"
                onClick={() => setModal(null)}
              >
                ×
              </button>
            </div>
            {modal !== "new" ? <input type="hidden" name="id" value={modal.id} /> : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm text-white/70 sm:col-span-2">
                Ism
                <input className="field mt-1" name="name" defaultValue={modal === "new" ? "" : modal.name} required />
              </label>
              <label className="block text-sm text-white/70">
                Telefon
                <input className="field mt-1" name="phone" type="tel" defaultValue={modal === "new" ? "" : modal.phone} required />
              </label>
              <label className="block text-sm text-white/70">
                Rol
                <select className="field mt-1" name="role" defaultValue={modal === "new" ? "sotuvchi" : modal.role}>
                  {ROLES.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm text-white/70">
                Login
                <input
                  className="field mt-1"
                  name="login"
                  type="text"
                  autoComplete="off"
                  defaultValue={modal === "new" ? "" : modal.login}
                  required
                />
              </label>
              <label className="block text-sm text-white/70">
                Parol
                <input
                  className="field mt-1"
                  name="password"
                  type="text"
                  autoComplete="new-password"
                  placeholder={modal === "new" ? "" : "O'zgarmaydi"}
                  required={modal === "new"}
                />
              </label>
            </div>
            {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
            <button className="btn mt-4 w-full" type="submit" disabled={pending}>
              {modal === "new" ? "Saqlash" : "Yangilash"}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  )
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card p-3 sm:p-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-white/45">{label}</p>
      <p className="mt-1 truncate text-lg font-semibold text-[#c6f135] sm:text-xl">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-white/50">{hint}</p> : null}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] uppercase tracking-[0.06em] text-white/45">{label}</dt>
      <dd className="mt-0.5 truncate text-xs font-semibold">{value}</dd>
    </div>
  )
}

function Person({ user, online }: { user: User; online: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="relative shrink-0">
        <div className="h-10 w-10 overflow-hidden rounded-full border border-white/10 bg-black/25">
          {user.avatar ? (
            <img className="h-full w-full object-cover" src={user.avatar} alt="" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-white/60">
              {user.name.slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>
        {online ? (
          <span className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 border-[#191713] bg-emerald-500" />
        ) : null}
      </div>
      <div className="min-w-0">
        <p className="truncate font-semibold">{user.name}</p>
        <p className="text-xs text-white/50">{roleLabel(user.role)}</p>
      </div>
    </div>
  )
}

function Actions({
  user,
  me,
  pending,
  onEdit,
  onDelete,
}: {
  user: User
  me: User
  pending: boolean
  onEdit: () => void
  onDelete: (formData: FormData) => void
}) {
  return (
    <div className="flex shrink-0 justify-end gap-1.5">
      <button className="btn-ghost px-3 py-1.5 text-xs" type="button" onClick={onEdit}>
        Tahrir
      </button>
      {user.id !== me.id ? (
        <form action={onDelete}>
          <input type="hidden" name="id" value={user.id} />
          <button className="rounded-full border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-400" type="submit" disabled={pending}>
            O&apos;chirish
          </button>
        </form>
      ) : null}
    </div>
  )
}
