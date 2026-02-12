'use client';

import React, { useState, useEffect } from 'react';
import { 
  getAdminsAction, 
  createAdminAction, 
  updateAdminAction, 
  deleteAdminAction 
} from '@/actions/admins';
import { 
  AdminUser, 
  PERMISSIONS, 
  AdminPermission 
} from '@/data/admins';
import { 
  UserPlus, 
  Shield, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  Key,
  Loader2
} from 'lucide-react';

export default function AdminsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AdminUser['role']>('admin');
  const [selectedPermissions, setSelectedPermissions] = useState<AdminPermission[]>([]);

  async function refreshAdmins() {
    setLoading(true);
    const result = await getAdminsAction();
    if (result.success && result.data) {
      setAdmins(result.data);
    } else {
      console.error(result.error);
    }
    setLoading(false);
  }

  useEffect(() => {
    const id = setTimeout(() => {
      refreshAdmins();
    }, 0);
    return () => clearTimeout(id);
  }, []);

  const handleEdit = (admin: AdminUser) => {
    setEditingId(admin.id);
    setName(admin.name);
    setUsername(admin.username);
    setPassword(''); // Don't show password
    setRole(admin.role);
    setSelectedPermissions(admin.permissions);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingId(null);
    setName('');
    setUsername('');
    setPassword('');
    setRole('admin');
    setSelectedPermissions([]);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let result;
      if (editingId) {
        result = await updateAdminAction(editingId, {
          name,
          username,
          role,
          permissions: selectedPermissions,
          ...(password ? { password } : {})
        });
      } else {
        if (!password) {
          alert('رمز عبور الزامی است.');
          return;
        }
        result = await createAdminAction({
          name,
          username,
          password,
          role,
          permissions: selectedPermissions,
          isActive: true
        });
      }

      if (result.success) {
        setIsModalOpen(false);
        refreshAdmins();
      } else {
        alert(result.error);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      alert(msg);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('آیا از حذف این مدیر اطمینان دارید؟')) {
      try {
        const result = await deleteAdminAction(id);
        if (result.success) {
            setAdmins(prev => prev.filter(a => a.id !== id));
        } else {
            alert(result.error);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        alert(msg);
      }
    }
  };

  const togglePermission = (permId: AdminPermission) => {
    setSelectedPermissions(prev => 
      prev.includes(permId) 
        ? prev.filter(p => p !== permId)
        : [...prev, permId]
    );
  };

  const toggleAllPermissions = () => {
    if (selectedPermissions.length === PERMISSIONS.length) {
      setSelectedPermissions([]);
    } else {
      setSelectedPermissions(PERMISSIONS.map(p => p.id));
    }
  };

  if (loading && admins.length === 0) {
      return (
          <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
      );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">مدیریت مدیران و دسترسی‌ها</h1>
        <button
          onClick={handleAddNew}
          className="bg-[#83b735] hover:bg-[#72a52a] text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors shadow-sm"
        >
          <UserPlus className="w-5 h-5" />
          افزودن مدیر جدید
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-right p-4">نام</th>
              <th className="text-right p-4">نام کاربری</th>
              <th className="text-right p-4">نقش</th>
              <th className="text-right p-4">وضعیت</th>
              <th className="text-right p-4">دسترسی‌ها</th>
              <th className="text-right p-4">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {admins.map((admin) => (
              <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 font-medium text-gray-900">{admin.name}</td>
                <td className="p-4 text-gray-600 font-mono text-xs">{admin.username}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    admin.role === 'super_admin' ? 'bg-purple-100 text-purple-700' :
                    admin.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {admin.role === 'super_admin' ? 'مدیر کل' : admin.role === 'admin' ? 'مدیر' : 'نویسنده'}
                  </span>
                </td>
                <td className="p-4">
                  {admin.isActive ? (
                    <span className="text-green-600 flex items-center gap-1 text-xs">
                      <Check className="w-3 h-3" /> فعال
                    </span>
                  ) : (
                    <span className="text-red-500 flex items-center gap-1 text-xs">
                      <X className="w-3 h-3" /> غیرفعال
                    </span>
                  )}
                </td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {admin.role === 'super_admin' ? (
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">همه دسترسی‌ها</span>
                    ) : (
                      <>
                        {admin.permissions.slice(0, 3).map(p => (
                          <span key={p} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                            {PERMISSIONS.find(pm => pm.id === p)?.label}
                          </span>
                        ))}
                        {admin.permissions.length > 3 && (
                          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                            +{admin.permissions.length - 3}
                          </span>
                        )}
                        {admin.permissions.length === 0 && <span className="text-gray-400 text-xs">-</span>}
                      </>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(admin)}
                      className="p-2 border rounded-md hover:bg-gray-50 text-gray-600"
                      title="ویرایش"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {admin.role !== 'super_admin' && (
                      <button
                        onClick={() => handleDelete(admin.id)}
                        className="p-2 border rounded-md hover:bg-red-50 text-red-600"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSave}>
              <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                <h2 className="text-lg font-bold text-gray-800">
                  {editingId ? 'ویرایش مدیر' : 'افزودن مدیر جدید'}
                </h2>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">نام کامل</label>
                    <input
                      required
                      className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#83b735] focus:outline-none"
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">نام کاربری</label>
                    <input
                      required
                      className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#83b735] focus:outline-none dir-ltr text-right"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {editingId ? 'رمز عبور جدید (اختیاری)' : 'رمز عبور'}
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#83b735] focus:outline-none dir-ltr text-right"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder={editingId ? '********' : ''}
                      />
                      <Key className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">نقش</label>
                    <select
                      className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#83b735] focus:outline-none"
                      value={role}
                      onChange={e => setRole(e.target.value as AdminUser['role'])}
                    >
                      <option value="admin">مدیر</option>
                      <option value="editor">نویسنده</option>
                      <option value="super_admin" disabled={role !== 'super_admin'}>مدیر کل</option>
                    </select>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#83b735]" />
                      دسترسی‌ها
                    </label>
                    <button
                      type="button"
                      onClick={toggleAllPermissions}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      {selectedPermissions.length === PERMISSIONS.length ? 'حذف همه' : 'انتخاب همه'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {PERMISSIONS.map((perm) => (
                      <label 
                        key={perm.id} 
                        className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${
                          selectedPermissions.includes(perm.id) 
                            ? 'bg-[#83b735]/10 border-[#83b735]' 
                            : 'hover:bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                          selectedPermissions.includes(perm.id)
                            ? 'bg-[#83b735] border-[#83b735]'
                            : 'border-gray-300 bg-white'
                        }`}>
                          {selectedPermissions.includes(perm.id) && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={selectedPermissions.includes(perm.id)}
                          onChange={() => togglePermission(perm.id)}
                        />
                        <span className="text-xs text-gray-700">{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#83b735] hover:bg-[#72a52a] text-white rounded-lg transition-colors shadow-sm"
                >
                  {editingId ? 'ذخیره تغییرات' : 'افزودن مدیر'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
