"use client";

import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Shuffle } from "lucide-react";

interface PatternConfig {
  gridSize: number;
  bulgeStrength: number;
  bulgeCount: number;
  seed: number;
  lineOpacity: number;
  rotation: number;
}

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 500;
const PATTERN_COUNT = 10;

const generateRandomConfig = (): PatternConfig => ({
  gridSize: 30 + Math.random() * 30,
  bulgeStrength: 40 + Math.random() * 80,
  bulgeCount: 2 + Math.floor(Math.random() * 4),
  seed: Math.random() * 1000,
  lineOpacity: 0.1 + Math.random() * 0.2,
  rotation: Math.random() * 360,
});

const drawPattern = (canvas: HTMLCanvasElement, config: PatternConfig) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;

  canvas.width = CANVAS_WIDTH * dpr;
  canvas.height = CANVAS_HEIGHT * dpr;

  ctx.scale(dpr, dpr);
  canvas.style.width = `${CANVAS_WIDTH}px`;
  canvas.style.height = `${CANVAS_HEIGHT}px`;

  ctx.fillStyle = "#fafafa";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.save();
  ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  ctx.rotate((config.rotation * Math.PI) / 180);
  ctx.translate(-CANVAS_WIDTH / 2, -CANVAS_HEIGHT / 2);

  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  // Generate random bulge centers
  const bulges: { x: number; y: number; radius: number; strength: number }[] =
    [];
  for (let i = 0; i < config.bulgeCount; i++) {
    bulges.push({
      x: seededRandom(config.seed + i * 100) * CANVAS_WIDTH,
      y: seededRandom(config.seed + i * 100 + 50) * CANVAS_HEIGHT,
      radius: 100 + seededRandom(config.seed + i * 100 + 25) * 200,
      strength: 0.5 + seededRandom(config.seed + i * 100 + 75) * 0.5,
    });
  }

  // Calculate distortion based on distance to bulge centers
  const distort = (x: number, y: number) => {
    let dx = 0;
    let dy = 0;

    for (const bulge of bulges) {
      const distX = x - bulge.x;
      const distY = y - bulge.y;
      const distance = Math.sqrt(distX * distX + distY * distY);

      if (distance < bulge.radius) {
        // Smooth falloff using cosine curve
        const influence = Math.cos((distance / bulge.radius) * Math.PI * 0.5);
        const force = influence * config.bulgeStrength * bulge.strength;

        // Create 3D "bulge" effect
        const angle = Math.atan2(distY, distX);
        dx += Math.cos(angle) * force;
        dy += Math.sin(angle) * force;
      }
    }

    return { x: x + dx, y: y + dy };
  };

  ctx.strokeStyle = `rgba(128, 128, 128, ${config.lineOpacity})`;
  ctx.lineWidth = 0.8;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const cols = Math.ceil(CANVAS_WIDTH / config.gridSize) + 4;
  const rows = Math.ceil(CANVAS_HEIGHT / config.gridSize) + 4;

  // Draw horizontal lines
  for (let i = -2; i < rows; i++) {
    ctx.beginPath();
    const points = [];

    for (let j = -2; j < cols; j++) {
      const x = j * config.gridSize;
      const y = i * config.gridSize;
      points.push(distort(x, y));
    }

    if (points.length > 0) {
      ctx.moveTo(points[0].x, points[0].y);

      // Use quadratic curves for smooth lines
      for (let j = 1; j < points.length - 1; j++) {
        const xc = (points[j].x + points[j + 1].x) / 2;
        const yc = (points[j].y + points[j + 1].y) / 2;
        ctx.quadraticCurveTo(points[j].x, points[j].y, xc, yc);
      }

      if (points.length > 1) {
        ctx.quadraticCurveTo(
          points[points.length - 1].x,
          points[points.length - 1].y,
          points[points.length - 1].x,
          points[points.length - 1].y
        );
      }
    }
    ctx.stroke();
  }

  // Draw vertical lines
  for (let j = -2; j < cols; j++) {
    ctx.beginPath();
    const points = [];

    for (let i = -2; i < rows; i++) {
      const x = j * config.gridSize;
      const y = i * config.gridSize;
      points.push(distort(x, y));
    }

    if (points.length > 0) {
      ctx.moveTo(points[0].x, points[0].y);

      for (let i = 1; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      }

      if (points.length > 1) {
        ctx.quadraticCurveTo(
          points[points.length - 1].x,
          points[points.length - 1].y,
          points[points.length - 1].x,
          points[points.length - 1].y
        );
      }
    }
    ctx.stroke();
  }

  ctx.restore();
};

export function PatternGenerator() {
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const [configs, setConfigs] = useState<PatternConfig[]>(() =>
    Array.from({ length: PATTERN_COUNT }, () => generateRandomConfig())
  );

  const regenerateAll = () => {
    setConfigs(
      Array.from({ length: PATTERN_COUNT }, () => generateRandomConfig())
    );
  };

  const downloadImage = (index: number) => {
    const canvas = canvasRefs.current[index];
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `pattern-${index + 1}-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  useEffect(() => {
    configs.forEach((config, index) => {
      const canvas = canvasRefs.current[index];
      if (!canvas) return;
      drawPattern(canvas, config);
    });
  }, [configs]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Pattern Gallery</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {PATTERN_COUNT} unique patterns at {CANVAS_WIDTH}x{CANVAS_HEIGHT}px
          </p>
        </div>
        <Button onClick={regenerateAll} variant="outline">
          <Shuffle className="mr-2 h-4 w-4" />
          Regenerate All
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {Array.from({ length: PATTERN_COUNT }).map((_, index) => (
          <Card key={index} className="p-4 space-y-3">
            <canvas
              ref={(el) => {
                canvasRefs.current[index] = el;
              }}
              className="w-full bg-[#fafafa] rounded border"
              style={{ imageRendering: "crisp-edges" }}
            />
            <Button
              onClick={() => downloadImage(index)}
              className="w-full"
              size="sm"
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
