"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PHASES, PLANETS } from "@/lib/roteData";

interface Unit {
  id: string;
  name: string;
  type: "character" | "ship";
}

interface Video {
  id?: string;
  url: string;
  title?: string;
}

export default function EditInstructionPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const instructionId = params.id as string;
  
  // Form state
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch units
  useEffect(() => {
    async function fetchUnits() {
      try {
        const res = await fetch("/api/units");
        if (res.ok) {
          const data = await res.json();
          setUnits(data);
        }
      } catch (error) {
        console.error("Failed to fetch units:", error);
      }
    }
    fetchUnits();
  }, []);

  // Fetch existing instruction
  useEffect(() => {
    async function fetchInstruction() {
      try {
        const res = await fetch(`/api/instructions/${instructionId}`);
        if (res.ok) {
          const data = await res.json();
          setTitle(data.title);
          setPhase(data.phase);
          setPlanet(data.planet);
          setMissionNumber(data.missionNumber);
          setMissionType(data.missionType);
          setIsAutoPlay(data.isAutoPlay);
          setContent(data.content || "");
          setVideoUrls(data.videos?.length > 0 ? data.videos.map((v: Video) => v.url) : [""]);
          
          // Squad
          setSquadLeaderId(data.squadLeaderId || "");
          setSquadMember1Id(data.squadMember1Id || "");
          setSquadMember2Id(data.squadMember2Id || "");
          setSquadMember3Id(data.squadMember3Id || "");
          setSquadMember4Id(data.squadMember4Id || "");
          
          // Fleet
          setCapitalShipId(data.capitalShipId || "");
          setStarting1Id(data.starting1Id || "");
          setStarting2Id(data.starting2Id || "");
          setStarting3Id(data.starting3Id || "");
          setReinforcement1Id(data.reinforcement1Id || "");
          setReinforcement2Id(data.reinforcement2Id || "");
          setReinforcement3Id(data.reinforcement3Id || "");
          setReinforcement4Id(data.reinforcement4Id || "");
        } else {
          alert("Instruction not found");
          router.push("/admin");
        }
      } catch (error) {
        console.error("Failed to fetch instruction:", error);
        alert("Error loading instruction");
        router.push("/admin");
      } finally {
        setLoading(false);
      }
    }
    if (instructionId) {
      fetchInstruction();
    }
  }, [instructionId, router]);

  // Get available planets for selected phase
  const availablePlanets = PHASES.find(p => p.number === phase)?.planets || [];

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
      const res = await fetch(`/api/instructions/${instructionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        router.push("/admin");
      } else {
        alert("Failed to update instruction");
      }
    } catch (error) {
      console.error("Error saving:", error);
      alert("Error updating instruction");
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
              <Link href="/admin/instructions/new" className="admin-sidebar-link">
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
          <h1 className="mt-md">Edit Instruction</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card mb-lg">
            <h3 className="mb-lg">Basic Information</h3>
            
            <div className="grid-2 gap-lg" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., SLKR Counter Team"
                  required
                />
              </div>

              <div className="form-group">
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

              <div className="form-group">
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

              <div className="form-group">
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

              <div className="form-group">
                <label className="form-label">Mission Number</label>
                <input
                  type="number"
                  className="form-input"
                  value={missionNumber}
                  onChange={(e) => setMissionNumber(parseInt(e.target.value))}
                  min={1}
                  max={10}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Play Mode</label>
                <div className="toggle-container">
                  <button
                    type="button"
                    className={`toggle ${isAutoPlay ? "active" : ""}`}
                    onClick={() => setIsAutoPlay(!isAutoPlay)}
                  />
                  <span>{isAutoPlay ? "Auto Play" : "Manual Play"}</span>
                </div>
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
                  units={units.characters}
                  isLeader
                />
                <UnitSelector
                  label="Member 1"
                  value={squadMember1Id}
                  onChange={setSquadMember1Id}
                  units={units.characters}
                />
                <UnitSelector
                  label="Member 2"
                  value={squadMember2Id}
                  onChange={setSquadMember2Id}
                  units={units.characters}
                />
                <UnitSelector
                  label="Member 3"
                  value={squadMember3Id}
                  onChange={setSquadMember3Id}
                  units={units.characters}
                />
                <UnitSelector
                  label="Member 4"
                  value={squadMember4Id}
                  onChange={setSquadMember4Id}
                  units={units.characters}
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
                      <img 
                        src={`/characters/${id}.png`} 
                        alt={id}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
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
                  units={units.ships}
                  isLeader
                />
              </div>

              <h4 className="mb-md">Starting Ships</h4>
              <div className="grid-3 gap-lg mb-lg" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
                <UnitSelector
                  label="Starting 1"
                  value={starting1Id}
                  onChange={setStarting1Id}
                  units={units.ships}
                />
                <UnitSelector
                  label="Starting 2"
                  value={starting2Id}
                  onChange={setStarting2Id}
                  units={units.ships}
                />
                <UnitSelector
                  label="Starting 3"
                  value={starting3Id}
                  onChange={setStarting3Id}
                  units={units.ships}
                />
              </div>

              <h4 className="mb-md text-muted">Reinforcements</h4>
              <div className="grid-4 gap-lg" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                <UnitSelector
                  label="Reinforcement 1"
                  value={reinforcement1Id}
                  onChange={setReinforcement1Id}
                  units={units.ships}
                />
                <UnitSelector
                  label="Reinforcement 2"
                  value={reinforcement2Id}
                  onChange={setReinforcement2Id}
                  units={units.ships}
                />
                <UnitSelector
                  label="Reinforcement 3"
                  value={reinforcement3Id}
                  onChange={setReinforcement3Id}
                  units={units.ships}
                />
                <UnitSelector
                  label="Reinforcement 4"
                  value={reinforcement4Id}
                  onChange={setReinforcement4Id}
                  units={units.ships}
                />
              </div>
            </div>
          )}

          {/* Instructions Content */}
          <div className="card mb-lg">
            <h3 className="mb-lg">Instructions</h3>
            <p className="text-secondary mb-md">Write detailed battle instructions. HTML is supported.</p>
            
            <div className="form-group">
              <textarea
                className="form-textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="<p>Start by using Kylo's AOE...</p>"
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
              {saving ? "Saving..." : "Update Instruction"}
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
