import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface VoiceVisualizerProps {
  isActive: boolean;
  intensity?: number;
}

export default function VoiceVisualizer({ isActive, intensity = 0.3 }: VoiceVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let time = 0;
    const bars = 32;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      const barWidth = w / bars;
      const baseHeight = isActive ? h * 0.15 : h * 0.05;
      const maxHeight = h * 0.9;

      for (let i = 0; i < bars; i++) {
        const t = time + i * 0.3;
        const noise = Math.sin(t * 2) * 0.5 + Math.sin(t * 3.7) * 0.3 + Math.sin(t * 1.3) * 0.2;
        const height = baseHeight + (maxHeight - baseHeight) * Math.abs(noise) * intensity;
        const x = i * barWidth + barWidth * 0.1;
        const y = (h - height) / 2;

        const gradient = ctx.createLinearGradient(0, y, 0, y + height);
        gradient.addColorStop(0, "rgba(0, 212, 255, 0.05)");
        gradient.addColorStop(0.5, "rgba(0, 212, 255, 0.4)");
        gradient.addColorStop(1, "rgba(0, 212, 255, 0.05)");

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth * 0.8, height);

        // Top highlight
        ctx.fillStyle = "rgba(0, 212, 255, 0.6)";
        ctx.fillRect(x, y, barWidth * 0.8, 1);
      }

      time += 0.05;
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [isActive, intensity]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-16 relative"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ imageRendering: "auto" }}
      />
    </motion.div>
  );
}
