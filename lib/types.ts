export interface Coordinates {
  lat: number
  lon: number
  displayName: string
}

export interface StarPoint {
  x: number          // normalized -1..1 relative to map center
  y: number
  magnitude: number
  name?: string
  constellation: string
}

export interface SkyLine {
  x1: number; y1: number
  x2: number; y2: number
}

export interface SkyInfo {
  moonPhase: string
  brightestPlanet: string
  season: string
  dominantConstellation: string
}

export interface SkyData extends SkyInfo {
  stars: StarPoint[]
  lines: SkyLine[]
}
