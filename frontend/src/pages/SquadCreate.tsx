import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Plus,
  X,
  Search,
  Users,
  Eye,
  EyeOff
} from 'lucide-react';
import { useSquadStore } from '../store/squadStore';
import { useAuthStore } from '../store/authStore';
import { LoadingOverlay } from '../components/common/LoadingSpinner';
import { UnitSelector } from '../components/squads/UnitSelector';
import { SquadUnitEditor } from '../components/squads/SquadUnitEditor';
import { CreateSquadData, SquadType, SquadUnit, Unit } from '../types';

export const SquadCreate: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    currentSquad,
    isLoading,
    error,
    loadSquad,
    createSquad,
    updateSquad,
    publishSquad
  } = useSquadStore();

  const isEditing = Boolean(id);
  const [showUnitSelector, setShowUnitSelector] = React.useState(false);
  const [editingUnitIndex, setEditingUnitIndex] = React.useState<number | null>(null);

  const [formData, setFormData] = React.useState<CreateSquadData>({
    name: '',
    description: '',
    squadType: 'MIXED' as SquadType,
    strategyNotes: '',
    strategyVideoUrl: '',
    units: []
  });

  React.useEffect(() => {
    if (isEditing && id) {
      loadSquad(parseInt(id));
    }
  }, [isEditing, id, loadSquad]);

  React.useEffect(() => {
    if (isEditing && currentSquad) {
      setFormData({
        name: currentSquad.name,
        description: currentSquad.description || '',
        squadType: currentSquad.squadType,
        strategyNotes: currentSquad.strategyNotes || '',
        strategyVideoUrl: currentSquad.strategyVideoUrl || '',
        units: currentSquad.units || []
      });
    }
  }, [isEditing, currentSquad]);

  const canCreate = user && (
    user.role === 'CONTRIBUTOR' ||
    user.role === 'ADMIN' ||
    user.role === 'SUPER_ADMIN'
  );

  const canEdit = isEditing && user && currentSquad && (
    currentSquad.createdBy === user.id ||
    user.role === 'ADMIN' ||
    user.role === 'SUPER_ADMIN'
  );

  if (!user || (!canCreate && !isEditing) || (isEditing && !canEdit)) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Access Denied</h2>
          <p className="text-neutral-400 mb-6">
            You don't have permission to {isEditing ? 'edit this squad' : 'create squads'}.
          </p>
          <Link to="/squads" className="btn-primary">
            Back to Squads
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading && isEditing) {
    return <LoadingOverlay>Loading squad for editing...</LoadingOverlay>;
  }

  const handleInputChange = (field: keyof CreateSquadData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddUnit = (unit: Unit) => {
    const squadUnit: SquadUnit = {
      name: unit.name,
      position: 'damage',
      requiredStars: 7,
      requiredGearLevel: 13,
      requiredRelicLevel: 5,
      requiredZetas: 0,
      requiredOmicrons: 0,
      notes: '',
      alternativeUnits: []
    };

    setFormData(prev => ({
      ...prev,
      units: [...(prev.units || []), squadUnit]
    }));
    setShowUnitSelector(false);
  };

  const handleEditUnit = (index: number, unit: SquadUnit) => {
    const updatedUnits = [...(formData.units || [])];
    updatedUnits[index] = unit;
    setFormData(prev => ({
      ...prev,
      units: updatedUnits
    }));
    setEditingUnitIndex(null);
  };

  const handleRemoveUnit = (index: number) => {
    const updatedUnits = [...(formData.units || [])];
    updatedUnits.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      units: updatedUnits
    }));
  };

  const handleSubmit = async (e: React.FormEvent, publish = false) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      return;
    }

    try {
      let squad;
      if (isEditing && currentSquad) {
        squad = await updateSquad(currentSquad.id, formData);
      } else {
        squad = await createSquad(formData);
      }

      if (publish && !squad.isPublished) {
        await publishSquad(squad.id);
      }

      navigate(`/squads/${squad.id}`);
    } catch (error) {
      console.error('Failed to save squad:', error);
    }
  };

  const squadTypes: { value: SquadType; label: string }[] = [
    { value: 'GALACTIC_REPUBLIC', label: 'Galactic Republic' },
    { value: 'SEPARATISTS', label: 'Separatists' },
    { value: 'REBEL_ALLIANCE', label: 'Rebel Alliance' },
    { value: 'EMPIRE', label: 'Empire' },
    { value: 'FIRST_ORDER', label: 'First Order' },
    { value: 'RESISTANCE', label: 'Resistance' },
    { value: 'JEDI', label: 'Jedi' },
    { value: 'SITH', label: 'Sith' },
    { value: 'SCOUNDRELS', label: 'Scoundrels' },
    { value: 'BOUNTY_HUNTERS', label: 'Bounty Hunters' },
    { value: 'MANDALORIANS', label: 'Mandalorians' },
    { value: 'NIGHTSISTERS', label: 'Nightsisters' },
    { value: 'PHOENIX', label: 'Phoenix Squadron' },
    { value: 'ROGUE_ONE', label: 'Rogue One' },
    { value: 'CLONE_TROOPERS', label: 'Clone Troopers' },
    { value: 'IMPERIAL_TROOPERS', label: 'Imperial Troopers' },
    { value: 'EWOKS', label: 'Ewoks' },
    { value: 'TUSKEN_RAIDERS', label: 'Tusken Raiders' },
    { value: 'GEONOSIANS', label: 'Geonosians' },
    { value: 'DROIDS', label: 'Droids' },
    { value: 'JAWAS', label: 'Jawas' },
    { value: 'MIXED', label: 'Mixed Factions' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link
            to={isEditing ? `/squads/${id}` : '/squads'}
            className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">
              {isEditing ? 'Edit Squad' : 'Create New Squad'}
            </h1>
            <p className="text-neutral-300">
              {isEditing ? 'Update your squad composition and strategy' : 'Build a new squad recommendation for Territory Battles'}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-8">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-white">Basic Information</h2>
              </div>
              <div className="card-content space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Squad Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Imperial Troopers Phase 4"
                    className="input w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Squad Type *
                  </label>
                  <select
                    value={formData.squadType}
                    onChange={(e) => handleInputChange('squadType', e.target.value as SquadType)}
                    className="input w-full"
                    required
                  >
                    {squadTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Brief description of the squad and its strengths..."
                    rows={3}
                    className="input w-full"
                  />
                </div>
              </div>
            </div>

            {/* Squad Composition */}
            <div className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">Squad Composition</h2>
                  <button
                    type="button"
                    onClick={() => setShowUnitSelector(true)}
                    disabled={formData.units.length >= 5}
                    className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus size={16} />
                    <span>Add Unit</span>
                  </button>
                </div>
                <p className="text-sm text-neutral-400 mt-1">
                  {formData.units.length}/5 units configured
                </p>
              </div>
              <div className="card-content">
                {formData.units && formData.units.length > 0 ? (
                  <div className="space-y-4">
                    {formData.units.map((unit, index) => (
                      <div key={index} className="border border-neutral-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-medium text-white">{unit.name}</h3>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => setEditingUnitIndex(index)}
                              className="text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveUnit(index)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-neutral-400">
                          <span>Position: {unit.position}</span>
                          <span>Relic: R{unit.requiredRelicLevel}</span>
                          <span>Stars: {unit.requiredStars}★</span>
                          <span>Gear: G{unit.requiredGearLevel}</span>
                        </div>
                        {unit.notes && (
                          <p className="text-sm text-neutral-300 mt-2">{unit.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-neutral-600 mx-auto mb-4" />
                    <p className="text-neutral-400 mb-4">No units added yet</p>
                    <button
                      type="button"
                      onClick={() => setShowUnitSelector(true)}
                      className="btn-primary"
                    >
                      Add First Unit
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Strategy */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-white">Strategy & Notes</h2>
              </div>
              <div className="card-content space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Strategy Notes
                  </label>
                  <textarea
                    value={formData.strategyNotes}
                    onChange={(e) => handleInputChange('strategyNotes', e.target.value)}
                    placeholder="Detailed strategy notes, turn order, key abilities to use..."
                    rows={6}
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Strategy Video URL
                  </label>
                  <input
                    type="url"
                    value={formData.strategyVideoUrl}
                    onChange={(e) => handleInputChange('strategyVideoUrl', e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="input w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-white">Actions</h3>
              </div>
              <div className="card-content space-y-3">
                <button
                  type="submit"
                  disabled={isLoading || !formData.name.trim()}
                  className="w-full btn-primary flex items-center justify-center space-x-2"
                >
                  <Save size={16} />
                  <span>{isEditing ? 'Save Changes' : 'Save Draft'}</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, true)}
                  disabled={isLoading || !formData.name.trim() || formData.units.length === 0}
                  className="w-full btn-secondary flex items-center justify-center space-x-2"
                >
                  <Eye size={16} />
                  <span>{isEditing ? 'Save & Publish' : 'Create & Publish'}</span>
                </button>
              </div>
            </div>

            {/* Status */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-white">Status</h3>
              </div>
              <div className="card-content">
                <div className="flex items-center space-x-2">
                  {isEditing && currentSquad?.isPublished ? (
                    <>
                      <Eye className="h-4 w-4 text-green-400" />
                      <span className="text-green-400">Published</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-4 w-4 text-neutral-500" />
                      <span className="text-neutral-500">Draft</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Unit Selector Modal */}
      {showUnitSelector && (
        <UnitSelector
          onSelect={handleAddUnit}
          onClose={() => setShowUnitSelector(false)}
          excludeUnits={formData.units.map(u => u.name)}
        />
      )}

      {/* Unit Editor Modal */}
      {editingUnitIndex !== null && formData.units[editingUnitIndex] && (
        <SquadUnitEditor
          unit={formData.units[editingUnitIndex]}
          onSave={(unit) => handleEditUnit(editingUnitIndex, unit)}
          onClose={() => setEditingUnitIndex(null)}
        />
      )}
    </div>
  );
};