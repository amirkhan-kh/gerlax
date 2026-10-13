"use client"

export function QtyStepper({
  value,
  onChange,
  max = 100000,
}: {
  value: number
  onChange: (value: number) => void
  max?: number
}) {
  return (
    <div className="stepper">
      <button type="button" aria-label="Kamaytirish" disabled={value <= 1} onClick={() => onChange(Math.max(1, value - 1))}>
        −
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        aria-label="Soni"
        placeholder="1"
        value={value || ""}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, "")
          onChange(digits ? Math.min(max, Number(digits)) : 0)
        }}
        onBlur={() => {
          if (value < 1) onChange(1)
        }}
        onFocus={(event) => event.target.select()}
      />
      <button type="button" aria-label="Ko'paytirish" disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}>
        +
      </button>
    </div>
  )
}
