"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import DOMPurify from "dompurify";
import { PLANETS, PHASES, getPhaseForPlanet } from "@/lib/roteData";

// Mapping from planet IDs to image filenames
const PLANET_IMAGES: Record<string, string> = {
  mustafar: "mustafar.png",
  corellia: "corellia.png",
  coruscant: "coruscant.png",
  geonosis: "geonosis.png",
  felucia: "felucia.png",
  bracca: "bracca.png",
  dathomir: "dathomir.png",
  tatooine: "tatooine.png",
  kashyyyk: "kashyyyk.png",
  zeffo: "zeffo.png",
  medstation: "medstation.png",
  kessel: "kessel.png",
  lothal: "lothal.png",
  mandalore: "mandalore.png",
  malachor: "malachor.png",
  vandor: "vandor.png",
  kafrene: "kafrene.png",
  deathstar: "deathstar.png",
  hoth: "hoth.png",
  scarif: "scarif.png",
};

interface Instruction {
  id: string;
  title: string;
  missionNumber: number;
  missionType: string;
  isAutoPlay: boolean;
  content: string;
  squadLeaderId?: string;
  squadMember1Id?: string;
  squadMember2Id?: string;
  squadMember3Id?: string;
  squadMember4Id?: string;
  capitalShipId?: string;
  starting1Id?: string;
  starting2Id?: string;
  starting3Id?: string;
  reinforcement1Id?: string;
  reinforcement2Id?: string;
  reinforcement3Id?: string;
  reinforcement4Id?: string;
  videos: { id: string; url: string; title?: string }[];
}

export default function PlanetPage() {
  const { data: session } = useSession();
  const params = useParams();
  const phaseNum = parseInt(params.phase as string);
  const planetId = params.planet as string;
  const planet = PLANETS[planetId];
  const phase = PHASES.find(p => p.number === phaseNum);
  
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [unitNames, setUnitNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [openMission, setOpenMission] = useState<string | null>(null);
  const accordionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Handler for accordion toggle
  const handleAccordionClick = (missionKey: string) => {
    setOpenMission(openMission === missionKey ? null : missionKey);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch instructions and units in parallel
        const [instructionsRes, unitsRes] = await Promise.all([
          fetch(`/api/instructions?phase=${phaseNum}&planet=${planetId}`),
          fetch("/api/units")
        ]);
        
        if (instructionsRes.ok) {
          const data = await instructionsRes.json();
          setInstructions(data);
        }
        
        if (unitsRes.ok) {
          const unitsData = await unitsRes.json();
          // Create lookup map of id -> name
          const names: Record<string, string> = {};
          [...unitsData.characters, ...unitsData.ships].forEach((u: { id: string; name: string }) => {
            names[u.id] = u.name;
          });
          setUnitNames(names);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [phaseNum, planetId]);

  if (!planet) {
    return (
      <div className="container" style={{ padding: "4rem 0", textAlign: "center" }}>
        <h1>Planet Not Found</h1>
        <p className="text-secondary">The planet "{planetId}" does not exist.</p>
        <Link href="/" className="btn btn-primary mt-lg">Back to Home</Link>
      </div>
    );
  }

  // Get planet image filename
  const planetImage = PLANET_IMAGES[planetId];

  // Calculate mission counts for badges by icon type
  const combatCount = planet.missions.filter(m => m.type === "combat").length;
  const fleetCount = planet.missions.filter(m => m.type === "fleet").length;
  const thirdSisterCount = planet.missions.filter(m => m.iconType === "third-sister").length;
  const special1Count = planet.missions.filter(m => m.iconType === "special-1").length;
  const special2Count = planet.missions.filter(m => m.iconType === "special-2").length;

  // Helper to create badge with icon
  const MissionBadge = ({ icon, count, label }: { icon: string; count: number; label: string }) => (
    <span className="planet-card-badge" style={{ 
      display: "inline-flex", 
      alignItems: "center", 
      gap: "0.4rem",
      padding: "0.4rem 0.75rem"
    }}>
      <img 
        src={`/missions/${icon}`} 
        alt={label}
        style={{ width: "20px", height: "20px", objectFit: "contain" }}
      />
      <span>{count} {label}</span>
    </span>
  );

  return (
    <>
      {/* Navigation */}
      <nav className="navbar">
        <Link href="/" className="navbar-brand">
          <span>⚔️</span>
          <span>RotE TB Recommender</span>
        </Link>
        <ul className="navbar-nav">
          <li><Link href={session ? "/admin" : "/login"} className="navbar-link">Admin</Link></li>
        </ul>
      </nav>

      {/* Planet Header */}
      <header 
        className="page-header"
        style={{
          background: `linear-gradient(180deg, var(--color-bg-secondary) 0%, var(--color-bg-primary) 100%)`,
          minHeight: "200px"
        }}
      >
        <div className="container">
          {/* Breadcrumb */}
          <div style={{ marginBottom: "1rem" }}>
            <Link href="/" className="text-secondary" style={{ fontSize: "0.9rem" }}>
              ← Back to Phase {phaseNum}
            </Link>
          </div>
          <h1>{planet.name}</h1>
          <p>{planet.description}</p>
          <div className="flex-center gap-md mt-md" style={{ flexWrap: "wrap" }}>
            <span className="badge badge-auto">Phase {phaseNum}</span>
            {fleetCount > 0 && (
              <MissionBadge icon="fleet-mission.png" count={fleetCount} label="Fleet" />
            )}
            {combatCount > 0 && (
              <MissionBadge icon="combat-mission.png" count={combatCount} label="Combat" />
            )}
            {special1Count > 0 && (
              <MissionBadge icon="special-mission-1.png" count={special1Count} label="Special" />
            )}
            {special2Count > 0 && (
              <MissionBadge icon="special-mission-2.png" count={special2Count} label="Special" />
            )}
            {thirdSisterCount > 0 && (
              <MissionBadge icon="third-sister-mission.png" count={thirdSisterCount} label="Third Sister" />
            )}
          </div>
        </div>
      </header>

      {/* Planet Image */}
      <div className="container" style={{ marginTop: "1rem", marginBottom: "2rem" }}>
        {planetImage && (
          <div 
            style={{
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
              border: "2px solid var(--color-border)",
              boxShadow: "var(--shadow-lg)",
              backgroundColor: "var(--color-bg-card)"
            }}
          >
            <img 
              src={`/planets/${planetImage}`}
              alt={planet.name}
              style={{
                width: "100%",
                height: "auto",
                display: "block",
                objectFit: "contain"
              }}
            />
          </div>
        )}
      </div>

      <main className="container" style={{ paddingBottom: "4rem" }}>
        {loading ? (
          <div className="text-center text-secondary" style={{ padding: "4rem 0" }}>
            <p>Loading missions...</p>
          </div>
        ) : (
          <div>
            {planet.missions.map((mission) => {
              // Get ALL instructions for this mission (not just one)
              const missionInstructions = instructions.filter(
                i => i.missionNumber === mission.number && i.missionType === mission.type
              );
              const missionKey = `${mission.type}-${mission.number}`;
              const isOpen = openMission === missionKey;
              
              return (
                <div
                  key={missionKey}
                  ref={(el) => { accordionRefs.current[missionKey] = el; }}
                >
                  <MissionAccordion
                    missionNumber={mission.number}
                    missionType={mission.type}
                    missionLabel={mission.label}
                    iconType={mission.iconType}
                    instructions={missionInstructions}
                    unitNames={unitNames}
                    isOpen={isOpen}
                    onToggle={() => handleAccordionClick(missionKey)}
                  />
                </div>
              );
            })}
          </div>
        )}

        {!loading && planet.missions.length === 0 && (
          <div className="text-center text-secondary" style={{ padding: "4rem 0" }}>
            <p>No missions configured for this planet.</p>
          </div>
        )}
      </main>
    </>
  );
}

function MissionAccordion({ 
  missionNumber, 
  missionType,
  missionLabel,
  iconType,
  instructions, 
  unitNames,
  isOpen, 
  onToggle 
}: { 
  missionNumber: number;
  missionType: string;
  missionLabel?: string;
  iconType?: "third-sister" | "special-1" | "special-2";
  instructions: Instruction[];
  unitNames: Record<string, string>;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const typeLabels: Record<string, string> = {
    combat: "Combat Mission",
    special: "Special Mission",
    fleet: "Fleet Mission"
  };

  // Group instructions by auto/manual
  const manualInstructions = instructions.filter(i => !i.isAutoPlay);
  const autoInstructions = instructions.filter(i => i.isAutoPlay);
  const hasAnyInstructions = instructions.length > 0;

  // Use custom label if provided, otherwise generate default
  const displayTitle = missionLabel || `${typeLabels[missionType]} ${missionNumber}`;

  // Get icon filename based on mission type
  const getIconFilename = (): string => {
    if (missionType === "fleet") return "fleet-mission.png";
    if (missionType === "combat") return "combat-mission.png";
    // Special missions have variants
    if (iconType === "third-sister") return "third-sister-mission.png";
    if (iconType === "special-1") return "special-mission-1.png";
    if (iconType === "special-2") return "special-mission-2.png";
    // Fallback for special without iconType
    return "special-mission-1.png";
  };

  return (
    <div className={`mission-accordion ${isOpen ? "open" : ""}`}>
      {/* Header - Always shows mission name */}
      <div className="mission-header" onClick={onToggle}>
        <div className="mission-header-left">
          <img 
            src={`/missions/${getIconFilename()}`}
            alt={displayTitle}
            style={{ 
              width: "36px", 
              height: "36px", 
              objectFit: "contain",
              marginRight: "0.75rem"
            }}
          />
          <div className="mission-number">{missionNumber}</div>
          <div>
            <div className="mission-title">
              {displayTitle}
            </div>
            {!hasAnyInstructions && (
              <span className="text-muted text-sm">No recommendations yet</span>
            )}
            {hasAnyInstructions && (
              <span className="text-muted text-sm">
                {instructions.length} squad{instructions.length > 1 ? "s" : ""} recommended
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-sm" style={{ alignItems: "center" }}>
          <div className="mission-badges">
            {missionType === "fleet" && (
              <span className="badge badge-fleet">Fleet</span>
            )}
            {missionType === "special" && (
              <span className="badge badge-special">Special</span>
            )}
            {manualInstructions.length > 0 && (
              <span className="badge badge-manual">{manualInstructions.length} Manual</span>
            )}
            {autoInstructions.length > 0 && (
              <span className="badge badge-auto">{autoInstructions.length} Auto</span>
            )}
          </div>
          <span className="mission-chevron">▼</span>
        </div>
      </div>
      
      {/* Content */}
      <div className="mission-content">
        {hasAnyInstructions ? (
          <>
            {/* Manual Battles Section (shown first) */}
            {manualInstructions.length > 0 && (
              <div className="instruction-section">
                <h3 className="section-heading" style={{ 
                  color: "var(--color-accent-gold)", 
                  marginBottom: "1rem",
                  fontSize: "1.1rem",
                  fontWeight: "600"
                }}>
                  ⚔️ Manual Battles
                </h3>
                <div className="instruction-cards">
                  {manualInstructions.map(instruction => (
                    <InstructionCard 
                      key={instruction.id} 
                      instruction={instruction} 
                      missionType={missionType}
                      unitNames={unitNames}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Auto Battles Section */}
            {autoInstructions.length > 0 && (
              <div className="instruction-section" style={{ marginTop: manualInstructions.length > 0 ? "2rem" : 0 }}>
                <h3 className="section-heading" style={{ 
                  color: "var(--color-accent-green)", 
                  marginBottom: "1rem",
                  fontSize: "1.1rem",
                  fontWeight: "600"
                }}>
                  🤖 Auto Battles
                </h3>
                <div className="instruction-cards">
                  {autoInstructions.map(instruction => (
                    <InstructionCard 
                      key={instruction.id} 
                      instruction={instruction} 
                      missionType={missionType}
                      unitNames={unitNames}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-secondary" style={{ padding: "2rem" }}>
            <p>No squad recommendations have been added for this mission yet.</p>
            <p className="text-muted">Check back later or contact your guild officers.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Individual instruction card component
function InstructionCard({ 
  instruction, 
  missionType,
  unitNames
}: { 
  instruction: Instruction;
  missionType: string;
  unitNames: Record<string, string>;
}) {
  return (
    <div 
      className="instruction-card"
      style={{
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        padding: "1.25rem",
        marginBottom: "1rem",
        backgroundColor: "rgba(255, 255, 255, 0.02)",
      }}
    >
      {/* Instruction Title */}
      <h4 style={{ 
        marginBottom: "1rem", 
        color: "var(--color-text-primary)",
        fontSize: "1.1rem",
        fontWeight: "600"
      }}>
        {instruction.title}
      </h4>

      {/* Squad/Fleet Display */}
      {missionType !== "fleet" && instruction.squadLeaderId && (
        <SquadDisplay instruction={instruction} unitNames={unitNames} />
      )}
      {missionType === "fleet" && instruction.capitalShipId && (
        <FleetDisplay instruction={instruction} unitNames={unitNames} />
      )}
      
      {/* Instructions Content */}
      {instruction.content && (
        <div 
          className="instructions-content"
          style={{ marginTop: "1rem" }}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(instruction.content) }}
        />
      )}
      
      {/* Videos - 2 column grid on larger screens */}
      {instruction.videos && instruction.videos.length > 0 && (
        <div className="video-container" style={{ marginTop: "1.5rem" }}>
          <h5 className="mb-md" style={{ color: "var(--color-text-secondary)" }}>Video Guides</h5>
          <div 
            className="video-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1rem",
            }}
          >
            {instruction.videos.map((video) => (
              <VideoEmbed key={video.id} url={video.url} title={video.title} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SquadDisplay({ instruction, unitNames }: { instruction: Instruction; unitNames: Record<string, string> }) {
  const members = [
    { id: instruction.squadLeaderId, isLeader: true },
    { id: instruction.squadMember1Id, isLeader: false },
    { id: instruction.squadMember2Id, isLeader: false },
    { id: instruction.squadMember3Id, isLeader: false },
    { id: instruction.squadMember4Id, isLeader: false },
  ].filter(m => m.id);

  // Get proper unit name from lookup, fallback to ID
  const getUnitName = (id: string): string => {
    if (id === "ANY_UNIT") return "+1";
    return unitNames[id] || id;
  };

  return (
    <div className="portrait-row" style={{ flexWrap: "wrap", gap: "1rem" }}>
      {members.map((member, idx) => (
        <div 
          key={idx} 
          className={`portrait-with-label ${member.isLeader ? "leader" : ""}`}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.5rem"
          }}
        >
          <div 
            className={`portrait ${member.isLeader ? "leader" : ""}`}
            title={member.id === "ANY_UNIT" ? "Any Unit" : getUnitName(member.id || "")}
          >
            {member.id === "ANY_UNIT" ? (
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
                src={`/characters/${member.id}.png`} 
                alt={getUnitName(member.id || "")}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/fallback/character-portrait.svg";
                }}
              />
            )}
          </div>
          <span style={{
            fontSize: "0.7rem",
            color: member.isLeader ? "var(--color-accent-gold)" : "var(--color-text-muted)",
            textAlign: "center",
            maxWidth: "70px",
            lineHeight: "1.2",
            wordBreak: "break-word"
          }}>
            {member.isLeader && "👑 "}
            {getUnitName(member.id || "")}
          </span>
        </div>
      ))}
    </div>
  );
}

function FleetDisplay({ instruction, unitNames }: { instruction: Instruction; unitNames: Record<string, string> }) {
  const capital = instruction.capitalShipId;
  const starting = [
    instruction.starting1Id,
    instruction.starting2Id,
    instruction.starting3Id,
  ].filter(Boolean);
  const reinforcements = [
    instruction.reinforcement1Id,
    instruction.reinforcement2Id,
    instruction.reinforcement3Id,
    instruction.reinforcement4Id,
  ].filter(Boolean);

  // Get proper ship name from lookup, fallback to ID
  const getShipName = (id: string | undefined): string => {
    if (!id) return "";
    return unitNames[id] || id;
  };

  return (
    <div>
      {/* Capital Ship */}
      <div className="portrait-row">
        <div 
          className="portrait-with-label"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.5rem"
          }}
        >
          <div className="portrait ship capital" title={getShipName(capital)}>
            <img 
              src={`/ships/${capital}.png`} 
              alt={getShipName(capital)}
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/fallback/ship-portrait.svg";
              }}
            />
          </div>
          <span style={{
            fontSize: "0.7rem",
            color: "var(--color-accent-gold)",
            textAlign: "center",
            maxWidth: "70px",
            lineHeight: "1.2",
            wordBreak: "break-word"
          }}>
            {getShipName(capital)}
          </span>
        </div>
      </div>
      
      {/* Starting Ships */}
      <div className="portrait-row" style={{ flexWrap: "wrap", gap: "1rem", alignItems: "flex-start" }}>
        {starting.map((shipId, idx) => (
          <div 
            key={idx} 
            className="portrait-with-label"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.5rem"
            }}
          >
            <div className="portrait ship" title={getShipName(shipId)}>
              <img 
                src={`/ships/${shipId}.png`} 
                alt={getShipName(shipId)}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/fallback/ship-portrait.svg";
                }}
              />
            </div>
            <span style={{
              fontSize: "0.7rem",
              color: "var(--color-text-muted)",
              textAlign: "center",
              maxWidth: "70px",
              lineHeight: "1.2",
              wordBreak: "break-word"
            }}>
              {getShipName(shipId)}
            </span>
          </div>
        ))}
      </div>
      
      {/* Reinforcements */}
      {reinforcements.length > 0 && (
        <>
          <div className="text-center text-muted text-sm mb-sm">Reinforcements</div>
          <div className="portrait-row" style={{ flexWrap: "wrap", gap: "1rem", alignItems: "flex-start" }}>
            {reinforcements.map((shipId, idx) => (
              <div 
                key={idx} 
                className="portrait-with-label"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.5rem"
                }}
              >
                <div className="portrait ship reinforcement" title={getShipName(shipId)}>
                  <img 
                    src={`/ships/${shipId}.png`} 
                    alt={getShipName(shipId)}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/fallback/ship-portrait.svg";
                    }}
                  />
                </div>
                <span style={{
                  fontSize: "0.7rem",
                  color: "var(--color-text-muted)",
                  textAlign: "center",
                  maxWidth: "70px",
                  lineHeight: "1.2",
                  wordBreak: "break-word"
                }}>
                  {getShipName(shipId)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function VideoEmbed({ url, title }: { url: string; title?: string }) {
  // Convert YouTube URLs to embed format
  const getEmbedUrl = (url: string) => {
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
    return url;
  };

  return (
    <div className="video-embed">
      <iframe
        src={getEmbedUrl(url)}
        title={title || "Video Guide"}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
