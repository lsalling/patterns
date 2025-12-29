"use client"

import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Download, Shuffle } from "lucide-react"

interface PatternConfig {
  gridSize: number
  bulgeStrength: number
  bulgeCount: number
  seed: number
  lineOpacity: number
  rotation: number
}

export function PatternGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [config, setConfig] = useState<PatternConfig>({
    gridSize: 40,
    bulgeStrength: 60,
    bulgeCount: 3,
    seed: Math.random() * 1000,
    lineOpacity: 0.15,
    rotation: 0,
  })

  const updateConfig = (key: keyof PatternConfig, value: number) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  const randomize = () => {
    setConfig({
      gridSize: 30 + Math.random() * 30,
      bulgeStrength: 40 + Math.random() * 80,
      bulgeCount: 2 + Math.floor(Math.random() * 4),
      seed: Math.random() * 1000,
      lineOpacity: 0.1 + Math.random() * 0.2,
      rotation: Math.random() * 360,
    })
  }

  const downloadImage = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement("a")
    link.download = `pattern-${Date.now()}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr

    ctx.scale(dpr, dpr)
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`

    ctx.fillStyle = "#fafafa"
    ctx.fillRect(0, 0, rect.width, rect.height)

    ctx.save()
    ctx.translate(rect.width / 2, rect.height / 2)
    ctx.rotate((config.rotation * Math.PI) / 180)
    ctx.translate(-rect.width / 2, -rect.height / 2)

    const seededRandom = (seed: number) => {
      const x = Math.sin(seed) * 10000
      return x - Math.floor(x)
    }

    // Generate random bulge centers
    const bulges: { x: number; y: number; radius: number; strength: number }[] = []
    for (let i = 0; i < config.bulgeCount; i++) {
      bulges.push({
        x: seededRandom(config.seed + i * 100) * rect.width,
        y: seededRandom(config.seed + i * 100 + 50) * rect.height,
        radius: 100 + seededRandom(config.seed + i * 100 + 25) * 200,
        strength: 0.5 + seededRandom(config.seed + i * 100 + 75) * 0.5,
      })
    }

    // Calculate distortion based on distance to bulge centers
    const distort = (x: number, y: number) => {
      let dx = 0
      let dy = 0

      for (const bulge of bulges) {
        const distX = x - bulge.x
        const distY = y - bulge.y
        const distance = Math.sqrt(distX * distX + distY * distY)

        if (distance < bulge.radius) {
          // Smooth falloff using cosine curve
          const influence = Math.cos((distance / bulge.radius) * Math.PI * 0.5)
          const force = influence * config.bulgeStrength * bulge.strength

          // Create 3D "bulge" effect
          const angle = Math.atan2(distY, distX)
          dx += Math.cos(angle) * force
          dy += Math.sin(angle) * force
        }
      }

      return { x: x + dx, y: y + dy }
    }

    ctx.strokeStyle = `rgba(128, 128, 128, ${config.lineOpacity})`
    ctx.lineWidth = 0.8
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    const cols = Math.ceil(rect.width / config.gridSize) + 4
    const rows = Math.ceil(rect.height / config.gridSize) + 4

    // Draw horizontal lines
    for (let i = -2; i < rows; i++) {
      ctx.beginPath()
      const points = []

      for (let j = -2; j < cols; j++) {
        const x = j * config.gridSize
        const y = i * config.gridSize
        points.push(distort(x, y))
      }

      if (points.length > 0) {
        ctx.moveTo(points[0].x, points[0].y)

        // Use quadratic curves for smooth lines
        for (let j = 1; j < points.length - 1; j++) {
          const xc = (points[j].x + points[j + 1].x) / 2
          const yc = (points[j].y + points[j + 1].y) / 2
          ctx.quadraticCurveTo(points[j].x, points[j].y, xc, yc)
        }

        if (points.length > 1) {
          ctx.quadraticCurveTo(
            points[points.length - 1].x,
            points[points.length - 1].y,
            points[points.length - 1].x,
            points[points.length - 1].y,
          )
        }
      }
      ctx.stroke()
    }

    // Draw vertical lines
    for (let j = -2; j < cols; j++) {
      ctx.beginPath()
      const points = []

      for (let i = -2; i < rows; i++) {
        const x = j * config.gridSize
        const y = i * config.gridSize
        points.push(distort(x, y))
      }

      if (points.length > 0) {
        ctx.moveTo(points[0].x, points[0].y)

        for (let i = 1; i < points.length - 1; i++) {
          const xc = (points[i].x + points[i + 1].x) / 2
          const yc = (points[i].y + points[i + 1].y) / 2
          ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc)
        }

        if (points.length > 1) {
          ctx.quadraticCurveTo(
            points[points.length - 1].x,
            points[points.length - 1].y,
            points[points.length - 1].x,
            points[points.length - 1].y,
          )
        }
      }
      ctx.stroke()
    }

    ctx.restore()
  }, [config])

  return (
    <div className="grid lg:grid-cols-[1fr,350px] gap-6">
      <Card className="p-4">
        <canvas
          ref={canvasRef}
          className="w-full aspect-[4/3] bg-[#fafafa]"
          style={{ imageRendering: "crisp-edges" }}
        />
      </Card>

      <div className="space-y-6">
        <Card className="p-6 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Grid Size</Label>
              <span className="text-sm text-muted-foreground">{config.gridSize.toFixed(0)}</span>
            </div>
            <Slider
              value={[config.gridSize]}
              onValueChange={([value]) => updateConfig("gridSize", value)}
              min={20}
              max={80}
              step={1}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Bulge Strength</Label>
              <span className="text-sm text-muted-foreground">{config.bulgeStrength.toFixed(0)}</span>
            </div>
            <Slider
              value={[config.bulgeStrength]}
              onValueChange={([value]) => updateConfig("bulgeStrength", value)}
              min={10}
              max={120}
              step={1}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Bulge Count</Label>
              <span className="text-sm text-muted-foreground">{config.bulgeCount.toFixed(0)}</span>
            </div>
            <Slider
              value={[config.bulgeCount]}
              onValueChange={([value]) => updateConfig("bulgeCount", value)}
              min={1}
              max={6}
              step={1}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Line Opacity</Label>
              <span className="text-sm text-muted-foreground">{config.lineOpacity.toFixed(2)}</span>
            </div>
            <Slider
              value={[config.lineOpacity]}
              onValueChange={([value]) => updateConfig("lineOpacity", value)}
              min={0.05}
              max={0.4}
              step={0.01}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Rotation</Label>
              <span className="text-sm text-muted-foreground">{config.rotation.toFixed(0)}°</span>
            </div>
            <Slider
              value={[config.rotation]}
              onValueChange={([value]) => updateConfig("rotation", value)}
              min={0}
              max={360}
              step={1}
            />
          </div>

          <div className="pt-4 space-y-2">
            <Button onClick={randomize} className="w-full bg-transparent" variant="outline">
              <Shuffle className="mr-2 h-4 w-4" />
              Randomize
            </Button>
            <Button onClick={downloadImage} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Download PNG
            </Button>
          </div>
        </Card>

        <Card className="p-4 bg-muted/50">
          <p className="text-sm text-muted-foreground">
            Tip: Click "Randomize" to generate unique variations instantly, or fine-tune the controls for precise
            customization.
          </p>
        </Card>
      </div>
    </div>
  )
}
