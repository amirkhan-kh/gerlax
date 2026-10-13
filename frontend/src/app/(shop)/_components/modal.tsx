export function Modal({
  title,
  onClose,
  children,
}: {
  title: React.ReactNode
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/60 p-3 sm:items-center" onClick={onClose}>
      <div
        className="glass max-h-[90vh] w-full max-w-md overflow-auto p-5"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-2xl leading-none text-white/70 hover:text-white"
            type="button"
            aria-label="Yopish"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
