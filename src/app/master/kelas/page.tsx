'use client';

import React, { useState, useEffect } from 'react';
import { GraduationCap, Plus, Users, X, Upload, Download, FileSpreadsheet, Edit2, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function MasterKelasPage() {
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);

  const [showImportModal, setShowImportModal] = useState(false);
  const [namaKelas, setNamaKelas] = useState('');
  const [keterangan, setKeterangan] = useState('');

  // Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/master/kelas');
      const data = await res.json();
      setKelasList(data.kelasList || []);
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
    setEditItem(null);
    setNamaKelas('');
    setKeterangan('');
    setShowModal(true);
  };

  const openEditModal = (item: any) => {
    setEditItem(item);
    setNamaKelas(item.namaKelas);
    setKeterangan(item.keterangan || '');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaKelas) return;

    try {
      const url = '/api/master/kelas';
      const method = editItem ? 'PUT' : 'POST';
      const body = {
        id: editItem?.id,
        namaKelas,
        keterangan,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan kelas');

      setShowModal(false);
      setNamaKelas('');
      setKeterangan('');
      loadData();
      alert('Data kelas berhasil disimpan!');
    } catch (e: any) {
      alert(e.message || 'Terjadi kesalahan');
    }
  };

  const handleDelete = async (id: number, nama: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kelas '${nama}'?`)) return;

    try {
      const res = await fetch(`/api/master/kelas?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus kelas');

      loadData();
      alert('Kelas berhasil dihapus!');
    } catch (e: any) {
      alert(e.message || 'Terjadi kesalahan');
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Nama Kelas': 'X IPA 1',
        Keterangan: 'Kelas X MIPA Unggulan 1',
      },
      {
        'Nama Kelas': 'X IPA 2',
        Keterangan: 'Kelas X MIPA Unggulan 2',
      },
      {
        'Nama Kelas': 'XI SAINTEK I',
        Keterangan: 'Kelas XI Saintek 1',
      },
      {
        'Nama Kelas': 'XII IPS 1',
        Keterangan: 'Kelas XII Soshum 1',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Import Kelas');
    XLSX.writeFile(workbook, 'Template_Import_Kelas_SISMA.xlsx');
  };

  const handleImportExcel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return alert('Pilih file Excel terlebih dahulu!');

    setImporting(true);
    try {
      const dataBuffer = await importFile.arrayBuffer();
      const workbook = XLSX.read(dataBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const parsedData = XLSX.utils.sheet_to_json(worksheet);

      const res = await fetch('/api/master/kelas/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: parsedData }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Gagal mengimpor data kelas');

      alert(resData.message || 'Import data kelas berhasil!');
      setShowImportModal(false);
      setImportFile(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan saat membaca file Excel.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white m-0">
              Master Data Kelas (Cohorts)
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
            Kelola kelompok kelas siswa SMA Swasta Persiapan Stabat &amp; Impor Batch via Excel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>Import Excel Kelas</span>
          </button>

          <button
            onClick={openAddModal}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kelas Baru</span>
          </button>
        </div>
      </div>

      {/* Grid Class Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kelasList.map((k) => (
          <div
            key={k.id}
            className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-slate-900 dark:text-white">
                  {k.namaKelas}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>{k._count?.siswa || 0} Siswa</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
                {k.keterangan || 'Tidak ada deskripsi'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-700/60">
              <button
                onClick={() => openEditModal(k)}
                className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => handleDelete(k.id, k.namaKelas)}
                className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL 1: Tambah / Edit Kelas Manual */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white m-0">
                {editItem ? `Edit Kelas '${editItem.namaKelas}'` : 'Tambah Kelas Baru'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Kelas *
                </label>
                <input
                  type="text"
                  required
                  value={namaKelas}
                  onChange={(e) => setNamaKelas(e.target.value)}
                  placeholder="Misal: X IPA 1, XI IPS 2, XII SAINTEK"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Keterangan (Opsional)
                </label>
                <input
                  type="text"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Keterangan singkat kelas"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                />
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
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold"
                >
                  Simpan Kelas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Import Excel Kelas */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white m-0">
                  Import Batch Data Kelas Excel
                </h3>
              </div>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleImportExcel} className="space-y-4">
              <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center justify-between">
                <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  Belum punya template Excel Kelas?
                </span>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Template</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Pilih Berkas Excel (.xlsx / .xls)
                </label>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  required
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={importing}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  {importing ? 'Mengimpor...' : 'Proses Import Excel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
