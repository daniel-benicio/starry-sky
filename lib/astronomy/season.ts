type SeasonRow = [months: number[], southern: string, northern: string]

const SEASON_TABLE: SeasonRow[] = [
  [[12, 1, 2],  "Verão",     "Inverno"],
  [[3, 4, 5],   "Outono",    "Primavera"],
  [[6, 7, 8],   "Inverno",   "Verão"],
  [[9, 10, 11], "Primavera", "Outono"],
]

export function getSeason(month: number, latitudeDeg: number): string {
  const isSouthern = latitudeDeg < 0
  const row = SEASON_TABLE.find(([months]) => months.includes(month))
  if (!row) return "Verão"
  const [, southern, northern] = row
  return isSouthern ? southern : northern
}
