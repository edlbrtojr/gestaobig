"use client";

import { memo, useState, useCallback, useEffect } from "react";
import GraphView from "./graph-view";
import { GraphData } from "@/types/graph";
import { Button } from "@/components/ui/button";
import { Expand, Shrink } from "lucide-react";

interface GraphContainerProps {
  data: GraphData;
}

// Using memo to prevent unnecessary re-renders when props haven't changed
function GraphContainer({ data }: GraphContainerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // Add escape key listener to exit fullscreen mode
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Handle body scroll locking
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  return (
    <div
      className={
        isFullscreen
          ? "fixed inset-0 z-50 bg-[var(--card-background)]"
          : "h-full w-full relative overflow-hidden rounded"
      }
    >
      {/* Fullscreen toggle button */}
      <Button
        onClick={toggleFullscreen}
        variant="secondary"
        size="icon"
        className="absolute top-2 right-2 z-10"
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      >
        {isFullscreen ? (
          <Shrink className="h-4 w-4" />
        ) : (
          <Expand className="h-4 w-4" />
        )}
      </Button>

      {isFullscreen && (
        <div className="h-full w-full">
          <GraphView data={data} />
        </div>
      )}

      {!isFullscreen && (
        <div className="h-full w-full">
          <GraphView data={data} />
        </div>
      )}
    </div>
  );
}

export default memo(GraphContainer);
