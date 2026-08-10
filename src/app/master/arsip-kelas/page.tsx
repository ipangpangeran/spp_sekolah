'use client';

import React, { useState, useEffect } from 'react';
import {
  Archive,
  Trash2,
  AlertTriangle,
  CheckCircle2,
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

  // Clear All Modal
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [clearing, setClearing] = useState(false);

  // Archive Class Modal
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
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Archive className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white m-0">
              Arsip Kelas &amp; Pembersihan Data Siswa
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
            Proses pengarsipan kelas kenaikan/kelulusan serta pembersihan data induk siswa untuk persiapan tahun ajaran baru.
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5"
        >
          <RefreshCw className="w-4 h-4 text-blue-500" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Rombel Kelas</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono-data">
              {kelasList.length} Kelas
            </span>
          </div>
          <GraduationCap className="w-10 h-10 text-indigo-500/30" />
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Siswa Terdaftar</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono-data">
              {siswaCount} Siswa
            </span>
          </div>
          <Users className="w-10 h-10 text-blue-500/30" />
        </div>
      </div>

      {/* Action Section 1: Arsip Per Kelas */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700 pb-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            1
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white m-0">
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
            className="flex-1 w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-semibold"
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
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <Archive className="w-4 h-4" />
            <span>Proses Arsip Kelas</span>
          </button>
        </div>
      </div>

      {/* Action Section 2: Reset / Delete All Students for New Academic Batch */}
      <div className="bg-rose-50/50 dark:bg-rose-950/20 p-6 rounded-2xl border border-rose-200 dark:border-rose-900/60 shadow-sm space-y-4">
        <div className="flex items-center gap-3 border-b border-rose-200 dark:border-rose-900/60 pb-3">
          <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
            2
          </div>
          <div>
            <h2 className="text-sm font-bold text-rose-900 dark:text-rose-200 m-0">
              Pembersihan Total: Hapus Semua Data Siswa (Fresh Batch Import)
            </h2>
            <p className="text-xs text-rose-700 dark:text-rose-300/80 m-0">
              Memudahkan persiapan penginputan batch baru siswa secara bersih tanpa menyisakan data lama.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-rose-800 dark:text-rose-300 space-y-1">
            <p className="font-semibold m-0 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Tindakan ini akan menghapus seluruh {siswaCount} data siswa beserta seluruh tagihannya!</span>
            </p>
            <p className="m-0 text-[11px] text-rose-600 dark:text-rose-400">
              Dibutuhkan ketikan pesan konfirmasi sebelum tindakan dieksekusi.
            </p>
          </div>

          <button
            onClick={() => {
              setConfirmInput('');
              setShowClearAllModal(true);
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            <span>Hapus Semua Data Siswa</span>
          </button>
        </div>
      </div>

      {/* MODAL 1: Archive Class Confirmation */}
      {showArchiveClassModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white m-0">
                Konfirmasi Arsip Kelas
              </h3>
              <button onClick={() => setShowArchiveClassModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <p className="m-0">
                Apakah Anda yakin ingin mengarsip seluruh siswa di kelas pilihan ini? Status siswa akan diubah menjadi <span className="font-bold text-blue-600">LULUS</span> dan tagihan lama akan dibersihkan.
              </p>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowArchiveClassModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleArchiveClass}
                  disabled={archiving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-sm"
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
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-rose-200 dark:border-rose-900 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400 m-0">
                  Konfirmasi Hapus Semua Data Siswa
                </h3>
              </div>
              <button onClick={() => setShowClearAllModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleClearAllStudents} className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
              <p className="m-0 leading-relaxed">
                Ketikkan kata kunci di bawah ini untuk mengonfirmasi penghapusan permanen seluruh <span className="font-bold text-rose-600">{siswaCount} siswa</span>:
              </p>

              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl font-mono text-center font-bold text-rose-700 dark:text-rose-300 text-xs select-all">
                HAPUS SEMUA DATA SISWA
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Ketikkan teks konfirmasi:
                </label>
                <input
                  type="text"
                  required
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  placeholder="Ketik HAPUS SEMUA DATA SISWA"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-rose-300 dark:border-rose-800 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowClearAllModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={clearing || confirmInput !== 'HAPUS SEMUA DATA SISWA'}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md"
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
