'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Plus, X, UserCheck, Trash2, Key, Edit2 } from 'lucide-react';

export default function MasterUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [namaLengkap, setNamaLengkap] = useState('');
  const [level, setLevel] = useState('bendahara');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/master/users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditUser(null);
    setUsername('');
    setPassword('');
    setNamaLengkap('');
    setLevel('bendahara');
    setShowModal(true);
  };

  const openEditModal = (u: any) => {
    setEditUser(u);
    setUsername(u.username);
    setPassword(''); // leave blank if not changing
    setNamaLengkap(u.namaLengkap);
    setLevel(u.level);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = '/api/master/users';
      const method = editUser ? 'PUT' : 'POST';
      const body: any = {
        id: editUser?.id,
        username,
        namaLengkap,
        level,
      };

      if (password) body.password = password;
      if (!editUser && !password) throw new Error('Password wajib diisi untuk user baru');

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan user');

      setShowModal(false);
      loadData();
      alert('Pengguna berhasil disimpan!');
    } catch (e: any) {
      alert(e.message || 'Terjadi kesalahan');
    }
  };

  const handleDelete = async (id: number, uname: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus user '${uname}'?`)) return;

    try {
      const res = await fetch(`/api/master/users?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus user');

      loadData();
    } catch (e: any) {
      alert(e.message || 'Terjadi kesalahan');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white m-0">
              Data Pengguna &amp; Hak Akses (RBAC)
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
            Pengelolaan akun Administrator Utama, Bendahara Sekolah, dan Operator Sekolah.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah User Pengguna</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="p-3.5">Username</th>
              <th className="p-3.5">Nama Lengkap</th>
              <th className="p-3.5">Role / Level</th>
              <th className="p-3.5 text-right">Aksi Management</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                <td className="p-3.5 font-mono font-bold text-blue-600 dark:text-blue-400">
                  {u.username}
                </td>
                <td className="p-3.5 font-semibold text-slate-900 dark:text-white">
                  {u.namaLengkap}
                </td>
                <td className="p-3.5">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      u.level === 'admin'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        : u.level === 'bendahara'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    {u.level === 'admin' ? 'Administrator' : u.level === 'bendahara' ? 'Bendahara Sekolah' : 'Operator Sekolah'}
                  </span>
                </td>
                <td className="p-3.5 text-right space-x-1">
                  <button
                    onClick={() => openEditModal(u)}
                    className="p-1.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300 transition-colors"
                    title="Edit User"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(u.id, u.username)}
                    className="p-1.5 rounded bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/40 dark:text-rose-300 transition-colors"
                    title="Hapus User"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Edit / Tambah User */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white m-0">
                {editUser ? `Edit User '${editUser.username}'` : 'Tambah User Baru'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Username *</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="misal: bendahara2, operator1"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={namaLengkap}
                  onChange={(e) => setNamaLengkap(e.target.value)}
                  placeholder="misal: Fairuza Rikha Amri, S.E, M.Si"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Password {editUser ? '(Kosongkan jika tidak diubah)' : '*'}
                </label>
                <input
                  type="password"
                  required={!editUser}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={editUser ? 'Sama seperti sebelumnya' : 'Masukkan password user'}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Level / Role *</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                >
                  <option value="admin">Administrator (Akses Penuh)</option>
                  <option value="bendahara">Bendahara Sekolah</option>
                  <option value="operator">Operator Sekolah</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Simpan User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
