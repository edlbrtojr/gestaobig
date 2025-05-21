"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface SewingMachineLoaderProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
  fullScreen?: boolean;
}

export function SewingMachineLoader({
  size = "md",
  text = "Tecendo...",
  className,
  fullScreen = false
}: SewingMachineLoaderProps) {
  const sizeMap = {
    sm: 40,
    md: 60,
    lg: 80
  };

  const pixelSize = sizeMap[size];

  // If fullScreen is true, we render a full-screen overlay
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
        <div className={cn("flex flex-col items-center gap-2", className)}>
          <div className="relative" style={{ width: pixelSize, height: pixelSize }}>
            <Image
              src="/animations/animation-sewing-machine-white.svg"
              alt="Loading Animation"
              width={pixelSize}
              height={pixelSize}
              className="w-full h-full"
            />
          </div>
          {text && <p className="text-sm text-white text-center">{text}</p>}
        </div>
      </div>
    );
  }

  // Default inline rendering
  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative" style={{ width: pixelSize, height: pixelSize }}>
        <Image
          src="/animations/animation-sewing-machine-white.svg"
          alt="Loading Animation"
          width={pixelSize}
          height={pixelSize}
          className="w-full h-full"
        />
      </div>
      {text && <p className="text-sm text-center">{text}</p>}
    </div>
  );
} 