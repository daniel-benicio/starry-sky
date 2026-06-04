import type { StarPoint } from "../types"

// Azimuthal equidistant projection centered at zenith.
// North = top, East = right. Returns null for stars below the horizon.
export function projectToMap(
  altitudeDeg: number,
  azimuthDeg: number,
): Pick<StarPoint, "x" | "y"> | null {
  if (altitudeDeg < 0) return null

  const zenithDistance = (90 - altitudeDeg) / 90
  const azimuthRad = (azimuthDeg * Math.PI) / 180

  return {
    x: zenithDistance * Math.sin(azimuthRad),
    y: -zenithDistance * Math.cos(azimuthRad),
  }
}
