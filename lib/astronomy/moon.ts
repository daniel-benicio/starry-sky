import * as Astronomy from "astronomy-engine"

interface PhaseRange {
  maxAngle: number
  label: (pct: number) => string
}

const PHASE_RANGES: PhaseRange[] = [
  { maxAngle: 1.5,   label: ()    => "Lua Nova" },
  { maxAngle: 90,    label: (pct) => `Lua Crescente ${pct}%` },
  { maxAngle: 181.5, label: ()    => "Lua Cheia" },
  { maxAngle: 270,   label: (pct) => `Lua Minguante ${pct}%` },
  { maxAngle: 360,   label: ()    => "Lua Nova" },
]

export function describeMoonPhase(date: Date): string {
  const angle = Astronomy.MoonPhase(date)
  const illumination = Astronomy.Illumination(Astronomy.Body.Moon, date)
  const pct = Math.round(illumination.phase_fraction * 100)

  const phase = PHASE_RANGES.find((r) => angle <= r.maxAngle)
  return phase ? phase.label(pct) : "Lua Nova"
}
