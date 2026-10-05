"use client"

export function Pagination({ pages, current, onChange }: { pages: number; current: number; onChange: (page: number) => void }) {
  if (pages <= 1) return null
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
      {Array.from({ length: pages }, (_, index) => index + 1).map((number) => (
        <button
          key={number}
          className={number === current ? "btn h-9 min-w-9 px-3" : "btn-line h-9 min-w-9 px-3"}
          type="button"
          onClick={() => onChange(number)}
        >
          {number}
        </button>
      ))}
    </div>
  )
}
