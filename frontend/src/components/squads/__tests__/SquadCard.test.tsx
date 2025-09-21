import { describe, test, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { render, mockUsers } from '../../../test/utils';
import { SquadCard } from '../SquadCard';

const mockSquad = {
  id: 1,
  name: '501st Clone Troopers',
  description: 'Elite clone trooper squad led by Rex',
  squadType: 'CLONE_TROOPERS' as const,
  isPublished: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  createdBy: mockUsers.contributor,
  createdById: mockUsers.contributor.id,
  units: [
    {
      id: 1,
      squadId: 1,
      name: 'Clone Commander Rex',
      position: 'leader',
      requiredRelicLevel: 7,
      requiredStars: 7,
      requiredGearLevel: 13,
      modRecommendation: 'Speed/Health sets',
      zetaRecommendations: ['Leader ability', 'Unique ability'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 2,
      squadId: 1,
      name: 'ARC Trooper Echo',
      position: 'tank',
      requiredRelicLevel: 5,
      requiredStars: 7,
      requiredGearLevel: 13,
      modRecommendation: null,
      zetaRecommendations: [],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    }
  ]
};

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

describe('SquadCard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders squad information correctly', () => {
    render(<SquadCard squad={mockSquad} />);

    expect(screen.getByText('501st Clone Troopers')).toBeInTheDocument();
    expect(screen.getByText('Elite clone trooper squad led by Rex')).toBeInTheDocument();
    expect(screen.getByText('CLONE TROOPERS')).toBeInTheDocument();
    expect(screen.getByText('2 units')).toBeInTheDocument();
    expect(screen.getByText(mockUsers.contributor.username)).toBeInTheDocument();
  });

  test('shows published status correctly', () => {
    render(<SquadCard squad={mockSquad} />);

    expect(screen.getByText('Published')).toBeInTheDocument();
    expect(screen.queryByText('Draft')).not.toBeInTheDocument();
  });

  test('shows draft status for unpublished squads', () => {
    const draftSquad = { ...mockSquad, isPublished: false };
    render(<SquadCard squad={draftSquad} />);

    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.queryByText('Published')).not.toBeInTheDocument();
  });

  test('navigates to squad detail on click', () => {
    render(<SquadCard squad={mockSquad} />);

    const card = screen.getByRole('article');
    fireEvent.click(card);

    expect(mockNavigate).toHaveBeenCalledWith('/squads/1');
  });

  test('shows edit button for squad owner', () => {
    render(<SquadCard squad={mockSquad} />, {
      user: mockUsers.contributor,
      isAuthenticated: true
    });

    expect(screen.getByLabelText('Edit squad')).toBeInTheDocument();
  });

  test('shows edit button for admin users', () => {
    render(<SquadCard squad={mockSquad} />, {
      user: mockUsers.admin,
      isAuthenticated: true
    });

    expect(screen.getByLabelText('Edit squad')).toBeInTheDocument();
  });

  test('hides edit button for non-owners', () => {
    render(<SquadCard squad={mockSquad} />, {
      user: mockUsers.viewer,
      isAuthenticated: true
    });

    expect(screen.queryByLabelText('Edit squad')).not.toBeInTheDocument();
  });

  test('handles missing units gracefully', () => {
    const squadWithoutUnits = { ...mockSquad, units: [] };
    render(<SquadCard squad={squadWithoutUnits} />);

    expect(screen.getByText('0 units')).toBeInTheDocument();
  });

  test('shows unit positions when available', () => {
    render(<SquadCard squad={mockSquad} />);

    expect(screen.getByText('Leader: Clone Commander Rex')).toBeInTheDocument();
    expect(screen.getByText('Tank: ARC Trooper Echo')).toBeInTheDocument();
  });

  test('shows relic requirements', () => {
    render(<SquadCard squad={mockSquad} />);

    expect(screen.getByText('R7')).toBeInTheDocument(); // Rex relic level
    expect(screen.getByText('R5')).toBeInTheDocument(); // Echo relic level
  });

  test('formats creation date correctly', () => {
    render(<SquadCard squad={mockSquad} />);

    // Should show relative time
    expect(screen.getByText(/ago/)).toBeInTheDocument();
  });

  test('handles long descriptions with truncation', () => {
    const longDescription = 'This is a very long description that should be truncated when displayed in the card view to prevent the card from becoming too tall and maintaining a consistent layout across all squad cards in the grid view.';
    const squadWithLongDesc = { ...mockSquad, description: longDescription };

    render(<SquadCard squad={squadWithLongDesc} />);

    // The component should handle long descriptions appropriately
    expect(screen.getByText(longDescription)).toBeInTheDocument();
  });

  test('displays squad type with correct styling', () => {
    render(<SquadCard squad={mockSquad} />);

    const squadTypeElement = screen.getByText('CLONE TROOPERS');
    expect(squadTypeElement).toHaveClass('text-xs', 'font-medium');
  });
});