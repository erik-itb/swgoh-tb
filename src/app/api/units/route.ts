import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

interface UnitsManifest {
  units: Record<string, {
    name: string;
    type: "CHARACTER" | "SHIP";
    alignment: string;
    thumbnailName: string;
    categories: string[];
  }>;
}

interface AssetManifest {
  assets: {
    characters: { gameId: string; file: string; format: string }[];
    ships: { gameId: string; file: string; format: string }[];
  };
}

export async function GET() {
  try {
    // Try to load the units manifest first (has proper names)
    const unitsManifestPath = path.join(process.cwd(), "data", "units-manifest.json");
    
    let unitsManifest: UnitsManifest | null = null;
    if (fs.existsSync(unitsManifestPath)) {
      const content = fs.readFileSync(unitsManifestPath, "utf-8");
      unitsManifest = JSON.parse(content);
    }

    // Load asset manifest to know which units we have portrait images for
    const assetManifestPath = path.join(process.cwd(), "assets", "manifest.json");
    
    if (!fs.existsSync(assetManifestPath)) {
      return NextResponse.json({
        characters: [],
        ships: [],
        error: "Asset manifest not found. Run the asset downloader first."
      });
    }

    const assetContent = fs.readFileSync(assetManifestPath, "utf-8");
    const assetManifest: AssetManifest = JSON.parse(assetContent);

    // Helper to get proper name from units manifest, or format from gameId
    const getUnitName = (gameId: string): string => {
      if (unitsManifest?.units[gameId]) {
        return unitsManifest.units[gameId].name;
      }
      // Fallback to formatted gameId
      return formatUnitName(gameId);
    };

    // Helper to get alignment from units manifest
    const getAlignment = (gameId: string): "dark" | "light" | "neutral" => {
      if (unitsManifest?.units[gameId]) {
        const unit = unitsManifest.units[gameId];
        if (unit.alignment === "DARK") return "dark";
        if (unit.alignment === "LIGHT") return "light";
      }
      return "neutral";
    };

    // Transform to a simpler format for the frontend
    const characters = assetManifest.assets.characters.map(c => ({
      id: c.gameId,
      name: getUnitName(c.gameId),
      type: "character" as const,
      alignment: getAlignment(c.gameId)
    }));

    const ships = assetManifest.assets.ships.map(s => ({
      id: s.gameId,
      name: getUnitName(s.gameId),
      type: "ship" as const,
      alignment: getAlignment(s.gameId)
    }));

    // Sort alphabetically by name
    characters.sort((a, b) => a.name.localeCompare(b.name));
    ships.sort((a, b) => a.name.localeCompare(b.name));

    // Add "Any Unit" option at the top of both lists
    const anyCharacter = { id: "ANY_UNIT", name: "Any Unit (+1)", type: "character" as const, alignment: "neutral" as const };
    const anyShip = { id: "ANY_SHIP", name: "Any Ship (+1)", type: "ship" as const, alignment: "neutral" as const };

    return NextResponse.json({
      characters: [anyCharacter, ...characters],
      ships: [anyShip, ...ships]
    });
  } catch (error) {
    console.error("Error loading units:", error);
    return NextResponse.json(
      { error: "Failed to load units" },
      { status: 500 }
    );
  }
}

// Fallback: Convert gameId to readable name
function formatUnitName(gameId: string): string {
  // Handle special cases
  const specialCases: Record<string, string> = {
    "50RT": "50R-T",
    "BB8": "BB-8",
    "BT1": "BT-1",
    "C3POLEGENDARY": "C-3PO",
    "C3POCHEWBACCA": "C-3PO & Chewbacca",
    "CT5555": "CT-5555 (Fives)",
    "CT7567": "CT-7567 (Rex)",
    "CT210408": "CT-21-0408 (Echo)",
    "CC2224": "CC-2224 (Cody)",
    "HK47": "HK-47",
    "IG11": "IG-11",
    "IG12": "IG-12",
    "IG86SENTINELDROID": "IG-86 Sentinel Droid",
    "IG88": "IG-88",
    "K2SO": "K-2SO",
    "L3_37": "L3-37",
    "R2D2_LEGENDARY": "R2-D2",
    "T3_M4": "T3-M4",
    "SUPREMELEADERKYLOREN": "Supreme Leader Kylo Ren"
  };

  if (specialCases[gameId]) {
    return specialCases[gameId];
  }

  // Standard conversion: split on capitals/underscores, title case
  return gameId
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/(\\d+)/g, " $1 ")
    .trim()
    .split(/\\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
