const PT_MONTHS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
]

export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16)
  return digits.match(/.{1,4}/g)?.join(" ") ?? digits
}

export function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4)
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
}

export function formatCpf(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11)
  if (d.length > 9) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  if (d.length > 6) return d.replace(/(\d{3})(\d{3})(\d+)/, "$1.$2.$3")
  if (d.length > 3) return d.replace(/(\d{3})(\d+)/, "$1.$2")
  return d
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return ""
  let day: string, month: string, year: string
  if (dateStr.includes("/")) {
    ;[day, month, year] = dateStr.split("/")
  } else {
    ;[year, month, day] = dateStr.split("-")
  }
  if (!year || !month || !day) return ""
  return `${parseInt(day)} de ${PT_MONTHS[parseInt(month) - 1]} de ${year}`
}
