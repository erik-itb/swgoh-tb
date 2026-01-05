"use client";

import React from "react";

interface MissionIcon {
  id: string;
  type: "combat" | "fleet" | "special";
  missionNumber: number;
  x: number; // percentage from left
  y: number; // percentage from top
  label?: string;
}

interface InteractivePlanetMapProps {
  planetId: string;
  mapImage: string;
  missions: MissionIcon[];
  onMissionClick: (missionKey: string) => void;
  activeMission?: string | null;
}

// Icon paths
const ICON_PATHS: Record<string, string> = {
  combat: "/icons/combat-mission.png",
  fleet: "/icons/fleet-mission.png",
  special: "/icons/special-mission-1.png",
};

export default function InteractivePlanetMap({
  planetId,
  mapImage,
  missions,
  onMissionClick,
  activeMission,
}: InteractivePlanetMapProps) {
  return (
    <div
      className="planet-map-container"
      style={{
        position: "relative",
        width: "100%",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        border: "2px solid var(--color-border)",
        boxShadow: "var(--shadow-lg)",
        backgroundColor: "var(--color-bg-card)",
      }}
    >
      {/* Background Map Image */}
      <img
        src={mapImage}
        alt={`${planetId} Territory Map`}
        style={{
          width: "100%",
          height: "auto",
          display: "block",
        }}
      />

      {/* Mission Icons Overlay */}
      {missions.map((mission) => {
        const missionKey = `${mission.type}-${mission.missionNumber}`;
        const isActive = activeMission === missionKey;

        return (
          <button
            key={mission.id}
            onClick={() => onMissionClick(missionKey)}
            title={mission.label || `${mission.type} Mission ${mission.missionNumber}`}
            style={{
              position: "absolute",
              left: `${mission.x}%`,
              top: `${mission.y}%`,
              transform: "translate(-50%, -50%)",
              width: "48px",
              height: "48px",
              padding: 0,
              border: isActive ? "3px solid var(--color-accent-gold)" : "2px solid transparent",
              borderRadius: "50%",
              background: isActive ? "rgba(255, 193, 7, 0.3)" : "rgba(0, 0, 0, 0.5)",
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: isActive
                ? "0 0 20px rgba(255, 193, 7, 0.5)"
                : "0 2px 8px rgba(0, 0, 0, 0.5)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translate(-50%, -50%) scale(1.15)";
              e.currentTarget.style.boxShadow = "0 0 15px rgba(0, 123, 255, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translate(-50%, -50%) scale(1)";
              e.currentTarget.style.boxShadow = isActive
                ? "0 0 20px rgba(255, 193, 7, 0.5)"
                : "0 2px 8px rgba(0, 0, 0, 0.5)";
            }}
          >
            <img
              src={ICON_PATHS[mission.type]}
              alt={`${mission.type} mission`}
              style={{
                width: "32px",
                height: "32px",
                objectFit: "contain",
              }}
            />
          </button>
        );
      })}

      {/* Legend */}
      <div
        style={{
          position: "absolute",
          bottom: "10px",
          right: "10px",
          background: "rgba(7, 20, 38, 0.9)",
          padding: "8px 12px",
          borderRadius: "var(--radius-md)",
          fontSize: "0.75rem",
          color: "var(--color-text-secondary)",
          display: "flex",
          gap: "12px",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <img src={ICON_PATHS.combat} alt="" style={{ width: "16px", height: "16px" }} />
          Combat
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <img src={ICON_PATHS.fleet} alt="" style={{ width: "16px", height: "16px" }} />
          Fleet
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <img src={ICON_PATHS.special} alt="" style={{ width: "16px", height: "16px" }} />
          Special
        </span>
      </div>
    </div>
  );
}

// Mustafar mission positions - extracted from SVG image map (viewBox 1024x256)
export const MUSTAFAR_MISSIONS: MissionIcon[] = [
  { id: "mustafar-combat-1", type: "combat", missionNumber: 1, x: 63.18, y: 22.66, label: "Combat Mission 1 - LV" },
  { id: "mustafar-combat-2", type: "combat", missionNumber: 2, x: 68.75, y: 28.13, label: "Combat Mission 2" },
  { id: "mustafar-combat-3", type: "combat", missionNumber: 3, x: 71.39, y: 50.39, label: "Combat Mission 3" },
  { id: "mustafar-combat-4", type: "combat", missionNumber: 4, x: 60.06, y: 48.44, label: "Combat Mission 4" },
  { id: "mustafar-fleet-1", type: "fleet", missionNumber: 1, x: 75.88, y: 21.09, label: "Fleet Mission" },
];
