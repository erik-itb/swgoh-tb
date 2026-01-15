"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { PHASES, PLANETS } from "@/lib/roteData";

interface Unit {
  id: string;
  name: string;
  type: "character" | "ship";
  alignment: "dark" | "light" | "neutral";
}

export default function NewInstructionPage() {
  return (
    <Suspense fallback={
      <div className="flex-center" style={{ minHeight: "100vh" }}>
        <p>Loading...</p>
      </div>
    }>
      <NewInstructionContent />
    </Suspense>
  );
}

function NewInstructionContent() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Track if form was pre-populated from URL params
  const [prePopulated, setPrePopulated] = useState(false);
  
  // Form state - initialized with defaults, will be updated from URL params
  const [title, setTitle] = useState("");
  const [phase, setPhase] = useState(1);
  const [planet, setPlanet] = useState("");
  const [missionNumber, setMissionNumber] = useState(1);
  const [missionType, setMissionType] = useState<"combat" | "special" | "fleet">("combat");
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [content, setContent] = useState("");
  const [videoUrls, setVideoUrls] = useState<string[]>([""]);
  
  // Squad state
  const [squadLeaderId, setSquadLeaderId] = useState("");
  const [squadMember1Id, setSquadMember1Id] = useState("");
  const [squadMember2Id, setSquadMember2Id] = useState("");
  const [squadMember3Id, setSquadMember3Id] = useState("");
  const [squadMember4Id, setSquadMember4Id] = useState("");
  
  // Fleet state  
  const [capitalShipId, setCapitalShipId] = useState("");
  const [starting1Id, setStarting1Id] = useState("");
  const [starting2Id, setStarting2Id] = useState("");
  const [starting3Id, setStarting3Id] = useState("");
  const [reinforcement1Id, setReinforcement1Id] = useState("");
  const [reinforcement2Id, setReinforcement2Id] = useState("");
  const [reinforcement3Id, setReinforcement3Id] = useState("");
  const [reinforcement4Id, setReinforcement4Id] = useState("");
  
  // Units data
  const [units, setUnits] = useState<{ characters: Unit[]; ships: Unit[] }>({ characters: [], ships: [] });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Pre-populate form from URL params on mount
  useEffect(() => {
    const urlPhase = searchParams.get("phase");
    const urlPlanet = searchParams.get("planet");
    const urlMissionType = searchParams.get("missionType");
    const urlMissionNumber = searchParams.get("missionNumber");
    
    let hasPrePopulated = false;
    
    // Validate and set phase (1-6)
    if (urlPhase) {
      const phaseNum = parseInt(urlPhase);
      if (phaseNum >= 1 && phaseNum <= 6) {
        setPhase(phaseNum);
        hasPrePopulated = true;
      }
    }
    
    // Validate and set planet
    if (urlPlanet && PLANETS[urlPlanet]) {
      setPlanet(urlPlanet);
      hasPrePopulated = true;
    }
    
    // Validate and set mission type
    if (urlMissionType && ["combat", "special", "fleet"].includes(urlMissionType)) {
      setMissionType(urlMissionType as "combat" | "special" | "fleet");
      hasPrePopulated = true;
    }
    
    // Validate and set mission number
    if (urlMissionNumber) {
      const missionNum = parseInt(urlMissionNumber);
      if (missionNum >= 1 && missionNum <= 10) {
        setMissionNumber(missionNum);
        hasPrePopulated = true;
      }
    }
    
    setPrePopulated(hasPrePopulated);
  }, [searchParams]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchUnits() {
      setLoading(true);
      try {
        const res = await fetch("/api/units");
        if (res.ok) {
          const data = await res.json();
          setUnits(data);
        }
      } catch (error) {
        console.error("Failed to fetch units:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchUnits();
  }, []);

  // Get available planets for selected phase
  const availablePlanets = PHASES.find(p => p.number === phase)?.planets || [];

  // Get current planet data
  const currentPlanet = planet ? PLANETS[planet] : null;

  // Get available missions of the selected type for the current planet
  const availableMissionsForType = currentPlanet?.missions.filter(m => m.type === missionType) || [];

  // Filter units by planet alignment
  const filteredCharacters = units.characters.filter(u => {
    if (u.id === "ANY_UNIT") return true; // Always show Any Unit
    if (!currentPlanet || currentPlanet.alignment === "mixed") return true;
    return u.alignment === currentPlanet.alignment || u.alignment === "neutral";
  });

  const filteredShips = units.ships.filter(u => {
    if (u.id === "ANY_SHIP") return true; // Always show Any Ship
    if (!currentPlanet || currentPlanet.alignment === "mixed") return true;
    return u.alignment === currentPlanet.alignment || u.alignment === "neutral";
  });

  // Auto-select first planet when phase changes
  useEffect(() => {
    if (availablePlanets.length > 0 && !availablePlanets.includes(planet)) {
      setPlanet(availablePlanets[0]);
    }
  }, [phase, availablePlanets, planet]);

  // Auto-select valid mission number when type changes
  useEffect(() => {
    if (availableMissionsForType.length > 0) {
      const validNumbers = availableMissionsForType.map(m => m.number);
      if (!validNumbers.includes(missionNumber)) {
        setMissionNumber(validNumbers[0]);
      }
    }
  }, [missionType, planet, availableMissionsForType, missionNumber]);

  const addVideoUrl = () => {
    setVideoUrls([...videoUrls, ""]);
  };

  const removeVideoUrl = (index: number) => {
    setVideoUrls(videoUrls.filter((_, i) => i !== index));
  };

  const updateVideoUrl = (index: number, value: string) => {
    const newUrls = [...videoUrls];
    newUrls[index] = value;
    setVideoUrls(newUrls);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      title,
      phase,
      planet,
      missionNumber,
      missionType,
      isAutoPlay,
      content,
      // Squad (for ground missions)
      ...(missionType !== "fleet" && {
        squadLeaderId: squadLeaderId || null,
        squadMember1Id: squadMember1Id || null,
        squadMember2Id: squadMember2Id || null,
        squadMember3Id: squadMember3Id || null,
        squadMember4Id: squadMember4Id || null,
      }),
      // Fleet (for fleet missions)
      ...(missionType === "fleet" && {
        capitalShipId: capitalShipId || null,
        starting1Id: starting1Id || null,
        starting2Id: starting2Id || null,
        starting3Id: starting3Id || null,
        reinforcement1Id: reinforcement1Id || null,
        reinforcement2Id: reinforcement2Id || null,
        reinforcement3Id: reinforcement3Id || null,
        reinforcement4Id: reinforcement4Id || null,
      }),
      videos: videoUrls.filter(url => url.trim()).map(url => ({ url }))
    };

    try {
      const res = await fetch("/api/instructions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        router.push("/admin");
      } else {
        alert("Failed to save instruction");
      }
    } catch (error) {
      console.error("Error saving:", error);
      alert("Error saving instruction");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex-center" style={{ minHeight: "100vh" }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div style={{ marginBottom: "2rem" }}>
          <Link href="/" className="navbar-brand">
            <span>⚔️</span>
            <span>RotE TB</span>
          </Link>
        </div>
        
        <nav>
          <ul className="admin-sidebar-nav">
            <li>
              <Link href="/admin" className="admin-sidebar-link">
                📊 Dashboard
              </Link>
            </li>
            <li>
              <Link href="/admin/instructions/new" className="admin-sidebar-link active">
                ➕ New Instruction
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <div className="mb-xl">
          <Link href="/admin" className="text-secondary">← Back to Dashboard</Link>
          <h1 className="mt-md">Create New Instruction</h1>
          {prePopulated && (
            <p className="text-muted mt-sm" style={{ fontSize: "0.9rem" }}>
              📍 Mission location pre-filled from your selection
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card mb-lg">
            <h3 className="mb-lg">Basic Information</h3>
            
            {/* Title - Full Width */}
            <div className="form-group mb-lg">
              <label className="form-label">Title</label>
              <input
                type="text"
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., SLKR Counter Team"
                required
                autoFocus={prePopulated}
              />
            </div>

            {/* Phase / Planet - 50/50 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Phase</label>
                <select
                  className="form-select"
                  value={phase}
                  onChange={(e) => setPhase(parseInt(e.target.value))}
                >
                  {PHASES.map(p => (
                    <option key={p.number} value={p.number}>Phase {p.number}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Planet</label>
                <select
                  className="form-select"
                  value={planet}
                  onChange={(e) => setPlanet(e.target.value)}
                >
                  {availablePlanets.map(pid => (
                    <option key={pid} value={pid}>{PLANETS[pid]?.name || pid}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mission Type / Mission Number - 50/50 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Mission Type</label>
                <select
                  className="form-select"
                  value={missionType}
                  onChange={(e) => setMissionType(e.target.value as "combat" | "special" | "fleet")}
                >
                  <option value="combat">Combat Mission</option>
                  <option value="special">Special Mission</option>
                  <option value="fleet">Fleet Mission</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Mission Number</label>
                <select
                  className="form-select"
                  value={missionNumber}
                  onChange={(e) => setMissionNumber(parseInt(e.target.value))}
                >
                  {availableMissionsForType.length > 0 ? (
                    availableMissionsForType.map(m => (
                      <option key={m.number} value={m.number}>
                        #{m.number}{m.label ? ` - ${m.label}` : ""}
                      </option>
                    ))
                  ) : (
                    <option value={1}>No missions of this type</option>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Squad Builder (for ground missions) */}
          {missionType !== "fleet" && (
            <div className="card mb-lg">
              <h3 className="mb-lg">Squad Builder</h3>
              <p className="text-secondary mb-lg">Select 5 characters: 1 Leader + 4 Team Members</p>
              
              <div className="grid-2 gap-lg" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
                <UnitSelector
                  label="Leader"
                  value={squadLeaderId}
                  onChange={setSquadLeaderId}
                  units={filteredCharacters}
                  isLeader
                />
                <UnitSelector
                  label="Member 1"
                  value={squadMember1Id}
                  onChange={setSquadMember1Id}
                  units={filteredCharacters}
                />
                <UnitSelector
                  label="Member 2"
                  value={squadMember2Id}
                  onChange={setSquadMember2Id}
                  units={filteredCharacters}
                />
                <UnitSelector
                  label="Member 3"
                  value={squadMember3Id}
                  onChange={setSquadMember3Id}
                  units={filteredCharacters}
                />
                <UnitSelector
                  label="Member 4"
                  value={squadMember4Id}
                  onChange={setSquadMember4Id}
                  units={filteredCharacters}
                />
              </div>

              {/* Preview */}
              <div className="portrait-row mt-lg">
                {[squadLeaderId, squadMember1Id, squadMember2Id, squadMember3Id, squadMember4Id]
                  .filter(Boolean)
                  .map((id, idx) => (
                    <div 
                      key={idx} 
                      className={`portrait ${idx === 0 ? "leader" : ""}`}
                      title={id}
                    >
                      {id === "ANY_UNIT" ? (
                        <div style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "var(--color-bg-secondary)",
                          borderRadius: "50%",
                          fontSize: "1.25rem",
                          fontWeight: "bold",
                          color: "var(--color-text-muted)"
                        }}>
                          +1
                        </div>
                      ) : (
                        <img 
                          src={`/characters/${id}.png`} 
                          alt={id}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Fleet Builder (for fleet missions) */}
          {missionType === "fleet" && (
            <div className="card mb-lg">
              <h3 className="mb-lg">Fleet Builder</h3>
              <p className="text-secondary mb-lg">Select 8 ships: 1 Capital + 3 Starting + 4 Reinforcements</p>
              
              <h4 className="mb-md text-gold">Capital Ship</h4>
              <div className="grid-2 gap-lg mb-lg" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
                <UnitSelector
                  label="Capital Ship"
                  value={capitalShipId}
                  onChange={setCapitalShipId}
                  units={filteredShips}
                  isLeader
                />
              </div>

              <h4 className="mb-md">Starting Ships</h4>
              <div className="grid-3 gap-lg mb-lg" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
                <UnitSelector
                  label="Starting 1"
                  value={starting1Id}
                  onChange={setStarting1Id}
                  units={filteredShips}
                />
                <UnitSelector
                  label="Starting 2"
                  value={starting2Id}
                  onChange={setStarting2Id}
                  units={filteredShips}
                />
                <UnitSelector
                  label="Starting 3"
                  value={starting3Id}
                  onChange={setStarting3Id}
                  units={filteredShips}
                />
              </div>

              <h4 className="mb-md text-muted">Reinforcements</h4>
              <div className="grid-4 gap-lg" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                <UnitSelector
                  label="Reinforcement 1"
                  value={reinforcement1Id}
                  onChange={setReinforcement1Id}
                  units={filteredShips}
                />
                <UnitSelector
                  label="Reinforcement 2"
                  value={reinforcement2Id}
                  onChange={setReinforcement2Id}
                  units={filteredShips}
                />
                <UnitSelector
                  label="Reinforcement 3"
                  value={reinforcement3Id}
                  onChange={setReinforcement3Id}
                  units={filteredShips}
                />
                <UnitSelector
                  label="Reinforcement 4"
                  value={reinforcement4Id}
                  onChange={setReinforcement4Id}
                  units={filteredShips}
                />
              </div>
            </div>
          )}

          {/* Instructions Content */}
          <div className="card mb-lg">
            <h3 className="mb-lg">Instructions</h3>
            
            {/* Play Mode Toggle */}
            <div className="form-group mb-lg" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Play Mode:</label>
              <div className="toggle-container">
                <button
                  type="button"
                  className={`toggle ${isAutoPlay ? "active" : ""}`}
                  onClick={() => setIsAutoPlay(!isAutoPlay)}
                />
                <span>{isAutoPlay ? "Auto Play" : "Manual Play"}</span>
              </div>
            </div>

            <p className="text-secondary mb-md">Write detailed battle instructions. HTML is supported.</p>
            
            <div className="form-group">
              <textarea
                className="form-textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="<p>Start by using Kylo's AOE...</p>

<ul>
  <li>Target the weakest enemy first</li>
  <li>Save ultimate for wave 4</li>
</ul>

<p><strong>Key tip:</strong> Keep Hux alive for TM gains.</p>"
                style={{ minHeight: "250px", fontFamily: "monospace" }}
              />
            </div>
          </div>

          {/* Video URLs */}
          <div className="card mb-lg">
            <h3 className="mb-lg">Video Guides</h3>
            <p className="text-secondary mb-md">Add YouTube video URLs for reference.</p>
            
            {videoUrls.map((url, idx) => (
              <div key={idx} className="flex gap-md mb-md" style={{ alignItems: "flex-end" }}>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label className="form-label">Video URL {idx + 1}</label>
                  <input
                    type="url"
                    className="form-input"
                    value={url}
                    onChange={(e) => updateVideoUrl(idx, e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>
                {videoUrls.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => removeVideoUrl(idx)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            
            <button type="button" className="btn btn-secondary" onClick={addVideoUrl}>
              + Add Another Video
            </button>
          </div>

          {/* Submit */}
          <div className="flex gap-md">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save Instruction"}
            </button>
            <Link href="/admin" className="btn btn-secondary">Cancel</Link>
          </div>
        </form>
      </main>
    </div>
  );
}

function UnitSelector({ 
  label, 
  value, 
  onChange, 
  units,
  isLeader = false 
}: { 
  label: string;
  value: string;
  onChange: (value: string) => void;
  units: Unit[];
  isLeader?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  
  const filteredUnits = units.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.id.toLowerCase().includes(search.toLowerCase())
  );

  const selectedUnit = units.find(u => u.id === value);

  return (
    <div className="form-group" style={{ position: "relative" }}>
      <label className="form-label" style={{ color: isLeader ? "var(--color-accent-gold)" : undefined }}>
        {isLeader && "👑 "}{label}
      </label>
      
      <div style={{ position: "relative" }}>
        <input
          type="text"
          className="form-input"
          value={isOpen ? search : selectedUnit?.name || ""}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder="Search units..."
        />
        
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setSearch("");
            }}
            style={{
              position: "absolute",
              right: "8px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              color: "var(--color-text-muted)",
              cursor: "pointer"
            }}
          >
            ✕
          </button>
        )}
      </div>
      
      {isOpen && filteredUnits.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            maxHeight: "200px",
            overflow: "auto",
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            zIndex: 100
          }}
        >
          {filteredUnits.slice(0, 50).map(unit => (
            <div
              key={unit.id}
              onClick={() => {
                onChange(unit.id);
                setSearch("");
                setIsOpen(false);
              }}
              style={{
                padding: "0.5rem 1rem",
                cursor: "pointer",
                borderBottom: "1px solid var(--color-border)"
              }}
              className="hover-bg"
              onMouseEnter={(e) => {
                (e.target as HTMLDivElement).style.background = "var(--color-bg-card-hover)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLDivElement).style.background = "transparent";
              }}
            >
              {unit.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
