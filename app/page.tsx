"use client"

import { PatternGenerator } from "@/components/pattern-generator"

export default function Home() {
  return (
    <main className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Abstract Pattern Generator</h1>
          <p className="text-muted-foreground">Create beautiful 3D-distorted grid patterns for your blog posts</p>
        </div>
        <PatternGenerator />
      </div>
    </main>
  )
}
