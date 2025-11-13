import { useRef, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

interface Device {
  id: string;
  name: string;
  x: number;
  y: number;
  status: "up" | "down" | "warning";
  type: "router" | "switch" | "server";
}

interface Link {
  id: string;
  source: string;
  target: string;
  bandwidth: number;
  maxBandwidth: number;
  status: "healthy" | "warning" | "critical";
}

interface NetworkCanvasProps {
  devices: Device[];
  links: Link[];
  onDeviceClick?: (device: Device) => void;
}

export const NetworkCanvas = ({ devices, links, onDeviceClick }: NetworkCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [draggedDevice, setDraggedDevice] = useState<string | null>(null);
  const [animationFrame, setAnimationFrame] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const animate = () => {
      setAnimationFrame((prev) => (prev + 1) % 360);
    };

    const interval = setInterval(animate, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw links
    links.forEach((link) => {
      const sourceDevice = devices.find((d) => d.id === link.source);
      const targetDevice = devices.find((d) => d.id === link.target);

      if (!sourceDevice || !targetDevice) return;

      const utilization = (link.bandwidth / link.maxBandwidth) * 100;
      let color = "#10b981"; // green (healthy)
      if (utilization > 80) color = "#ef4444"; // red (critical)
      else if (utilization > 60) color = "#f59e0b"; // orange (warning)

      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sourceDevice.x, sourceDevice.y);
      ctx.lineTo(targetDevice.x, targetDevice.y);
      ctx.stroke();

      // Animated traffic flow
      const dx = targetDevice.x - sourceDevice.x;
      const dy = targetDevice.y - sourceDevice.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const steps = 10;
      const offset = (animationFrame % steps) / steps;

      for (let i = 0; i < 3; i++) {
        const t = (i / 3 + offset) % 1;
        const x = sourceDevice.x + dx * t;
        const y = sourceDevice.y + dy * t;

        ctx.fillStyle = color;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Bandwidth label
      ctx.fillStyle = "#9ca3af";
      ctx.font = "12px monospace";
      const midX = (sourceDevice.x + targetDevice.x) / 2;
      const midY = (sourceDevice.y + targetDevice.y) / 2;
      const label = `${link.bandwidth.toFixed(1)}/${link.maxBandwidth} Mbps`;
      ctx.fillText(label, midX + 5, midY - 5);
    });

    // Draw devices
    devices.forEach((device) => {
      const statusColors = {
        up: "#10b981",
        warning: "#f59e0b",
        down: "#ef4444",
      };

      // Device circle
      ctx.fillStyle = "#1f2937";
      ctx.strokeStyle = statusColors[device.status];
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(device.x, device.y, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Device icon (simplified)
      ctx.fillStyle = "#06b6d4";
      ctx.font = "20px monospace";
      const icon = device.type === "router" ? "🔀" : device.type === "switch" ? "⚡" : "💾";
      ctx.fillText(icon, device.x - 10, device.y + 7);

      // Device name
      ctx.fillStyle = "#e5e7eb";
      ctx.font = "13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(device.name, device.x, device.y + 50);
      ctx.textAlign = "left";
    });
  }, [devices, links, animationFrame]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedDevice = devices.find((device) => {
      const distance = Math.sqrt((device.x - x) ** 2 + (device.y - y) ** 2);
      return distance < 30;
    });

    if (clickedDevice) {
      setDraggedDevice(clickedDevice.id);
      onDeviceClick?.(clickedDevice);
    }
  };

  return (
    <Card className="p-4 bg-card border-border">
      <canvas
        ref={canvasRef}
        width={1200}
        height={700}
        className="w-full bg-background rounded-lg cursor-pointer"
        onMouseDown={handleMouseDown}
      />
    </Card>
  );
};
