"use client";

import { useEffect, useRef } from "react";

interface StarMapCanvasProps {
  date: string;
  name1: string;
  name2: string;
  size?: number;
}

// Seeded random number generator
function seededRandom(seed: number) {
  return function () {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

function dateToSeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function StarMapCanvas({
  date,
  name1,
  name2,
  size = 500,
}: StarMapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 30;

    // Background
    ctx.fillStyle = "#0a0a1a";
    ctx.fillRect(0, 0, size, size);

    // Clip to circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 10, 0, Math.PI * 2);
    ctx.clip();

    // Seeded random for consistent stars
    const seed = dateToSeed(date + name1 + name2);
    const random = seededRandom(seed);

    // Generate ~200 background stars
    for (let i = 0; i < 200; i++) {
      const angle = random() * Math.PI * 2;
      const dist = random() * (radius - 20);
      const x = centerX + Math.cos(angle) * dist;
      const y = centerY + Math.sin(angle) * dist;
      const starSize = random() * 1.5 + 0.5;
      const opacity = random() * 0.6 + 0.2;

      ctx.beginPath();
      ctx.arc(x, y, starSize, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.fill();
    }

    // Generate 8 bright constellation stars
    const brightStars: { x: number; y: number }[] = [];
    for (let i = 0; i < 8; i++) {
      const angle = random() * Math.PI * 2;
      const dist = random() * (radius - 60) + 30;
      const x = centerX + Math.cos(angle) * dist;
      const y = centerY + Math.sin(angle) * dist;
      brightStars.push({ x, y });

      // Glow effect
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 8);
      gradient.addColorStop(0, "rgba(255, 255, 255, 0.9)");
      gradient.addColorStop(0.3, "rgba(167, 139, 250, 0.4)");
      gradient.addColorStop(1, "rgba(167, 139, 250, 0)");
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Star core
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
    }

    // Draw constellation lines connecting bright stars
    ctx.strokeStyle = "rgba(167, 139, 250, 0.3)";
    ctx.lineWidth = 1;
    ctx.setLineDash([]);

    // Connect stars in a pattern
    const connections = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 0],
      [1, 4],
      [2, 6],
    ];

    connections.forEach(([a, b]) => {
      if (brightStars[a] && brightStars[b]) {
        ctx.beginPath();
        ctx.moveTo(brightStars[a].x, brightStars[a].y);
        ctx.lineTo(brightStars[b].x, brightStars[b].y);
        ctx.stroke();
      }
    });

    ctx.restore();

    // Draw circular border
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(167, 139, 250, 0.4)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw tick marks every 30 degrees (gold/amber)
    for (let i = 0; i < 12; i++) {
      const angle = (i * 30 * Math.PI) / 180 - Math.PI / 2;
      const innerR = radius - 8;
      const outerR = radius;

      ctx.beginPath();
      ctx.moveTo(
        centerX + Math.cos(angle) * innerR,
        centerY + Math.sin(angle) * innerR
      );
      ctx.lineTo(
        centerX + Math.cos(angle) * outerR,
        centerY + Math.sin(angle) * outerR
      );
      ctx.strokeStyle = "rgba(251, 191, 36, 0.7)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw compass marks (N S L O)
    ctx.font = "14px 'Playfair Display', Georgia, serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const compassOffset = radius + 18;
    ctx.fillText("N", centerX, centerY - compassOffset);
    ctx.fillText("S", centerX, centerY + compassOffset);
    ctx.fillText("L", centerX + compassOffset, centerY);
    ctx.fillText("O", centerX - compassOffset, centerY);
  }, [date, name1, name2, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className="rounded-full"
    />
  );
}
