"use client"

import { useActionState } from "react"

import { login } from "@/actions/shop"

export function LoginForm() {
  const [state, action, pending] = useActionState(login, null)

  return (
    <form action={action} className="glass w-full max-w-sm px-6 py-8 ">
      <div className="mb-8 text-center">
        <h1 className="text-5xl font-extrabold italic leading-none tracking-[-0.05em] text-[#c6f135] drop-shadow-[0_0_22px_rgba(198,241,53,0.35)]">
          GERLAX
          <span className="align-super text-sm font-semibold not-italic">®</span>
        </h1>
        
      </div>
      <label className="mb-3 block text-sm text-white/70">
        Login
        <input className="field mt-1" name="login" type="text" autoComplete="username" required />
      </label>
      <label className="mb-4 block text-sm text-white/70">
        Parol
        <input className="field mt-1" name="password" type="password" autoComplete="current-password" required />
      </label>
      {state?.error ? <p className="mb-3 text-sm text-red-300">{state.error}</p> : null}
      <button className="btn w-full" type="submit" disabled={pending}>
        {pending ? "Kirish..." : "Kirish"}
      </button>
    </form>
  )
}
