import React from 'react';
import { SquadBuilder } from '../components/squads/SquadBuilder';

export const SquadTest: React.FC = () => {
  const handleSquadChange = (squad: any[]) => {
    console.log('Squad changed:', squad);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Squad Builder Test
          </h1>
          <p className="text-gray-600">
            Test the squad builder with real SWGoH character data
          </p>
        </div>

        <SquadBuilder
          onSquadChange={handleSquadChange}
          className="mb-8"
        />

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Instructions
          </h2>
          <ul className="space-y-2 text-gray-600">
            <li>• Click any empty slot to open the character picker</li>
            <li>• The first character you select becomes the leader (leftmost slot)</li>
            <li>• Use the search and filters to find specific characters</li>
            <li>• Characters already in your squad are automatically excluded from the picker</li>
            <li>• Hover over characters in your squad to see the remove button</li>
            <li>• Squad shows alignment based on your selected characters</li>
          </ul>
        </div>
      </div>
    </div>
  );
};