"use client"

import { useMemo } from "react"
import { getFontOption } from "@/lib/poster-customization"
import type { PosterCustomization } from "@/lib/poster-customization"
import type { PosterSkyInfo } from "@/lib/build-poster-canvas"

function seededRand(seed: number) {
  let s = seed
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) | 0
    return (s >>> 0) / 0x100000000
  }
}

export const POSTER_W = 600
export const POSTER_H = 800
const MAP_SIZE = 390

interface PosterHTMLProps {
  starMapDataUrl: string
  displayName1:  string
  displayName2:  string
  formattedDate: string
  customization: PosterCustomization
  skyInfo?:      PosterSkyInfo
}

export function PosterHTML({
  starMapDataUrl,
  displayName1,
  displayName2,
  formattedDate,
  customization,
  skyInfo,
}: PosterHTMLProps) {
  const font = getFontOption(customization.fontId)

  const microStars = useMemo(() => {
    const rand = seededRand(0xdead_beef)
    return Array.from({ length: 130 }, () => ({
      cx: rand() * POSTER_W,
      cy: rand() * POSTER_H,
      r:  rand() * 1.1 + 0.2,
      a:  (rand() * 0.22 + 0.04).toFixed(2),
    }))
  }, [])

  const cells = skyInfo
    ? [
        { label: "Constelação",       value: skyInfo.dominantConstellation },
        { label: "Fase da Lua",       value: skyInfo.moonPhase             },
        { label: "Planeta Brilhante", value: skyInfo.brightestPlanet       },
        { label: "Estação",           value: skyInfo.season                },
      ]
    : null

  return (
    <div
      style={{
        width:          POSTER_W,
        height:         POSTER_H,
        background:     "#04060f",
        position:       "relative",
        overflow:       "hidden",
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
      }}
    >
      {/* Purple nebula glow — visible in the text area below the map */}
      <div style={{
        position:      "absolute",
        top:           MAP_SIZE + 20,
        left:          "50%",
        transform:     "translateX(-50%)",
        width:         520,
        height:        300,
        background:    "radial-gradient(ellipse at 50% 25%, rgba(88,28,135,0.32) 0%, transparent 65%)",
        pointerEvents: "none",
      }} />

      {/* Micro-stars scattered across the full poster */}
      <svg
        width={POSTER_W}
        height={POSTER_H}
        style={{ position: "absolute", inset: 0 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {microStars.map((s, i) => (
          <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={`rgba(255,255,255,${s.a})`} />
        ))}
      </svg>

      {/* ── Star map ──────────────────────────────────────────────────── */}
      {/* Canvas bg is #04060f — same as poster bg, blends seamlessly */}
      <img
        src={starMapDataUrl}
        width={MAP_SIZE}
        height={MAP_SIZE}
        style={{
          display:    "block",
          marginTop:  20,
          flexShrink: 0,
          position:   "relative",
        }}
        alt="Mapa estelar"
      />

      {/* ── Separator with diamond ─────────────────────────────────── */}
      <div style={{
        marginTop:  16,
        display:    "flex",
        alignItems: "center",
        gap:        12,
        width:      "76%",
        flexShrink: 0,
        position:   "relative",
      }}>
        <div style={{ flex: 1, height: 1, background: "rgba(167,139,250,0.30)" }} />
        <div style={{
          width:      7,
          height:     7,
          background: "rgba(167,139,250,0.75)",
          transform:  "rotate(45deg)",
          flexShrink: 0,
        }} />
        <div style={{ flex: 1, height: 1, background: "rgba(167,139,250,0.30)" }} />
      </div>

      {/* ── Names ──────────────────────────────────────────────────── */}
      <div style={{
        marginTop:     14,
        fontSize:      34,
        fontFamily:    font.fontFamily,
        fontStyle:     font.style,
        color:         "#ffffff",
        textAlign:     "center",
        letterSpacing: "0.02em",
        lineHeight:    1.2,
        padding:       "0 28px",
        position:      "relative",
      }}>
        {displayName1} & {displayName2}
      </div>

      {/* ── Date ────────────────────────────────────────────────────── */}
      <div style={{
        marginTop:     10,
        fontSize:      15,
        fontFamily:    font.fontFamily,
        color:         "rgba(196,181,253,0.85)",
        letterSpacing: "0.10em",
        textAlign:     "center",
        position:      "relative",
      }}>
        {formattedDate}
      </div>

      {/* ── Quote ───────────────────────────────────────────────────── */}
      <div style={{
        marginTop:     10,
        fontSize:      12,
        fontFamily:    font.fontFamily,
        fontStyle:     "italic",
        color:         "rgba(255,255,255,0.38)",
        textAlign:     "center",
        padding:       "0 44px",
        letterSpacing: "0.03em",
        lineHeight:    1.6,
        position:      "relative",
      }}>
        {customization.quote}
      </div>

      {/* ── Info grid ───────────────────────────────────────────────── */}
      {cells && (
        <div style={{
          marginTop:           18,
          width:               "84%",
          background:          "rgba(255,255,255,0.030)",
          border:              "1px solid rgba(167,139,250,0.18)",
          borderRadius:        12,
          display:             "grid",
          gridTemplateColumns: "1fr 1fr",
          overflow:            "hidden",
          position:            "relative",
        }}>
          {cells.map((cell, i) => (
            <div
              key={i}
              style={{
                padding:     "13px 16px",
                textAlign:   "center",
                borderRight:  i % 2 === 0 ? "1px solid rgba(167,139,250,0.12)" : undefined,
                borderBottom: i < 2       ? "1px solid rgba(167,139,250,0.12)" : undefined,
              }}
            >
              <div style={{
                fontSize:      8,
                fontFamily:    "Inter, system-ui, sans-serif",
                fontWeight:    500,
                color:         "rgba(167,139,250,0.55)",
                letterSpacing: "0.14em",
                textTransform: "uppercase" as const,
                marginBottom:  5,
              }}>
                {cell.label}
              </div>
              <div style={{
                fontSize:   16,
                fontFamily: font.fontFamily,
                fontStyle:  font.style,
                color:      "rgba(255,255,255,0.88)",
                lineHeight: 1.3,
              }}>
                {cell.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <div style={{
        position:      "absolute",
        bottom:        26,
        left:          0,
        right:         0,
        display:       "flex",
        flexDirection: "column",
        alignItems:    "center",
        gap:           8,
      }}>
        <div style={{
          width:      "34%",
          height:     1,
          background: "rgba(167,139,250,0.20)",
        }} />
        <div style={{
          fontSize:      11,
          fontFamily:    "Inter, system-ui, sans-serif",
          color:         "rgba(167,139,250,0.45)",
          letterSpacing: "0.16em",
          textTransform: "uppercase" as const,
        }}>
          ✦ Céu do Nosso Dia ✦
        </div>
      </div>
    </div>
  )
}
