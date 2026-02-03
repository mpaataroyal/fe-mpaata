import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Trash2, Edit2, Check, X, 
  User, Phone, Mail, Shield, Users,
  Loader2, RefreshCw 
} from 'lucide-react';

// ==================================================================================
// PRODUCTION IMPORTS
// ==================================================================================
// Changed from @/ aliases to relative paths to fix build errors
import DashboardLayout from '../../../layout';
import { api } from '../../../libs/apiAgent'; 

// ==================================================================================
// SUB-COMPONENTS
// ==================================================================================

const Badge = ({ role }) => {
  const styles = {
    super_admin: 'bg-[#D4AF37] text-[#0F2027] border-[#0F2027]',
    admin: 'bg-[#0F2027] text-[#D4AF37] border-[#D4AF37]',
    manager: 'bg-purple-100 text-purple-700 border-purple-200',
    receptionist: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    customer: 'bg-green-100 text-green-700 border-green-200',
  };
  const label = role ? role.replace('_', ' ').toUpperCase() : 'UNKNOWN';
  return (
    <span className={`px-2 py-1 rounded-[2px] text-[10px] font-bold tracking-wider border ${styles[role] || 'bg-gray-100 text-gray-500'}`}>
      {label}
    </span>
  );
};

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2027]/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-[2px] shadow-2xl overflow-hidden animate-scale-in">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-[#fcfbf7]">
          <h3 className="font-serif text-lg text-[#0F2027] font-bold">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// ==================================================================================
// MAIN PAGE COMPONENT
// ==================================================================================

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ fullName: '', email: '', phone: '+256', role: 'customer' });
  const [creating, setCreating] = useState(false);

  // Popover State
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // 1. Fetch Users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.users.getAll();
      
      // Defensive coding: Check for response.data or response.users depending on your backend wrapper
      const userList = response.users || response.data || [];
      
      const formattedUsers = userList.map((user) => ({
        key: user.uid || user.id, // Fallback to id if uid is missing
        username: user.email?.split('@')[0] || 'Unknown',
        fullName: user.displayName || user.fullName || 'No Name',
        email: user.email || '',
        phone: user.phoneNumber || user.phone || 'N/A',
        role: user.role || 'customer',
        avatar: user.photoURL || null,
        creationTime: user.creationTime
      }));
      
      setUsers(formattedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      // In production, replace this with your toast library (e.g., toast.error("Failed to load users"))
      alert('Failed to load users. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 2. Create User
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreating(true);
    
    try {
      // Auto-generate secure password for the initial creation if backend requires it
      const tempPassword = Math.random().toString(36).slice(-8) + "Aa1!"; 

      await api.users.create({
        email: newUser.email,
        password: tempPassword, 
        displayName: newUser.fullName,
        phoneNumber: newUser.phone,
        role: newUser.role
      });

      // Notify success
      alert(`User created successfully.\nTemporary Password: ${tempPassword}`);
      
      setIsModalOpen(false);
      setNewUser({ fullName: '', email: '', phone: '+256', role: 'customer' });
      fetchUsers(); // Refresh list

    } catch (error) {
      console.error("Error creating user:", error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to create user';
      alert(errorMsg);
    } finally {
      setCreating(false);
    }
  };

  // 3. Delete User
  const handleDelete = async (uid) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await api.users.delete(uid);
        // Optimistic update
        setUsers((prevUsers) => prevUsers.filter((item) => item.key !== uid));
      } catch (error) {
        console.error("Error deleting user:", error);
        alert('Failed to delete user');
        fetchUsers(); // Revert state on failure
      }
    }
  };

  // 4. Update Role
  const handleRoleUpdate = async (uid, newRole) => {
    setOpenDropdownId(null);
    const previousUsers = [...users];

    // Optimistic UI update
    setUsers(users.map(u => u.key === uid ? { ...u, role: newRole } : u));

    try {
      await api.users.updateRole(uid, { role: newRole });
    } catch (error) {
      console.error("Error updating role:", error);
      alert('Failed to update role');
      setUsers(previousUsers); // Revert on failure
    }
  };

  const filteredUsers = users.filter(user => 
    (user.fullName && user.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
      <div className="font-sans text-gray-900 p-6 md:p-12">
        {/* Header with Search and Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="font-serif text-3xl text-[#0F2027] mb-1">User Management</h1>
            <p className="text-gray-500 text-sm">Manage system access and customer accounts.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text"
                placeholder="Search users..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-[2px] text-sm focus:outline-none focus:border-[#D4AF37] bg-white transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <button 
                onClick={fetchUsers} 
                disabled={loading}
                className="px-4 py-2 border border-gray-200 bg-white hover:border-[#D4AF37] text-gray-600 rounded-[2px] text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
              </button>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-[#0F2027] text-[#D4AF37] border border-[#0F2027] hover:bg-[#1a2e38] rounded-[2px] text-sm font-medium flex items-center gap-2 transition-colors shadow-lg whitespace-nowrap"
              >
                <Plus size={16} /> Add User
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-[2px] shadow-sm border border-gray-100 overflow-hidden">
          {loading && users.length === 0 ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="animate-spin text-[#D4AF37]" size={32} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">User Profile</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr key={user.key} className="hover:bg-[#fcfbf7] transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#0F2027] text-[#D4AF37] flex items-center justify-center font-serif text-lg">
                              {user.fullName ? user.fullName.charAt(0) : '?'}
                            </div>
                            <div>
                              <p className="font-bold text-[#0F2027] text-sm">{user.fullName}</p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 relative">
                          <div className="flex items-center gap-2">
                            <Badge role={user.role} />
                            {user.role !== 'super_admin' && (
                              <button 
                                onClick={() => setOpenDropdownId(openDropdownId === user.key ? null : user.key)}
                                className="text-gray-300 hover:text-[#0F2027] transition-colors"
                              >
                                <Edit2 size={12} />
                              </button>
                            )}
                          </div>

                          {/* Role Dropdown */}
                          {openDropdownId === user.key && (
                            <div className="absolute top-12 left-6 z-20 bg-white shadow-xl border border-gray-100 rounded-[2px] w-40 py-1 animate-fade-in-up">
                              {['admin', 'manager', 'receptionist', 'customer'].map(role => (
                                <button
                                  key={role}
                                  onClick={() => handleRoleUpdate(user.key, role)}
                                  className="w-full text-left px-4 py-2 text-xs hover:bg-gray-50 hover:text-[#D4AF37] capitalize flex justify-between items-center"
                                >
                                  {role}
                                  {user.role === role && <Check size={12} />}
                                </button>
                              ))}
                            </div>
                          )}
                          {/* Overlay to close dropdown */}
                          {openDropdownId === user.key && (
                            <div className="fixed inset-0 z-10" onClick={() => setOpenDropdownId(null)}></div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs text-gray-600 space-y-1">
                            <div className="flex items-center gap-2">
                              <Phone size={12} className="text-gray-400" /> 
                              {user.phone}
                            </div>
                            <div className="flex items-center gap-2">
                              <Users size={12} className="text-gray-400" />
                              Joined {user.creationTime ? new Date(user.creationTime).toLocaleDateString() : 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleDelete(user.key)}
                            disabled={user.role === 'super_admin'}
                            className={`p-2 rounded-full transition-colors ${user.role === 'super_admin' ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-gray-400">
                        No users found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create User Modal */}
        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          title="Add New User"
        >
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input 
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-[2px] text-sm focus:outline-none focus:border-[#D4AF37]"
                  placeholder="John Doe"
                  value={newUser.fullName}
                  onChange={e => setNewUser({...newUser, fullName: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input 
                  required
                  type="email"
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-[2px] text-sm focus:outline-none focus:border-[#D4AF37]"
                  placeholder="john@example.com"
                  value={newUser.email}
                  onChange={e => setNewUser({...newUser, email: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1.5">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input 
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-[2px] text-sm focus:outline-none focus:border-[#D4AF37]"
                  placeholder="+256..."
                  value={newUser.phone}
                  onChange={e => setNewUser({...newUser, phone: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1.5">Role</label>
              <div className="relative">
                <Shield className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <select 
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-[2px] text-sm focus:outline-none focus:border-[#D4AF37] bg-white appearance-none"
                  value={newUser.role}
                  onChange={e => setNewUser({...newUser, role: e.target.value})}
                >
                  <option value="customer">Customer</option>
                  <option value="receptionist">Receptionist</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm text-gray-500 hover:text-[#0F2027] transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={creating}
                className="px-6 py-2 bg-[#0F2027] text-[#D4AF37] text-sm font-medium rounded-[2px] hover:brightness-110 flex items-center gap-2"
              >
                {creating ? <Loader2 size={14} className="animate-spin" /> : 'Create User'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Global Styles for Animations */}
        <style>{`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
          .animate-fade-in { animation: fadeIn 0.2s ease-out; }
          .animate-scale-in { animation: scaleIn 0.2s ease-out; }
          .animate-fade-in-up { animation: fadeIn 0.2s ease-out, scaleIn 0.1s ease-out; }
        `}</style>
      </div>
  );
};

UsersPage.getLayout = function getLayout(page) {
  return (
    <DashboardLayout>
      {page}
    </DashboardLayout>
  );
};

export default UsersPage;