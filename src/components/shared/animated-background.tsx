"use client";

/**
 * AnimatedBackground — subtle animated SVG blobs + grid overlay
 * that sits behind page content, adding depth and visual interest.
 */

import { memo } from "react";

interface AnimatedBackgroundProps {
  /** Which variant of background decoration to show */
  variant?: "dots" | "grid" | "blobs" | "mesh";
  /** Reduce motion for accessibility */
  reducedMotion?: boolean;
  className?: string;
}

function AnimatedBackgroundInner({
  variant = "blobs",
  reducedMotion = false,
  className = "",
}: AnimatedBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 -z-10 overflow-hidden ${className}`}
    >
      {/* Subtle grid underlay */}
      {(variant === "grid" || variant === "blobs" || variant === "mesh") && (
        <div className="absolute inset-0 bg-dot-pattern opacity-40" />
      )}

      {variant === "dots" && (
        <div className="absolute inset-0 bg-dot-pattern opacity-60" />
      )}

      {/* Floating blobs */}
      {variant === "blobs" && (
        <>
          <svg
            className={`absolute -top-32 -right-32 h-[500px] w-[500px] opacity-[0.04] ${reducedMotion ? "" : "animate-blob"}`}
            viewBox="0 0 200 200"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill="oklch(0.45 0.2 265)"
              d="M44.7,-76.4C59.3,-69.4,73.3,-59.3,82.1,-45.4C90.8,-31.5,94.3,-13.8,91.6,2.6C88.9,19,80.1,33.7,69.7,46.7C59.3,59.7,47.3,71,33.4,77.4C19.5,83.8,3.7,85.3,-11.3,82.1C-26.3,78.9,-40.4,71,-53.4,61C-66.3,51,-78.1,38.8,-83.6,24.1C-89.1,9.5,-88.4,-7.7,-83.2,-22.9C-78,-38.1,-68.3,-51.3,-55.6,-59.3C-42.9,-67.3,-27.2,-70.1,-11.5,-71.9C4.2,-73.7,30.1,-83.4,44.7,-76.4Z"
              transform="translate(100 100)"
            />
          </svg>
          <svg
            className={`absolute -bottom-48 -left-24 h-[600px] w-[600px] opacity-[0.03] ${reducedMotion ? "" : "animate-blob"}`}
            style={{ animationDelay: "-4s", animationDuration: "12s" }}
            viewBox="0 0 200 200"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill="oklch(0.5 0.18 290)"
              d="M39.9,-67.4C52.2,-62.1,63.2,-52.4,71.2,-40.4C79.2,-28.3,84.2,-14.2,83.5,-0.4C82.8,13.4,76.3,26.7,68.4,39C60.4,51.3,50.9,62.5,38.8,70.2C26.7,77.9,12,82.2,-2.1,81.2C-16.3,80.2,-30.1,73.9,-43.5,66.7C-56.9,59.5,-69.8,51.3,-76.7,39.2C-83.5,27.1,-84.3,11.1,-80.6,-3.4C-76.9,-17.9,-68.7,-30.9,-58.7,-41.6C-48.7,-52.2,-36.9,-60.5,-24.3,-65.6C-11.7,-70.7,1.3,-72.7,14.4,-72.3C27.5,-71.8,27.6,-72.8,39.9,-67.4Z"
              transform="translate(100 100)"
            />
          </svg>
          <svg
            className={`absolute top-1/3 right-1/4 h-[350px] w-[350px] opacity-[0.025] ${reducedMotion ? "" : "animate-blob"}`}
            style={{ animationDelay: "-8s", animationDuration: "15s" }}
            viewBox="0 0 200 200"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill="oklch(0.55 0.15 160)"
              d="M43.2,-73.9C55.4,-67.2,64.4,-54.3,72.4,-40.5C80.4,-26.6,87.3,-11.8,86.7,2.5C86,16.8,77.7,30.5,68,42.9C58.3,55.3,47.2,66.3,33.8,72.5C20.5,78.7,5,80.1,-10.2,78C-25.4,75.9,-40.2,70.4,-52.4,61.5C-64.5,52.7,-74,40.5,-78.6,26.7C-83.1,12.8,-82.7,-2.8,-78.2,-16.5C-73.7,-30.3,-65.2,-42.3,-54,-51.4C-42.8,-60.4,-28.9,-66.5,-14.5,-70.5C-0.1,-74.5,14.8,-76.3,28,-74.5C41.3,-72.7,31.1,-80.5,43.2,-73.9Z"
              transform="translate(100 100)"
            />
          </svg>
        </>
      )}

      {/* Mesh gradient */}
      {variant === "mesh" && (
        <>
          <div
            className={`absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-primary/[0.03] blur-[100px] ${reducedMotion ? "" : "animate-float"}`}
          />
          <div
            className={`absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full opacity-[0.03] blur-[80px] ${reducedMotion ? "" : "animate-float"}`}
            style={{
              background: "oklch(0.5 0.18 290)",
              animationDelay: "-2s",
            }}
          />
        </>
      )}
    </div>
  );
}

export const AnimatedBackground = memo(AnimatedBackgroundInner);

