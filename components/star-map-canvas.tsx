"use client";

import { useEffect, useRef } from "react";
import { dateToSeed, drawStarMap } from "@/lib/star-map";

interface StarMapCanvasProps {
  date: string;
  name1: string;
  name2: string;
  size?: number;
}

export function StarMapCanvas({ date, name1, name2, size = 500 }: StarMapCanvasProps) {
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

    ctx.fillStyle = "#0a0a1a";
    ctx.fillRect(0, 0, size, size);

    drawStarMap(ctx, size / 2, size / 2, size / 2 - 30, dateToSeed(date + name1 + name2));
  }, [date, name1, name2, size]);

  return (
    <canvas ref={canvasRef} style={{ width: size, height: size }} className="rounded-full" />
  );
}
