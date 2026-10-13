import { ProfileForm } from "@/components/profile-form"
import { getMe, rethrow } from "@/lib/api"

export const dynamic = "force-dynamic"

export default async function ProfilePage() {
  try {
    const me = await getMe()
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
