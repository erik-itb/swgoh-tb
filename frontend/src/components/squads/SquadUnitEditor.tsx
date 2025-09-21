import React from 'react';
import { Save, X, Plus, Trash2 } from 'lucide-react';
import { SquadUnit } from '../../types';

interface SquadUnitEditorProps {
  unit: SquadUnit;
  onSave: (unit: SquadUnit) => void;
  onClose: () => void;
}

export const SquadUnitEditor: React.FC<SquadUnitEditorProps> = ({
  unit,
  onSave,
  onClose
}) => {
  const [formData, setFormData] = React.useState<SquadUnit>({ ...unit });
  const [newAlternative, setNewAlternative] = React.useState('');

  const positions = [
    { value: 'leader', label: 'Leader' },
    { value: 'tank', label: 'Tank' },
    { value: 'damage', label: 'Damage Dealer' },
    { value: 'support', label: 'Support' },
    { value: 'healer', label: 'Healer' }
  ];

  const handleInputChange = (field: keyof SquadUnit, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddAlternative = () => {
    if (newAlternative.trim()) {
      const alternatives = formData.alternativeUnits || [];
      setFormData(prev => ({
        ...prev,
        alternativeUnits: [...alternatives, newAlternative.trim()]
      }));
      setNewAlternative('');
    }
  };

  const handleRemoveAlternative = (index: number) => {
    const alternatives = [...(formData.alternativeUnits || [])];
    alternatives.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      alternativeUnits: alternatives
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-700 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-700">
          <h2 className="text-xl font-semibold text-white">Edit Unit: {unit.name}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-700 rounded transition-colors"
          >
            <X size={20} className="text-neutral-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Position */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Position/Role
            </label>
            <select
              value={formData.position}
              onChange={(e) => handleInputChange('position', e.target.value)}
              className="input w-full"
            >
              {positions.map((pos) => (
                <option key={pos.value} value={pos.value}>
                  {pos.label}
                </option>
              ))}
            </select>
          </div>

          {/* Requirements Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Required Stars
              </label>
              <input
                type="number"
                min="1"
                max="7"
                value={formData.requiredStars}
                onChange={(e) => handleInputChange('requiredStars', parseInt(e.target.value))}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Gear Level
              </label>
              <input
                type="number"
                min="1"
                max="13"
                value={formData.requiredGearLevel}
                onChange={(e) => handleInputChange('requiredGearLevel', parseInt(e.target.value))}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Relic Level
              </label>
              <input
                type="number"
                min="0"
                max="9"
                value={formData.requiredRelicLevel}
                onChange={(e) => handleInputChange('requiredRelicLevel', parseInt(e.target.value))}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Required Zetas
              </label>
              <input
                type="number"
                min="0"
                max="5"
                value={formData.requiredZetas}
                onChange={(e) => handleInputChange('requiredZetas', parseInt(e.target.value))}
                className="input w-full"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Required Omicrons
              </label>
              <input
                type="number"
                min="0"
                max="3"
                value={formData.requiredOmicrons}
                onChange={(e) => handleInputChange('requiredOmicrons', parseInt(e.target.value))}
                className="input w-full"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Strategy Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Special requirements, key abilities, turn order notes..."
              rows={3}
              className="input w-full"
            />
          </div>

          {/* Alternative Units */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Alternative Units
            </label>
            <div className="space-y-2 mb-3">
              {formData.alternativeUnits?.map((alternative, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="flex-1 text-sm bg-neutral-800 px-3 py-2 rounded text-neutral-300">
                    {alternative}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAlternative(index)}
                    className="p-2 text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newAlternative}
                onChange={(e) => setNewAlternative(e.target.value)}
                placeholder="Alternative unit name..."
                className="input flex-1"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddAlternative();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddAlternative}
                disabled={!newAlternative.trim()}
                className="btn-secondary flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={16} />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-700">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center space-x-2"
            >
              <Save size={16} />
              <span>Save Unit</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};