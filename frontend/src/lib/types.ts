export type Role = "admin" | "sotuvchi" | "kassir" | "omborchi" | "yetkazuvchi" | "menejer"

export type User = {
  id: number
  name: string
  phone: string
  login: string
  role: Role
  avatar: string | null
}

export type UserStat = {
  user_id: number
  last_seen_at: string | null
  active_seconds: number
  sales_count: number
  sales_sum: number
}

export type ProductType = { id: number; name: string }

export type Product = {
  id: number
  type_id: number
  type_name: string
  name: string
  address: string
  image: string | null
  client_name: string | null
  color: string
  price: number
  delivery_at: string
  created_by_name: string
  created_by_id: number | null
  created_at: string
}

export type ArchivedProduct = Product & {
  status: "sold" | "archived"
  sold_at: string | null
  sold_by_name: string | null
  paid_amount: number | null
  archive_kind: "cancelled" | "defect" | null
  archive_reason: string | null
  archived_by_name: string | null
  archived_at: string | null
  refund_amount: number
}

export type SalesSummary = {
  month_returns: number
  month_refund: number
  month_cancellations: number
  month_archived: number
}

export type Sale = {
  id: number
  product_name: string
  type_name: string
  address: string
  color: string
  price: number
  delivery_at: string
  payment_kind: "full" | "partial" | "cash"
  paid_amount: number
  debt_amount: number
  sold_by_name: string
  sold_by_id: number | null
  sold_at: string
  status: "sold" | "returned"
  returned_at: string | null
  returned_by_name: string | null
  return_reason: string | null
  return_condition: "ok" | "defect" | null
  refund_amount: number
}

export const ROLES: { id: Role; label: string }[] = [
  { id: "admin", label: "Admin" },
  { id: "sotuvchi", label: "Sotuvchi" },
  { id: "kassir", label: "Kassir" },
  { id: "omborchi", label: "Omborchi" },
  { id: "yetkazuvchi", label: "Yetkazuvchi" },
  { id: "menejer", label: "Menejer" },
]

export function roleLabel(role: string) {
  return ROLES.find((item) => item.id === role)?.label ?? role
}
