export default function Loading() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Yuklanmoqda">
      <div className="skeleton h-8 w-40" />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="skeleton h-12" />
        <div className="skeleton h-12" />
        <div className="skeleton h-12" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="skeleton h-56" />
        ))}
      </div>
    </div>
  )
}
