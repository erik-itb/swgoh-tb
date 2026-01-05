"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { PHASES, PLANETS, getPlanetsByPhase, Planet } from "@/lib/roteData";

export default function HomePage() {
  const { data: session } = useSession();
  const [selectedPhase, setSelectedPhase] = useState<number>(1);
  const planets = getPlanetsByPhase(selectedPhase);

  return (
    <>
      {/* Navigation */}
      <nav className="navbar">
        <Link href="/" className="navbar-brand">
          <span>⚔️</span>
          <span>RotE TB Recommender</span>
        </Link>
        <ul className="navbar-nav">
          <li><Link href="/" className="navbar-link active">Squads</Link></li>
          <li><Link href={session ? "/admin" : "/login"} className="navbar-link">Admin</Link></li>
        </ul>
      </nav>

      {/* Hero Header */}
      <header className="page-header">
        <div className="container">
          <h1>Rise of the Empire</h1>
          <p>Territory Battle Squad Recommendations</p>
        </div>
      </header>

      <main className="container">
        {/* Phase Selector */}
        <div className="phase-selector">
          {PHASES.map((phase) => (
            <button
              key={phase.number}
              className={`phase-btn ${selectedPhase === phase.number ? "active" : ""}`}
              onClick={() => setSelectedPhase(phase.number)}
            >
              Phase {phase.number}
            </button>
          ))}
        </div>

        {/* Planet Grid */}
        <div className="planet-grid">
          {planets.map((planet) => (
            <PlanetCard key={planet.id} planet={planet} phase={selectedPhase} />
          ))}
        </div>

        {planets.length === 0 && (
          <div className="text-center text-secondary">
            <p>No planets found for Phase {selectedPhase}</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)" }}>
        <p>Not affiliated with EA, Capital Games, or Disney.</p>
        <p>Character portraits from swgoh.gg</p>
      </footer>
    </>
  );
}

function PlanetCard({ planet, phase }: { planet: Planet; phase: number }) {
  const combatCount = planet.missions.filter(m => m.type === "combat").length;
  const specialCount = planet.missions.filter(m => m.type === "special").length;
  const fleetCount = planet.missions.filter(m => m.type === "fleet").length;
  
  return (
    <Link href={`/${phase}/${planet.id}`} className="planet-card">
      <div 
        className="planet-card-image" 
        style={{ 
          background: `linear-gradient(135deg, var(--color-bg-secondary) 0%, var(--color-bg-card) 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "3rem"
        }}
      >
        {/* Placeholder - user will add planet images */}
        🪐
      </div>
      <div className="planet-card-content">
        <h3 className="planet-card-title">{planet.name}</h3>
        <p className="text-secondary text-sm mb-md">{planet.description}</p>
        <div className="planet-card-meta">
          {combatCount > 0 && (
            <span className="planet-card-badge">
              ⚔️ {combatCount} Combat
            </span>
          )}
          {specialCount > 0 && (
            <span className="planet-card-badge">
              ⭐ {specialCount} Special
            </span>
          )}
          {fleetCount > 0 && (
            <span className="planet-card-badge">
              🚀 {fleetCount} Fleet
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
