"use client"

import { useState } from "react"

import { updateProfile } from "@/actions/shop"
import { compress } from "@/lib/image"
import { roleLabel, type User } from "@/lib/types"

export function ProfileForm({ me }: { me: User }) {
  const [avatar, setAvatar] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)
  const [pending, setPending] = useState(false)
  const shown = avatar === null ? me.avatar : avatar

  async function pick(file: File | undefined) {
    if (!file) return
    const dataUrl = await compress(file, 640)
    if (!dataUrl) {
      setError("Rasm formati qo'llab-quvvatlanmaydi")
      return
    }
    setError("")
    setSaved(false)
    setAvatar(dataUrl)
  }

  async function onSave(formData: FormData) {
    setPending(true)
    const result = await updateProfile(formData)
    setPending(false)
    if ("error" in result) {
      setError(result.error)
      setSaved(false)
      return
    }
    setError("")
    setAvatar(null)
    setSaved(true)
  }

  return (
    <form className="card grid gap-5 p-4 sm:grid-cols-[200px_1fr] sm:p-5" action={onSave}>
      {avatar !== null ? <input type="hidden" name="avatar" value={avatar} /> : null}
      <div className="flex flex-col gap-2">
        <div className="mx-auto aspect-square w-full max-w-[220px] overflow-hidden rounded-2xl border border-white/10 bg-black/25">
          {shown ? (
            <img className="h-full w-full object-contain" src={shown} alt="" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-5xl font-semibold text-white/30">
              {me.name.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
        <label className="btn-ghost relative cursor-pointer text-center">
          Galereyadan yuklash
          <input
            className="absolute inset-0 cursor-pointer opacity-0"
            type="file"
            accept="image/*"
            onChange={(event) => pick(event.target.files?.[0])}
          />
        </label>
        {shown ? (
          <button
            className="text-sm text-white/55 hover:text-white/85"
            type="button"
            onClick={() => {
              setSaved(false)
              setAvatar("")
            }}
          >
            Rasmni o&apos;chirish
          </button>
        ) : null}
      </div>
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-lg font-semibold">{me.name}</p>
          <p className="text-sm text-white/55">
            {roleLabel(me.role)} · {me.login}
          </p>
        </div>
        <label className="block text-sm text-white/70">
          Ism
          <input className="field mt-1" name="name" defaultValue={me.name} required />
        </label>
        <label className="block text-sm text-white/70">
          Telefon raqam
          <input className="field mt-1" name="phone" type="tel" defaultValue={me.phone} required />
        </label>
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        {saved ? <p className="text-sm text-emerald-500">Saqlandi</p> : null}
        <button className="btn mt-auto sm:self-start sm:px-8" type="submit" disabled={pending}>
          Saqlash
        </button>
      </div>
    </form>
  )
}
