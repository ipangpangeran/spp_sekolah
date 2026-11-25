'use client';

import React, { useState, useEffect } from 'react';
import {
  Archive,
  Trash2,
  AlertTriangle,
  GraduationCap,
  Users,
  X,
  RefreshCw,
} from 'lucide-react';

export default function ArsipKelasPage() {
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [siswaCount, setSiswaCount] = useState(0);
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(true);

  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [clearing, setClearing] = useState(false);

  const [showArchiveClassModal, setShowArchiveClassModal] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resK, resS] = await Promise.all([
        fetch('/api/master/kelas'),
        fetch('/api/master/siswa'),
      ]);
      const dataK = await resK.json();
      const dataS = await resS.json();
      setKelasList(dataK.kelasList || []);
      setSiswaCount(dataS.siswaList?.length || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleArchiveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;
    setArchiving(true);
    try {
      const res = await fetch('/api/master/siswa/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'archive_class', idKelas: selectedClass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengarsip');

      alert(data.message || 'Berhasil mengarsip kelas!');
      setShowArchiveClassModal(false);
      setSelectedClass('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan');
    } finally {
      setArchiving(false);
    }
  };

  const handleClearAllStudents = async (e: React.FormEvent) => {
    e.preventDefault();
    setClearing(true);
    try {
      const res = await fetch('/api/master/siswa/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'clear_all',
          confirmationText: confirmInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus');

      alert(data.message || 'Seluruh data siswa berhasil dibersihkan!');
      setShowClearAllModal(false);
      setConfirmInput('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal memproses penghapusan');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Bar */}
      <div className="bg-card p-5 rounded-2xl border border-line shadow-[0_1px_2px_rgba(15,23,42,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Archive className="w-5 h-5 text-brand" />
            <h1 className="text-xl font-bold text-slate-800 m-0">
              Arsip Kelas &amp; Pembersihan Data Siswa
            </h1>
          </div>
          <p className="text-xs text-slate-500 m-0 mt-0.5">
            Proses pengarsipan kelas kenaikan/kelulusan serta pembersihan data induk siswa untuk persiapan tahun ajaran baru.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="px-3.5 py-2 bg-subtle hover:bg-[#e2e8f2] border border-line text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5"
        >
          <RefreshCw className="w-4 h-4 text-brand" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card p-5 rounded-2xl border border-line shadow-[0_1px_2px_rgba(15,23,42,0.03)] flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Rombel Kelas</span>
            <span className="text-2xl font-black text-slate-800 font-mono-data">
              {kelasList.length} Kelas
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-brand-soft text-brand flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-card p-5 rounded-2xl border border-line shadow-[0_1px_2px_rgba(15,23,42,0.03)] flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Siswa Terdaftar</span>
            <span className="text-2xl font-black text-slate-800 font-mono-data">
              {siswaCount} Siswa
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-sage-soft text-sage flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Action Section 1: Arsip Per Kelas */}
      <div className="bg-card p-6 rounded-2xl border border-line shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-4">
        <div className="flex items-center gap-3 border-b border-line pb-3">
          <div className="w-9 h-9 rounded-xl bg-brand-soft text-brand border border-brand-border flex items-center justify-center font-bold">
            1
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 m-0">
              Arsip &amp; Kelulusan Per Kelas
            </h2>
            <p className="text-xs text-slate-500 m-0">
              Ubah status siswa kelas pilihan menjadi LULUS/ALUMNI dan bersihkan histori tagihan lama.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="flex-1 w-full px-3.5 py-2.5 bg-subtle border border-line rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:bg-card focus:border-brand"
          >
            <option value="">-- Pilih Kelas yang Akan Diarsip --</option>
            {kelasList.map((k) => (
              <option key={k.id} value={k.id}>
                {k.namaKelas} ({k._count?.siswa || 0} Siswa)
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              if (!selectedClass) return alert('Pilih kelas terlebih dahulu!');
              setShowArchiveClassModal(true);
            }}
            disabled={!selectedClass}
            className="w-full sm:w-auto px-5 py-2.5 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <Archive className="w-4 h-4" />
            <span>Proses Arsip Kelas</span>
          </button>
        </div>
      </div>

      {/* Action Section 2: Reset / Delete All Students */}
      <div className="bg-brick-soft/60 p-6 rounded-2xl border border-brick-border shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-4">
        <div className="flex items-center gap-3 border-b border-brick-border pb-3">
          <div className="w-9 h-9 rounded-xl bg-card text-brick border border-brick-border flex items-center justify-center font-bold">
            2
          </div>
          <div>
            <h2 className="text-sm font-bold text-brick-text m-0">
              Pembersihan Total: Hapus Semua Data Siswa (Fresh Batch Import)
            </h2>
            <p className="text-xs text-slate-600 m-0">
              Memudahkan persiapan penginputan batch baru siswa secara bersih tanpa menyisakan data lama.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-brick-text space-y-1">
            <p className="font-semibold m-0 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-brick shrink-0" />
              <span>Tindakan ini akan menghapus seluruh {siswaCount} data siswa beserta seluruh tagihannya!</span>
            </p>
            <p className="m-0 text-[11px] text-slate-600">
              Dibutuhkan ketikan pesan konfirmasi sebelum tindakan dieksekusi.
            </p>
          </div>

          <button
            onClick={() => {
              setConfirmInput('');
              setShowClearAllModal(true);
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-brick hover:bg-brick-hover text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            <span>Hapus Semua Data Siswa</span>
          </button>
        </div>
      </div>

      {/* MODAL 1: Archive Class Confirmation */}
      {showArchiveClassModal && (
        <div className="fixed inset-0 z-50 bg-slate-700/35 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-xl border border-line max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-sm font-bold text-slate-800 m-0">
                Konfirmasi Arsip Kelas
              </h3>
              <button onClick={() => setShowArchiveClassModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p className="m-0">
                Apakah Anda yakin ingin mengarsip seluruh siswa di kelas pilihan ini? Status siswa akan diubah menjadi <span className="font-bold text-brand">LULUS</span> dan tagihan lama akan dibersihkan.
              </p>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowArchiveClassModal(false)}
                  className="px-4 py-2 bg-subtle hover:bg-[#e2e8f2] border border-line text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleArchiveClass}
                  disabled={archiving}
                  className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  {archiving ? 'Memproses...' : 'Ya, Arsipkan Kelas'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Clear All Students Confirmation */}
      {showClearAllModal && (
        <div className="fixed inset-0 z-50 bg-slate-700/35 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-xl border border-brick-border max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-brick" />
                <h3 className="text-sm font-bold text-brick-text m-0">
                  Konfirmasi Hapus Semua Data Siswa
                </h3>
              </div>
              <button onClick={() => setShowClearAllModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleClearAllStudents} className="space-y-4 text-xs text-slate-600">
              <p className="m-0 leading-relaxed">
                Ketikkan kata kunci di bawah ini untuk mengonfirmasi penghapusan permanen seluruh <span className="font-bold text-brick">{siswaCount} siswa</span>:
              </p>

              <div className="p-3 bg-brick-soft border border-brick-border rounded-xl font-mono text-center font-bold text-brick-text text-xs select-all">
                HAPUS SEMUA DATA SISWA
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Ketikkan teks konfirmasi:
                </label>
                <input
                  type="text"
                  required
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  placeholder="Ketik HAPUS SEMUA DATA SISWA"
                  className="w-full px-3.5 py-2 bg-subtle border border-brick-border rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:bg-card"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowClearAllModal(false)}
                  className="px-4 py-2 bg-subtle hover:bg-[#e2e8f2] border border-line text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={clearing || confirmInput !== 'HAPUS SEMUA DATA SISWA'}
                  className="px-4 py-2 bg-brick hover:bg-brick-hover disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  {clearing ? 'Menghapus...' : 'Hapus Permanen Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
