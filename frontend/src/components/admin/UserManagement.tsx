import React from 'react';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Edit,
  Shield,
  Ban,
  Check,
  X,
  MoreVertical,
  Mail,
  Calendar
} from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../../utils/helpers';

interface User {
  id: number;
  username: string;
  email: string;
  role: 'VIEWER' | 'CONTRIBUTOR' | 'ADMIN' | 'SUPER_ADMIN';
  isActive: boolean;
  createdAt: string;
  lastLogin: string | null;
  squadsCount: number;
}

export const UserManagement: React.FC = () => {
  const [users, setUsers] = React.useState<User[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState<string>('all');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const [showRoleModal, setShowRoleModal] = React.useState(false);
  const [newRole, setNewRole] = React.useState<User['role']>('VIEWER');

  React.useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock data
    const mockUsers: User[] = [
      {
        id: 1,
        username: 'johndoe',
        email: 'john@example.com',
        role: 'CONTRIBUTOR',
        isActive: true,
        createdAt: '2024-01-15T10:00:00Z',
        lastLogin: '2024-01-20T14:30:00Z',
        squadsCount: 12
      },
      {
        id: 2,
        username: 'janesmith',
        email: 'jane@example.com',
        role: 'ADMIN',
        isActive: true,
        createdAt: '2024-01-10T09:00:00Z',
        lastLogin: '2024-01-21T11:15:00Z',
        squadsCount: 5
      },
      {
        id: 3,
        username: 'mikewilson',
        email: 'mike@example.com',
        role: 'VIEWER',
        isActive: false,
        createdAt: '2024-01-12T16:00:00Z',
        lastLogin: '2024-01-18T08:45:00Z',
        squadsCount: 0
      }
    ];

    setUsers(mockUsers);
    setIsLoading(false);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'active' && user.isActive) ||
                         (statusFilter === 'inactive' && !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleRoleChange = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setShowRoleModal(true);
  };

  const confirmRoleChange = async () => {
    if (!selectedUser) return;

    // Simulate API call
    setUsers(prev => prev.map(user =>
      user.id === selectedUser.id
        ? { ...user, role: newRole }
        : user
    ));

    setShowRoleModal(false);
    setSelectedUser(null);
  };

  const toggleUserStatus = async (user: User) => {
    // Simulate API call
    setUsers(prev => prev.map(u =>
      u.id === user.id
        ? { ...u, isActive: !u.isActive }
        : u
    ));
  };

  const getRoleColor = (role: User['role']) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'text-red-400 bg-red-900/20 border-red-500/30';
      case 'ADMIN': return 'text-amber-400 bg-amber-900/20 border-amber-500/30';
      case 'CONTRIBUTOR': return 'text-blue-400 bg-blue-900/20 border-blue-500/30';
      case 'VIEWER': return 'text-green-400 bg-green-900/20 border-green-500/30';
      default: return 'text-neutral-400 bg-neutral-900/20 border-neutral-500/30';
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold text-white">User Management</h2>
        <button className="btn-primary flex items-center space-x-2">
          <UserPlus size={16} />
          <span>Invite User</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input w-full"
            >
              <option value="all">All Roles</option>
              <option value="VIEWER">Viewer</option>
              <option value="CONTRIBUTOR">Contributor</option>
              <option value="ADMIN">Admin</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-full"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <div className="text-sm text-neutral-400 flex items-center">
              {filteredUsers.length} of {users.length} users
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="card-content p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-neutral-700">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-neutral-300">User</th>
                  <th className="text-left p-4 text-sm font-medium text-neutral-300">Role</th>
                  <th className="text-left p-4 text-sm font-medium text-neutral-300">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-neutral-300">Activity</th>
                  <th className="text-left p-4 text-sm font-medium text-neutral-300">Joined</th>
                  <th className="text-right p-4 text-sm font-medium text-neutral-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-700">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-neutral-800/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-neutral-700 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-white">{user.username}</div>
                          <div className="text-sm text-neutral-400 flex items-center space-x-1">
                            <Mail size={12} />
                            <span>{user.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border',
                        getRoleColor(user.role)
                      )}>
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <div className={cn(
                          'h-2 w-2 rounded-full',
                          user.isActive ? 'bg-green-400' : 'bg-red-400'
                        )} />
                        <span className={cn(
                          'text-sm',
                          user.isActive ? 'text-green-400' : 'text-red-400'
                        )}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        <div className="text-white">{user.squadsCount} squads</div>
                        <div className="text-neutral-400">
                          {user.lastLogin
                            ? `Last seen ${formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true })}`
                            : 'Never logged in'
                          }
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-neutral-400 flex items-center space-x-1">
                        <Calendar size={12} />
                        <span>{formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleRoleChange(user)}
                          className="p-1 text-neutral-400 hover:text-blue-400 transition-colors"
                          title="Change Role"
                        >
                          <Shield size={16} />
                        </button>
                        <button
                          onClick={() => toggleUserStatus(user)}
                          className={cn(
                            'p-1 transition-colors',
                            user.isActive
                              ? 'text-neutral-400 hover:text-red-400'
                              : 'text-neutral-400 hover:text-green-400'
                          )}
                          title={user.isActive ? 'Deactivate User' : 'Activate User'}
                        >
                          {user.isActive ? <Ban size={16} /> : <Check size={16} />}
                        </button>
                        <button
                          className="p-1 text-neutral-400 hover:text-neutral-300 transition-colors"
                          title="More Actions"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-neutral-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No users found</h3>
              <p className="text-neutral-400">
                {searchQuery ? 'Try adjusting your search criteria' : 'No users match the current filters'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Role Change Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Change Role for {selectedUser.username}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    New Role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as User['role'])}
                    className="input w-full"
                  >
                    <option value="VIEWER">Viewer</option>
                    <option value="CONTRIBUTOR">Contributor</option>
                    <option value="ADMIN">Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>
                <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3">
                  <p className="text-amber-200 text-sm">
                    Changing a user's role will immediately affect their permissions.
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRoleChange}
                  className="btn-primary"
                >
                  Change Role
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};