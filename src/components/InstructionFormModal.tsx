"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { PHASES, PLANETS } from "@/lib/roteData";
import { useInstructionModal } from "./InstructionModalContext";

interface Unit {
  id: string;
  name: string;
  type: "character" | "ship";
  alignment: "dark" | "light" | "neutral";
}

export default function InstructionFormModal() {
  const { data: session } = useSession();
  const { isOpen, defaultValues, onSaveCallback, closeModal } = useInstructionModal();
  
  // Determine if opened with pre-filled location (from frontend)
  const hasPrefilledLocation = !!(
    defaultValues?.phase && 
    defaultValues?.planet && 
    defaultValues?.missionType && 
    defaultValues?.missionNumber
  );
  
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
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset all form fields
      setTitle("");
      setIsAutoPlay(false);
      setContent("");
      setVideoUrls([""]);
      setSquadLeaderId("");
      setSquadMember1Id("");
      setSquadMember2Id("");
      setSquadMember3Id("");
      setSquadMember4Id("");
      setCapitalShipId("");
      setStarting1Id("");
      setStarting2Id("");
      setStarting3Id("");
      setReinforcement1Id("");
      setReinforcement2Id("");
      setReinforcement3Id("");
      setReinforcement4Id("");
      
      // Set default values if provided
      if (defaultValues?.phase) setPhase(defaultValues.phase);
      if (defaultValues?.planet) setPlanet(defaultValues.planet);
      if (defaultValues?.missionType) setMissionType(defaultValues.missionType);
      if (defaultValues?.missionNumber) setMissionNumber(defaultValues.missionNumber);
    }
  }, [isOpen, defaultValues]);

  // Fetch units when modal opens
  useEffect(() => {
    if (isOpen && units.characters.length === 0) {
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
    }
  }, [isOpen, units.characters.length]);

  // Get available planets for selected phase
  const availablePlanets = PHASES.find(p => p.number === phase)?.planets || [];

  // Get current planet data
  const currentPlanet = planet ? PLANETS[planet] : null;

  // Get available missions of the selected type for the current planet
  const availableMissionsForType = currentPlanet?.missions.filter(m => m.type === missionType) || [];

  // Filter units by planet alignment
  const filteredCharacters = units.characters.filter(u => {
    if (u.id === "ANY_UNIT") return true;
    if (!currentPlanet || currentPlanet.alignment === "mixed") return true;
    return u.alignment === currentPlanet.alignment || u.alignment === "neutral";
  });

  const filteredShips = units.ships.filter(u => {
    if (u.id === "ANY_SHIP") return true;
    if (!currentPlanet || currentPlanet.alignment === "mixed") return true;
    return u.alignment === currentPlanet.alignment || u.alignment === "neutral";
  });

  // Auto-select first planet when phase changes (only if not prefilled)
  useEffect(() => {
    if (!hasPrefilledLocation && availablePlanets.length > 0 && !availablePlanets.includes(planet)) {
      setPlanet(availablePlanets[0]);
    }
  }, [phase, availablePlanets, planet, hasPrefilledLocation]);

  // Auto-select valid mission number when type changes (only if not prefilled)
  useEffect(() => {
    if (!hasPrefilledLocation && availableMissionsForType.length > 0) {
      const validNumbers = availableMissionsForType.map(m => m.number);
      if (!validNumbers.includes(missionNumber)) {
        setMissionNumber(validNumbers[0]);
      }
    }
  }, [missionType, planet, availableMissionsForType, missionNumber, hasPrefilledLocation]);

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
        if (onSaveCallback) {
          onSaveCallback();
        } else if (hasPrefilledLocation) {
          // Reload page when opened from frontend to show new instruction
          window.location.reload();
        }
        closeModal();
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

  // Don't render if not authenticated or not open
  if (!session || !isOpen) return null;

  const typeLabels: Record<string, string> = {
    combat: "Combat Mission",
    special: "Special Mission",
    fleet: "Fleet Mission"
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>Create New Instruction</h2>
          <button className="modal-close" onClick={closeModal}>×</button>
        </div>

        {/* Pre-filled location indicator */}
        {hasPrefilledLocation && (
          <div className="modal-location-banner">
            📍 Phase {phase} → {PLANETS[planet]?.name} → {typeLabels[missionType]} #{missionNumber}
          </div>
        )}

        {loading ? (
          <div className="modal-body text-center">
            <p>Loading units...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="modal-body">
            {/* Title */}
            <div className="form-group mb-lg">
              <label className="form-label">Title</label>
              <input
                type="text"
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., SLKR Counter Team"
                required
                autoFocus
              />
            </div>

            {/* Location selectors (hidden if pre-filled) */}
            {!hasPrefilledLocation && (
              <>
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

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
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
              </>
            )}

            {/* Squad Builder (for ground missions) */}
            {missionType !== "fleet" && (
              <div className="form-section">
                <h4 className="mb-md">Squad Builder</h4>
                <p className="text-secondary mb-md" style={{ fontSize: "0.85rem" }}>Select up to 5 characters</p>
                
                <div className="unit-selector-grid">
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
              </div>
            )}

            {/* Fleet Builder (for fleet missions) */}
            {missionType === "fleet" && (
              <div className="form-section">
                <h4 className="mb-md">Fleet Builder</h4>
                
                <p className="text-muted mb-sm" style={{ fontSize: "0.8rem" }}>Capital Ship</p>
                <div className="unit-selector-grid mb-md">
                  <UnitSelector
                    label="Capital Ship"
                    value={capitalShipId}
                    onChange={setCapitalShipId}
                    units={filteredShips}
                    isLeader
                  />
                </div>

                <p className="text-muted mb-sm" style={{ fontSize: "0.8rem" }}>Starting Ships</p>
                <div className="unit-selector-grid mb-md">
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

                <p className="text-muted mb-sm" style={{ fontSize: "0.8rem" }}>Reinforcements</p>
                <div className="unit-selector-grid">
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

            {/* Play Mode Toggle */}
            <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
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

            {/* Instructions Content */}
            <div className="form-group">
              <label className="form-label">Instructions (HTML supported)</label>
              <textarea
                className="form-textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="<p>Start by using Kylo's AOE...</p>"
                style={{ minHeight: "120px", fontFamily: "monospace" }}
              />
            </div>

            {/* Video URLs */}
            <div className="form-section">
              <h4 className="mb-md">Video Guides</h4>
              
              {videoUrls.map((url, idx) => (
                <div key={idx} className="flex gap-md mb-sm" style={{ alignItems: "flex-end" }}>
                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
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
                      style={{ padding: "0.5rem" }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              
              <button type="button" className="btn btn-secondary" onClick={addVideoUrl} style={{ fontSize: "0.85rem" }}>
                + Add Video
              </button>
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={closeModal}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Save Instruction"}
              </button>
            </div>
          </form>
        )}
      </div>
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
    <div className="form-group" style={{ position: "relative", marginBottom: 0 }}>
      <label className="form-label" style={{ color: isLeader ? "var(--color-accent-gold)" : undefined, fontSize: "0.8rem" }}>
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
          placeholder="Search..."
          style={{ fontSize: "0.85rem" }}
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
            maxHeight: "150px",
            overflow: "auto",
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            zIndex: 1000
          }}
        >
          {filteredUnits.slice(0, 30).map(unit => (
            <div
              key={unit.id}
              onClick={() => {
                onChange(unit.id);
                setSearch("");
                setIsOpen(false);
              }}
              style={{
                padding: "0.4rem 0.75rem",
                cursor: "pointer",
                borderBottom: "1px solid var(--color-border)",
                fontSize: "0.85rem"
              }}
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
