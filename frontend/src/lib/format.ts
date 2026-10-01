export function money(value: number) {
  return `${new Intl.NumberFormat("uz-UZ").format(value)} so'm`
}

export function when(iso: string) {
  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tashkent",
  }).format(new Date(iso))
}
