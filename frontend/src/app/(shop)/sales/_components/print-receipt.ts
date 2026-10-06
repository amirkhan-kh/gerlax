import { money } from "@/lib/format"
import type { Sale } from "@/lib/types"

const PAYMENT: Record<string, string> = {
  full: "To'liq",
  partial: "Qisman (nasiya)",
  cash: "Naqd",
}

function fullDate(iso: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Tashkent",
  }).format(new Date(iso))
}

function esc(value: string) {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`)
}

function row(label: string, value: string) {
  return `<div class="row"><span>${esc(label)}</span><span>${esc(value)}</span></div>`
}

export function printReceipt(sale: Sale) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Chek #${sale.id}</title>
<style>
  @page { size: 80mm auto; margin: 0; }
  * { box-sizing: border-box; }
  body { width: 72mm; margin: 0 auto; padding: 4mm 0; font: 12px/1.35 "Courier New", monospace; color: #000; }
  .c { text-align: center; }
  .b { font-weight: bold; }
  .big { font-size: 16px; }
  .hr { border-top: 1px dashed #000; margin: 6px 0; }
  .row { display: flex; justify-content: space-between; gap: 8px; }
  .row span:last-child { text-align: right; word-break: break-word; }
</style></head><body>
  <div class="c b big">GERLAX</div>
  <div class="c">Savdo cheki</div>
  <div class="hr"></div>
  ${row("Chek №", String(sale.id).padStart(6, "0"))}
  ${row("Sana", fullDate(sale.sold_at))}
  ${row("Sotuvchi", sale.sold_by_name)}
  <div class="hr"></div>
  <div class="b">${esc(sale.product_name)}</div>
  ${row("Turi", sale.type_name)}
  ${row("Rangi", sale.color)}
  ${row("1 x " + money(sale.price), money(sale.price))}
  <div class="hr"></div>
  <div class="row b big"><span>JAMI</span><span>${esc(money(sale.price))}</span></div>
  ${row("To'lov turi", PAYMENT[sale.payment_kind] ?? sale.payment_kind)}
  ${row("To'landi", money(sale.paid_amount))}
  ${sale.debt_amount > 0 ? row("Qarz (nasiya)", money(sale.debt_amount)) : ""}
  ${sale.status === "returned" ? `<div class="hr"></div>${row("QAYTARILGAN", money(sale.refund_amount))}` : ""}
  <div class="hr"></div>
  <div class="c">Xaridingiz uchun rahmat!</div>
  <div class="c">Chop etildi: ${esc(fullDate(new Date().toISOString()))}</div>
</body></html>`

  const frame = document.createElement("iframe")
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0"
  document.body.appendChild(frame)
  const doc = frame.contentDocument
  const win = frame.contentWindow
  if (!doc || !win) return
  doc.open()
  doc.write(html)
  doc.close()
  win.onafterprint = () => frame.remove()
  setTimeout(() => {
    win.focus()
    win.print()
  }, 100)
}
