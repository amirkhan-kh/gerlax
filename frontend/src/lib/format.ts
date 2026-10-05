export function money(value: number) {
  return `${new Intl.NumberFormat("uz-UZ").format(value)} so'm`
}

const MONTHS = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"]

export function when(iso: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone: "Asia/Tashkent",
    })
      .formatToParts(new Date(iso))
      .map((part) => [part.type, part.value]),
  )
  return `${parts.day}-${MONTHS[Number(parts.month) - 1]}, ${parts.hour}:${parts.minute}`
}

export function duration(seconds: number) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours === 0) return `${minutes} daq`
  return `${hours} soat ${minutes} daq`
}
