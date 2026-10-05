import { ProfileForm } from "@/components/profile-form"
import { api, rethrow } from "@/lib/api"
import type { User } from "@/lib/types"

export const dynamic = "force-dynamic"

export default async function ProfilePage() {
  try {
    const me = await api<User>("/api/v1/auth/me")
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-4 text-xl font-semibold">Profil</h1>
        <ProfileForm me={me} />
      </div>
    )
  } catch (error) {
    rethrow(error)
    return <p>Ma&apos;lumot yuklanmadi.</p>
  }
}
