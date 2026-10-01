"use client"

import { useState } from "react"

import { createType, createUser, deleteUser, updateUser } from "@/actions/shop"
import { money } from "@/lib/format"
import { ROLES, roleLabel, type Product, type ProductType, type Sale, type User } from "@/lib/types"

export function AdminPanel({
  me,
  users,
  types,
  products,
  sales,
}: {
  me: User
  users: User[]
  types: ProductType[]
  products: Product[]
  sales: Sale[]
}) {
  const debt = sales.reduce((sum, sale) => sum + sale.debt_amount, 0)
  const [error, setError] = useState("")
  const [editing, setEditing] = useState<User | null>(null)
  const [pending, setPending] = useState(false)

  async function run(action: (formData: FormData) => Promise<{ error: string } | { ok: true }>, formData: FormData) {
    setPending(true)
    const result = await action(formData)
    setPending(false)
    if ("error" in result) {
      setError(result.error)
      return
    }
    setError("")
    setEditing(null)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold italic tracking-[-0.05em] text-[#c6f135]">GERLAX</h1>
        <p className="script text-2xl text-white/85">Beyond your Imagination.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Xodimlar" value={String(users.length)} />
        <Stat label="Tovarlar" value={String(products.length)} />
        <Stat label="Sotuvlar" value={String(sales.length)} />
        <Stat label="Nasiya" value={money(debt)} />
      </div>

      <section className="glass p-4">
        <h2 className="mb-3 text-lg font-semibold">Yangi xodim</h2>
        <form className="grid gap-3" action={(formData) => run(createUser, formData)}>
          <input className="field" name="name" placeholder="Ism" required />
          <input className="field" name="phone" type="tel" placeholder="Telefon" required />
          <input className="field" name="login" type="text" placeholder="Login" autoComplete="off" required />
          <input className="field" name="password" type="text" placeholder="Parol" autoComplete="new-password" required />
          <select className="field" name="role" defaultValue="sotuvchi">
            {ROLES.map((role) => (
              <option key={role.id} value={role.id}>
                {role.label}
              </option>
            ))}
          </select>
          <button className="btn" type="submit" disabled={pending}>
            Saqlash
          </button>
        </form>
      </section>

      <section className="space-y-3">
        {users.map((user) => (
          <article key={user.id} className="glass p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{user.name}</h3>
                <p className="text-sm text-white/60">
                  {roleLabel(user.role)} · {user.phone}
                </p>
                <p className="text-sm text-white/80">{user.login}</p>
              </div>
              <div className="flex gap-2">
                <button className="btn-line" type="button" onClick={() => setEditing(user)}>
                  Tahrir
                </button>
                {user.id !== me.id ? (
                  <form action={(formData) => run(deleteUser, formData)}>
                    <input type="hidden" name="id" value={user.id} />
                    <button className="btn-line" type="submit">
                      O&apos;chirish
                    </button>
                  </form>
                ) : null}
              </div>
            </div>
            {editing?.id === user.id ? (
              <form className="mt-3 grid gap-3" action={(formData) => run(updateUser, formData)}>
                <input type="hidden" name="id" value={user.id} />
                <input className="field" name="name" defaultValue={user.name} required />
                <input className="field" name="phone" type="tel" defaultValue={user.phone} required />
                <input className="field" name="login" type="text" defaultValue={user.login} required />
                <input className="field" name="password" type="text" placeholder="Yangi parol (bo'sh qolsa o'zgarmaydi)" />
                <select className="field" name="role" defaultValue={user.role}>
                  {ROLES.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.label}
                    </option>
                  ))}
                </select>
                <button className="btn" type="submit" disabled={pending}>
                  Yangilash
                </button>
              </form>
            ) : null}
          </article>
        ))}
      </section>

      <section className="glass p-4">
        <h2 className="mb-3 text-lg font-semibold">Tovar turlari</h2>
        <div className="mb-3 flex flex-wrap gap-2">
          {types.map((item) => (
            <span key={item.id} className="rounded-full border border-white/15 px-3 py-1 text-sm">
              {item.name}
            </span>
          ))}
        </div>
        <form className="flex gap-2" action={(formData) => run(createType, formData)}>
          <input className="field" name="name" placeholder="Yangi tur" required />
          <button className="btn shrink-0" type="submit" disabled={pending}>
            Qo&apos;shish
          </button>
        </form>
      </section>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass p-4">
      <p className="text-xs uppercase tracking-wide text-white/45">{label}</p>
      <p className="mt-1 text-xl font-semibold text-[#c6f135]">{value}</p>
    </div>
  )
}
