export function Choice({
  active,
  title,
  text,
  onClick,
}: {
  active: boolean
  title: string
  text: string
  onClick: () => void
}) {
  return (
    <button
      className={`rounded-xl border p-3 text-left transition-colors ${active ? "border-[#c6f135] bg-[#c6f135]/10" : "border-white/10"}`}
      type="button"
      aria-pressed={active}
      onClick={onClick}
    >
      <span className="flex items-center gap-2 text-sm font-semibold">
        <span className={`h-3.5 w-3.5 shrink-0 rounded-full border-2 ${active ? "border-[#c6f135] bg-[#c6f135]" : "border-white/30"}`} />
        {title}
      </span>
      <span className="mt-1 block pl-5.5 text-xs text-white/55">{text}</span>
    </button>
  )
}
