"use client";

import { useEffect, useRef } from "react";

interface AudioVisualizerProps {
  stream: MediaStream | null;
  isActive: boolean;
}

export function AudioVisualizer({ stream, isActive }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    if (!stream || !isActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const audioCtx = new AudioContext();
    const analyser = audioCtx.createAnalyser();
    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);
    analyser.fftSize = 64;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const barCount = 5;

    function draw() {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth * dpr;
      const h = canvas.clientHeight * dpr;
      canvas.width = w;
      canvas.height = h;

      ctx!.clearRect(0, 0, w, h);

      const gap = 3 * dpr;
      const barWidth = (w - gap * (barCount - 1)) / barCount;

      for (let i = 0; i < barCount; i++) {
        const idx = Math.floor((i / barCount) * bufferLength);
        const val = dataArray[idx] / 255;
        const barHeight = Math.max(4 * dpr, val * h);
        const x = i * (barWidth + gap);
        const y = (h - barHeight) / 2;

        ctx!.fillStyle = `oklch(0.7 0.15 250 / ${0.5 + val * 0.5})`;
        ctx!.beginPath();
        ctx!.roundRect(x, y, barWidth, barHeight, 2 * dpr);
        ctx!.fill();
      }
    }

    draw();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      source.disconnect();
      audioCtx.close();
    };
  }, [stream, isActive]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className="w-12 h-8"
      style={{ imageRendering: "pixelated" }}
    />
  );
}
