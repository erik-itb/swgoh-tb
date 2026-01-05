"use client";

import React, { useState } from "react";

interface MissionNode {
  id: string;
  type: "combat" | "fleet" | "special";
  missionNumber: number;
  x: number; // absolute position in original image coords
  y: number; // absolute position in original image coords
  label?: string;
}

interface PlanetMapConfig {
  // Original image dimensions
  imageWidth: number;
  imageHeight: number;
  // Focused viewBox (crops to region of interest)
  viewBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  // Mission nodes with absolute coordinates
  missions: MissionNode[];
  // Image path
  imagePath: string;
}

interface SVGPlanetMapProps {
  config: PlanetMapConfig;
  onMissionClick: (missionKey: string) => void;
  activeMission?: string | null;
}

// Icon paths for in-game mission icons
const ICON_PATHS: Record<string, string> = {
  combat: "/icons/combat-mission.png",
  fleet: "/icons/fleet-mission.png",
  special: "/icons/special-mission-1.png",
};

// Base icon sizes (these get scaled down on larger screens)
const BASE_ICON_SIZE = 28; // Base size of the icon image
const BASE_RING_SIZE = 36; // Base size of the background ring

// Get size multiplier based on container width (inverse scaling)
function getSizeMultiplier(containerWidth: number): number {
  // On small screens (< 500px), icons are normal size
  // On medium screens (500-800px), icons are slightly smaller
  // On large screens (> 800px), icons are even smaller relative to container
  if (containerWidth < 500) return 1.0;
  if (containerWidth < 700) return 0.85;
  if (containerWidth < 900) return 0.75;
  return 0.65; // Large screens get smaller icons
}

export default function SVGPlanetMap({
  config,
  onMissionClick,
  activeMission,
}: SVGPlanetMapProps) {
  const [hoveredMission, setHoveredMission] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState(600); // Default width
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { viewBox, missions, imagePath, imageWidth, imageHeight } = config;

  // Track container width for responsive sizing
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateWidth = () => {
      setContainerWidth(container.offsetWidth);
    };

    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  // Calculate responsive icon size
  const sizeMultiplier = getSizeMultiplier(containerWidth);
  const ICON_SIZE = BASE_ICON_SIZE * sizeMultiplier;
  const RING_SIZE = BASE_RING_SIZE * sizeMultiplier;

  return (
    <div
      ref={containerRef}
      style={{
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        border: "2px solid var(--color-border)",
        boxShadow: "var(--shadow-lg)",
        backgroundColor: "#000",
      }}
    >
      <svg
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        style={{
          width: "100%",
          height: "auto",
          display: "block",
        }}
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Background Image */}
        <image
          href={imagePath}
          x={0}
          y={0}
          width={imageWidth}
          height={imageHeight}
          preserveAspectRatio="none"
        />

        {/* Mission Nodes */}
        {missions.map((mission) => {
          const missionKey = `${mission.type}-${mission.missionNumber}`;
          const isActive = activeMission === missionKey;
          const isHovered = hoveredMission === missionKey;

          // Colors based on mission type
          const typeColors: Record<string, { fill: string; stroke: string; glow: string }> = {
            combat: { fill: "rgba(220, 53, 69, 0.3)", stroke: "#ff6b6b", glow: "#dc3545" },
            fleet: { fill: "rgba(13, 110, 253, 0.3)", stroke: "#6ea8fe", glow: "#0d6efd" },
            special: { fill: "rgba(255, 193, 7, 0.3)", stroke: "#ffda6a", glow: "#ffc107" },
          };
          const colors = typeColors[mission.type] || typeColors.combat;

          // Scale factor for hover/active states
          const scale = isHovered ? 1.15 : isActive ? 1.1 : 1;
          const iconSize = ICON_SIZE * scale;
          const ringRadius = (RING_SIZE / 2) * scale;

          return (
            <g
              key={mission.id}
              style={{ cursor: "pointer" }}
              onClick={() => onMissionClick(missionKey)}
              onMouseEnter={() => setHoveredMission(missionKey)}
              onMouseLeave={() => setHoveredMission(null)}
            >
              {/* Outer glow for active/hovered */}
              {(isActive || isHovered) && (
                <circle
                  cx={mission.x}
                  cy={mission.y}
                  r={ringRadius + 10}
                  fill="none"
                  stroke={isActive ? "#ffc107" : colors.stroke}
                  strokeWidth={3}
                  opacity={0.6}
                  style={{
                    filter: "blur(3px)",
                  }}
                />
              )}

              {/* Background ring with slight transparency */}
              <circle
                cx={mission.x}
                cy={mission.y}
                r={ringRadius}
                fill="rgba(0, 0, 0, 0.6)"
                stroke={isActive ? "#ffc107" : isHovered ? colors.stroke : "rgba(255,255,255,0.4)"}
                strokeWidth={isActive ? 3 : 2}
              />

              {/* The actual in-game mission icon */}
              <image
                href={ICON_PATHS[mission.type]}
                x={mission.x - iconSize / 2}
                y={mission.y - iconSize / 2}
                width={iconSize}
                height={iconSize}
                style={{ pointerEvents: "none" }}
              />

              {/* Mission number badge */}
              <circle
                cx={mission.x + ringRadius * 0.7}
                cy={mission.y - ringRadius * 0.7}
                r={(ICON_SIZE / 4) * scale}
                fill="rgba(0, 0, 0, 0.9)"
                stroke="white"
                strokeWidth={1}
              />
              <text
                x={mission.x + ringRadius * 0.7}
                y={mission.y - ringRadius * 0.7}
                textAnchor="middle"
                dominantBaseline="central"
                fill="white"
                fontSize={(ICON_SIZE / 4) * scale}
                fontWeight="bold"
                fontFamily="system-ui, sans-serif"
                style={{ pointerEvents: "none" }}
              >
                {mission.missionNumber}
              </text>

              {/* Tooltip on hover */}
              {isHovered && (
                <g>
                  <rect
                    x={mission.x - 70}
                    y={mission.y + ringRadius + 8}
                    width={140}
                    height={22}
                    rx={4}
                    fill="rgba(0, 0, 0, 0.95)"
                    stroke="rgba(255,255,255,0.3)"
                  />
                  <text
                    x={mission.x}
                    y={mission.y + ringRadius + 21}
                    textAnchor="middle"
                    fill="white"
                    fontSize={11}
                    fontFamily="system-ui, sans-serif"
                  >
                    {mission.label || `${mission.type} ${mission.missionNumber}`}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Legend with icons */}
        <g transform={`translate(${viewBox.x + viewBox.width - 130}, ${viewBox.y + viewBox.height - 35})`}>
          <rect
            x={0}
            y={0}
            width={125}
            height={30}
            rx={4}
            fill="rgba(7, 20, 38, 0.9)"
            stroke="rgba(255,255,255,0.2)"
          />
          {/* Combat */}
          <image href={ICON_PATHS.combat} x={5} y={5} width={20} height={20} />
          <text x={28} y={19} fill="white" fontSize={9}>Combat</text>
          {/* Fleet */}
          <image href={ICON_PATHS.fleet} x={65} y={5} width={20} height={20} />
          <text x={88} y={19} fill="white" fontSize={9}>Fleet</text>
        </g>
      </svg>
    </div>
  );
}

// Helper function to calculate viewBox from mission coordinates
export function calculateViewBox(
  missions: MissionNode[],
  imageWidth: number,
  imageHeight: number,
  padding: number = 40 // padding in image units
): PlanetMapConfig["viewBox"] {
  if (missions.length === 0) {
    return { x: 0, y: 0, width: imageWidth, height: imageHeight };
  }

  const xCoords = missions.map((m) => m.x);
  const yCoords = missions.map((m) => m.y);

  const minX = Math.min(...xCoords);
  const maxX = Math.max(...xCoords);
  const minY = Math.min(...yCoords);
  const maxY = Math.max(...yCoords);

  // Add padding
  const x = Math.max(0, minX - padding);
  const y = Math.max(0, minY - padding);
  const width = Math.min(imageWidth - x, maxX - minX + padding * 2);
  const height = Math.min(imageHeight - y, maxY - minY + padding * 2);

  return { x, y, width, height };
}

// ============================================
// MUSTAFAR CONFIG
// ============================================
// Original image is 1024x256 (from your SVG viewBox)
// Mission coordinates extracted from your SVG image map

const MUSTAFAR_MISSIONS: MissionNode[] = [
  { id: "mustafar-combat-1", type: "combat", missionNumber: 1, x: 647, y: 58, label: "Combat Mission 1 - LV" },
  { id: "mustafar-combat-2", type: "combat", missionNumber: 2, x: 704, y: 72, label: "Combat Mission 2" },
  { id: "mustafar-combat-3", type: "combat", missionNumber: 3, x: 731, y: 129, label: "Combat Mission 3" },
  { id: "mustafar-combat-4", type: "combat", missionNumber: 4, x: 615, y: 124, label: "Combat Mission 4" },
  { id: "mustafar-fleet-1", type: "fleet", missionNumber: 1, x: 777, y: 54, label: "Fleet Mission" },
];

export const MUSTAFAR_CONFIG: PlanetMapConfig = {
  imageWidth: 1024,
  imageHeight: 256,
  imagePath: "/planets/mustafar-map.png",
  missions: MUSTAFAR_MISSIONS,
  // Calculated viewBox - crops to mission area with padding
  viewBox: calculateViewBox(MUSTAFAR_MISSIONS, 1024, 256, 50),
};

// Export for backward compatibility with old component
export { MUSTAFAR_MISSIONS };
