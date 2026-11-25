'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Plus, X, Trash2, Edit2 } from 'lucide-react';

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
    setPassword('');
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
      <div className="bg-card p-5 rounded-2xl border border-line shadow-[0_1px_2px_rgba(15,23,42,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand" />
            <h1 className="text-xl font-bold text-slate-800 m-0">
              Data Pengguna &amp; Hak Akses (RBAC)
            </h1>
          </div>
          <p className="text-xs text-slate-500 m-0 mt-0.5">
            Pengelolaan akun Administrator Utama, Bendahara Sekolah, dan Operator Sekolah.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-brand hover:bg-brand-hover text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah User Pengguna</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-card rounded-2xl border border-line shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-subtle text-slate-600 font-semibold border-b border-line">
            <tr>
              <th className="p-3.5">Username</th>
              <th className="p-3.5">Nama Lengkap</th>
              <th className="p-3.5">Role / Level</th>
              <th className="p-3.5 text-right">Aksi Management</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/70">
            {loading ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500">Memuat daftar pengguna...</td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-subtle/70">
                  <td className="p-3.5 font-mono font-bold text-brand">
                    {u.username}
                  </td>
                  <td className="p-3.5 font-semibold text-slate-800">
                    {u.namaLengkap}
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${u.level === 'admin'
                          ? 'bg-brand-soft text-brand-text border-brand-border'
                          : u.level === 'bendahara'
                            ? 'bg-sage-soft text-sage-text border-sage-border'
                            : 'bg-[#f8efd9] text-[#8a5b13] border-[#e7d2a3]'
                        }`}
                    >
                      {u.level === 'admin' ? 'Administrator' : u.level === 'bendahara' ? 'Bendahara Sekolah' : 'Operator Sekolah'}
                    </span>
                  </td>
                  <td className="p-3.5 text-right space-x-1">
                    <button
                      onClick={() => openEditModal(u)}
                      className="p-1.5 rounded-lg bg-brand-soft text-brand hover:bg-brand-border/50 transition-colors"
                      title="Edit User"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(u.id, u.username)}
                      className="p-1.5 rounded-lg bg-brick-soft text-brick hover:bg-brick-border/50 transition-colors"
                      title="Hapus User"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Edit / Tambah User */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-700/35 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-xl border border-line max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-sm font-bold text-slate-800 m-0">
                {editUser ? `Edit User '${editUser.username}'` : 'Tambah User Baru'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Username *</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="misal: bendahara2, operator1"
                  className="w-full px-3.5 py-2 bg-subtle border border-line rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:bg-card focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={namaLengkap}
                  onChange={(e) => setNamaLengkap(e.target.value)}
                  placeholder="misal: Fairuza Rikha Amri, S.E, M.Si"
                  className="w-full px-3.5 py-2 bg-subtle border border-line rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-card focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Password {editUser ? '(Kosongkan jika tidak diubah)' : '*'}
                </label>
                <input
                  type="password"
                  required={!editUser}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={editUser ? 'Sama seperti sebelumnya' : 'Masukkan password user'}
                  className="w-full px-3.5 py-2 bg-subtle border border-line rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-card focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Level / Role *</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full px-3.5 py-2 bg-subtle border border-line rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:bg-card focus:border-brand"
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
                  className="px-4 py-2 bg-subtle hover:bg-[#e2e8f2] border border-line text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold shadow-sm"
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
