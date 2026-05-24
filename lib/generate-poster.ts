import { seededRandom, dateToSeed, drawStarMap } from "@/lib/star-map";
import { formatDate, getFirstAndLastName } from "@/lib/formatters";

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export interface PosterData {
  date: string;
  name1: string;
  name2: string;
  city: string;
  constellation?: string;
  moonPhase?: string;
  brightestStar?: string;
  season?: string;
}

export async function generatePosterPng(data: PosterData): Promise<string> {
  await Promise.all([
    document.fonts.load('italic 76px "Playfair Display"'),
    document.fonts.load('normal 32px "Playfair Display"'),
    document.fonts.load('normal 22px "Inter"'),
  ]);

  const W = 1200;
  const H = 1600;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // ── Background ──────────────────────────────────────────────────────────────
  ctx.fillStyle = "#0a0a1a";
  ctx.fillRect(0, 0, W, H);

  const bgGlow = ctx.createRadialGradient(W / 2, 410, 0, W / 2, 410, 520);
  bgGlow.addColorStop(0, "rgba(88, 28, 135, 0.20)");
  bgGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = bgGlow;
  ctx.fillRect(0, 0, W, H);

  // Micro-stars scattered across the full poster (outside the circle too)
  const microRng = seededRandom(dateToSeed(data.date + "bg"));
  for (let i = 0; i < 160; i++) {
    const x = microRng() * W;
    const y = microRng() * H;
    const r = microRng() * 1.0 + 0.2;
    const a = microRng() * 0.30 + 0.07;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.fill();
  }

  // ── Star Map ─────────────────────────────────────────────────────────────────
  const MAP = 700;
  const CX = W / 2;
  const CY = 60 + MAP / 2;
  const R = MAP / 2 - 25;

  drawStarMap(ctx, CX, CY, R, dateToSeed(data.date + data.name1 + data.name2), {
    clipInset: 6,
    fillClipDark: true,
    innerGlow: true,
    bgStarCount: 280,
    brightGlowRadius: 18,
    brightCoreRadius: 3,
    constellationOpacity: 0.32,
    constellationWidth: 1.5,
    borderOpacity: 0.55,
    decorativeHalo: true,
    minorTicksBetweenMajor: 2,
    compassOffset: 28,
    compassFont: "bold 18px Georgia, serif",
  });

  // ── Names & Date ─────────────────────────────────────────────────────────────
  const MAP_BOTTOM = 60 + MAP;

  const SEP_Y = MAP_BOTTOM + 52;
  ctx.strokeStyle = "rgba(167,139,250,0.28)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W * 0.28, SEP_Y);
  ctx.lineTo(W * 0.72, SEP_Y);
  ctx.stroke();

  ctx.save();
  ctx.translate(W / 2, SEP_Y);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = "rgba(167,139,250,0.70)";
  ctx.fillRect(-4, -4, 8, 8);
  ctx.restore();

  const NAMES_Y = SEP_Y + 72;
  ctx.font = 'italic 76px "Playfair Display", Georgia, serif';
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const displayName1 = getFirstAndLastName(data.name1);
  const displayName2 = getFirstAndLastName(data.name2);
  ctx.fillText(`${displayName1} & ${displayName2}`, W / 2, NAMES_Y);

  ctx.font = '32px "Playfair Display", Georgia, serif';
  ctx.fillStyle = "rgba(196,181,253,0.85)";
  ctx.fillText(formatDate(data.date), W / 2, NAMES_Y + 62);

  ctx.font = '22px "Inter", Arial, sans-serif';
  ctx.fillStyle = "rgba(255,255,255,0.38)";
  ctx.fillText(data.city.toUpperCase(), W / 2, NAMES_Y + 106);

  // ── Info Grid ────────────────────────────────────────────────────────────────
  const GRID_TOP = NAMES_Y + 160;
  const GRID_PAD = 64;
  const GRID_W = W - GRID_PAD * 2;
  const GRID_H = 300;

  ctx.fillStyle = "rgba(255,255,255,0.034)";
  roundRect(ctx, GRID_PAD, GRID_TOP, GRID_W, GRID_H, 18);
  ctx.fill();

  ctx.strokeStyle = "rgba(167,139,250,0.18)";
  ctx.lineWidth = 1;
  roundRect(ctx, GRID_PAD, GRID_TOP, GRID_W, GRID_H, 18);
  ctx.stroke();

  const CELL_W = GRID_W / 2;
  const CELL_H = GRID_H / 2;

  ctx.strokeStyle = "rgba(167,139,250,0.12)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(GRID_PAD + CELL_W, GRID_TOP + 22);
  ctx.lineTo(GRID_PAD + CELL_W, GRID_TOP + GRID_H - 22);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(GRID_PAD + 22, GRID_TOP + CELL_H);
  ctx.lineTo(GRID_PAD + GRID_W - 22, GRID_TOP + CELL_H);
  ctx.stroke();

  const infos = [
    { label: "CONSTELAÇÃO VISÍVEL",    value: data.constellation  ?? "Órion" },
    { label: "FASE DA LUA",            value: data.moonPhase      ?? "Lua Crescente 34%" },
    { label: "ESTRELA MAIS BRILHANTE", value: data.brightestStar  ?? "Vênus" },
    { label: "ESTAÇÃO",                value: data.season         ?? "Verão" },
  ];

  infos.forEach((info, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cx = GRID_PAD + col * CELL_W + CELL_W / 2;
    const cy = GRID_TOP + row * CELL_H + CELL_H / 2;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font = 'bold 20px "Inter", Arial, sans-serif';
    ctx.fillStyle = "rgba(196,181,253,0.55)";
    ctx.fillText(info.label, cx, cy - 20);

    ctx.font = '30px "Playfair Display", Georgia, serif';
    ctx.fillStyle = "#ffffff";
    ctx.fillText(info.value, cx, cy + 20);
  });

  // ── Quote ────────────────────────────────────────────────────────────────────
  const GRID_BOTTOM = GRID_TOP + GRID_H;
  const QUOTE_Y = GRID_BOTTOM + 92;

  ctx.font = 'italic 32px "Playfair Display", Georgia, serif';
  ctx.fillStyle = "rgba(255,255,255,0.42)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText('"Naquela noite, o universo já sabia."', W / 2, QUOTE_Y);

  // ── Brand Footer ─────────────────────────────────────────────────────────────
  const FOOTER_Y = QUOTE_Y + 108;

  ctx.strokeStyle = "rgba(167,139,250,0.18)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W * 0.38, FOOTER_Y - 18);
  ctx.lineTo(W * 0.62, FOOTER_Y - 18);
  ctx.stroke();

  ctx.font = '20px "Inter", Arial, sans-serif';
  ctx.fillStyle = "rgba(167,139,250,0.48)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("✦  Céu do Nosso Dia  ✦", W / 2, FOOTER_Y + 4);

  return canvas.toDataURL("image/png");
}
