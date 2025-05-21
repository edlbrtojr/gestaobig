"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import Lottie with no SSR to prevent document not defined errors
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

interface LottieWavesProps {
  className?: string;
}

// Define a simple type for the animation data
type AnimationData = any;

export default function LottieWaves({ className }: LottieWavesProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [animationData, setAnimationData] = useState<AnimationData>(null);

  useEffect(() => {
    setIsMounted(true);

    // Only import the animation data on the client
    import("../../public/animations/Animation - blue waves.json")
      .then((data) => {
        setAnimationData(data.default);
      })
      .catch((err) => console.error("Failed to load animation:", err));
  }, []);

  // Don't render anything until we're on the client and data is loaded
  if (!isMounted || !animationData) {
    return null;
  }

  return (
    <div className={className}>
      <Lottie animationData={animationData} loop={true} autoplay={true} />
    </div>
  );
}
