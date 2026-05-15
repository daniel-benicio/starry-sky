export function seededRandom(seed: number) {
  return function () {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

export function dateToSeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export const CONSTELLATION_EDGES = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0], [1, 4], [2, 6],
] as const;

export interface StarMapConfig {
  clipInset?: number;
  fillClipDark?: boolean;
  innerGlow?: boolean;
  bgStarCount?: number;
  brightGlowRadius?: number;
  brightCoreRadius?: number;
  constellationOpacity?: number;
  constellationWidth?: number;
  borderOpacity?: number;
  decorativeHalo?: boolean;
  minorTicksBetweenMajor?: number;
  compassOffset?: number;
  compassFont?: string;
}

export function drawStarMap(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  seed: number,
  config: StarMapConfig = {}
): void {
  const {
    clipInset = 10,
    fillClipDark = false,
    innerGlow = false,
    bgStarCount = 200,
    brightGlowRadius = 8,
    brightCoreRadius = 2.5,
    constellationOpacity = 0.30,
    constellationWidth = 1,
    borderOpacity = 0.40,
    decorativeHalo = false,
    minorTicksBetweenMajor = 0,
    compassOffset = 18,
    compassFont = "14px 'Playfair Display', Georgia, serif",
  } = config;

  // Two independent RNG instances so bgStarCount doesn't shift bright star positions
  const bgRng = seededRandom(seed);
  const brightRng = seededRandom(seed + 1);

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius - clipInset, 0, Math.PI * 2);
  ctx.clip();

  if (fillClipDark) {
    ctx.fillStyle = "#04040d";
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
  }

  if (innerGlow) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    g.addColorStop(0, "rgba(80,30,160,0.14)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < bgStarCount; i++) {
    const angle = bgRng() * Math.PI * 2;
    const dist = bgRng() * (radius - 20);
    const x = cx + Math.cos(angle) * dist;
    const y = cy + Math.sin(angle) * dist;
    ctx.beginPath();
    ctx.arc(x, y, bgRng() * 1.5 + 0.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${bgRng() * 0.6 + 0.2})`;
    ctx.fill();
  }

  const bright: { x: number; y: number }[] = [];
  for (let i = 0; i < 8; i++) {
    const angle = brightRng() * Math.PI * 2;
    const dist = brightRng() * (radius - 60) + 30;
    const x = cx + Math.cos(angle) * dist;
    const y = cy + Math.sin(angle) * dist;
    bright.push({ x, y });

    const glow = ctx.createRadialGradient(x, y, 0, x, y, brightGlowRadius);
    glow.addColorStop(0, "rgba(255,255,255,0.9)");
    glow.addColorStop(0.3, "rgba(167,139,250,0.4)");
    glow.addColorStop(1, "rgba(167,139,250,0)");
    ctx.beginPath();
    ctx.arc(x, y, brightGlowRadius, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, brightCoreRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
  }

  ctx.strokeStyle = `rgba(167,139,250,${constellationOpacity})`;
  ctx.lineWidth = constellationWidth;
  CONSTELLATION_EDGES.forEach(([a, b]) => {
    if (bright[a] && bright[b]) {
      ctx.beginPath();
      ctx.moveTo(bright[a].x, bright[a].y);
      ctx.lineTo(bright[b].x, bright[b].y);
      ctx.stroke();
    }
  });

  ctx.restore();

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(167,139,250,${borderOpacity})`;
  ctx.lineWidth = 2;
  ctx.stroke();

  if (decorativeHalo) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 11, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(167,139,250,0.13)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  const totalTicks = 12 * (1 + minorTicksBetweenMajor);
  const degPerTick = 360 / totalTicks;
  for (let i = 0; i < totalTicks; i++) {
    const isMajor = i % (1 + minorTicksBetweenMajor) === 0;
    const angle = (i * degPerTick * Math.PI) / 180 - Math.PI / 2;
    const inner = radius - (isMajor ? (minorTicksBetweenMajor > 0 ? 13 : 8) : 6);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
    ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
    ctx.strokeStyle = isMajor ? "rgba(251,191,36,0.8)" : "rgba(251,191,36,0.3)";
    ctx.lineWidth = isMajor ? (minorTicksBetweenMajor > 0 ? 2.5 : 2) : 1;
    ctx.stroke();
  }

  const compassR = radius + compassOffset;
  ctx.font = compassFont;
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("N", cx, cy - compassR);
  ctx.fillText("S", cx, cy + compassR);
  ctx.fillText("L", cx + compassR, cy);
  ctx.fillText("O", cx - compassR, cy);
}
