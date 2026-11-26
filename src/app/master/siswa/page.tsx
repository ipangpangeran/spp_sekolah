'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  FileSpreadsheet,
  Upload,
  Edit2,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import * as XLSX from 'xlsx';

const PAGE_SIZE = 10;

export default function MasterSiswaPage() {
  const [siswaList, setSiswaList] = useState<any[]>([]);
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const [formNis, setFormNis] = useState('');
  const [formNisn, setFormNisn] = useState('');
  const [formNama, setFormNama] = useState('');
  const [formGender, setFormGender] = useState('L');
  const [formKelas, setFormKelas] = useState('');
  const [formHpOrtu, setFormHpOrtu] = useState('');
  const [formStatus, setFormStatus] = useState('AKTIF');

  useEffect(() => {
    const savedUser = localStorage.getItem('sisma_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resS, resK] = await Promise.all([
        fetch(`/api/master/siswa?search=${encodeURIComponent(search)}&idKelas=${selectedClass}&statusSiswa=${selectedStatus}`),
        fetch('/api/master/kelas'),
      ]);
      const dataS = await resS.json();
      const dataK = await resK.json();
      setSiswaList(dataS.siswaList || []);
      setKelasList(dataK.kelasList || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    loadData();
  }, [search, selectedClass, selectedStatus]);

  const sortedSiswa = useMemo(() => {
    return [...siswaList].sort((a, b) =>
      String(a.namaSiswa || '').localeCompare(String(b.namaSiswa || ''), 'id', {
        sensitivity: 'base',
      })
    );
  }, [siswaList]);

  const totalItems = sortedSiswa.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const paginatedSiswa = sortedSiswa.slice(startIndex, startIndex + PAGE_SIZE);

  const pageNumbers = useMemo(() => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    if (safePage > 3) pages.push('ellipsis');
    const start = Math.max(2, safePage - 1);
    const end = Math.min(totalPages - 1, safePage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (safePage < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
    return pages;
  }, [totalPages, safePage]);

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = '/api/master/siswa';
      const method = editItem ? 'PUT' : 'POST';
      const body = {
        id: editItem?.id,
        nis: formNis,
        nisn: formNisn,
        namaSiswa: formNama,
        jenisKelamin: formGender,
        idKelas: formKelas,
        hpOrtu: formHpOrtu,
        statusSiswa: formStatus,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan');

      setShowAddModal(false);
      resetForm();
      loadData();
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan');
    }
  };

  const handleDeleteStudent = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data siswa ini?')) return;
    try {
      const res = await fetch(`/api/master/siswa?id=${id}`, { method: 'DELETE' });
      if (res.ok) loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setEditItem(null);
    setFormNis('');
    setFormNisn('');
    setFormNama('');
    setFormGender('L');
    setFormKelas(kelasList[0]?.id || '');
    setFormHpOrtu('');
    setFormStatus('AKTIF');
  };

  const openEditModal = (item: any) => {
    setEditItem(item);
    setFormNis(item.nis || '');
    setFormNisn(item.nisn || '');
    setFormNama(item.namaSiswa);
    setFormGender(item.jenisKelamin);
    setFormKelas(item.idKelas);
    setFormHpOrtu(item.hpOrtu || '');
    setFormStatus(item.statusSiswa);
    setShowAddModal(true);
  };

  const handleExportExcel = () => {
    const exportData = siswaList.map((s) => ({
      NIS: s.nis || '-',
      NISN: s.nisn || '-',
      'Nama Siswa': s.namaSiswa,
      Kelas: s.kelas?.namaKelas || '-',
      'Jenis Kelamin': s.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan',
      'HP Ortu': s.hpOrtu || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Siswa');
    XLSX.writeFile(workbook, 'Data_Siswa_SMA_Persiapan_Stabat.xlsx');
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        NIS: '14823',
        NISN: '0061234599',
        'Nama Siswa': 'FADLI RAHMAN',
        Kelas: 'X IPA 1',
        'Jenis Kelamin': 'L',
        'HP Ortu': '081263547890',
      },
      {
        NIS: '14824',
        NISN: '0061234598',
        'Nama Siswa': 'SARAH MAULIDA',
        Kelas: 'XI SAINTEK I',
        'Jenis Kelamin': 'P',
        'HP Ortu': '081398765432',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Import');
    XLSX.writeFile(workbook, 'Template_Import_Siswa_SISMA.xlsx');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet);

      const parsedStudents = rawRows.map((r) => ({
        nis: r['NIS'] || r['nis'] || r['Nis'],
        nisn: r['NISN'] || r['nisn'] || r['Nisn'],
        namaSiswa: r['Nama Siswa'] || r['nama_siswa'] || r['Nama'] || r['NAMA'],
        namaKelas: r['Kelas'] || r['kelas'] || r['Nama Kelas'] || r['KELAS'],
        jenisKelamin: r['Jenis Kelamin'] || r['jenis_kelamin'] || r['Gender'] || r['L/P'],
        hpOrtu: r['HP Ortu'] || r['hp_ortu'] || r['No HP'] || r['WA'] || r['HP ORTU'],
      }));

      const res = await fetch('/api/master/siswa/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: parsedStudents }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Gagal mengimpor data');

      alert(resData.message || 'Import data siswa berhasil!');
      setShowImportModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan saat membaca file Excel.');
    } finally {
      setImporting(false);
    }
  };

  const isSuperAdmin = currentUser?.level === 'admin';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="bg-card p-5 rounded-2xl border border-line shadow-[0_1px_2px_rgba(15,23,42,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-brand" />
            <h1 className="text-xl font-bold text-slate-800 m-0">
              Direktori &amp; Master Data Siswa
            </h1>
          </div>
          <p className="text-xs text-slate-500 m-0 mt-0.5">
            Kelola data induk siswa.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="bg-brand hover:bg-brand-hover text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Siswa</span>
          </button>

          {isSuperAdmin && (
            <button
              onClick={() => setShowImportModal(true)}
              className="bg-subtle hover:bg-[#e2e8f2] border border-line text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all"
            >
              <Upload className="w-4 h-4 text-sage" />
              <span>Import Excel (Super Admin)</span>
            </button>
          )}

          <button
            onClick={handleExportExcel}
            className="bg-subtle hover:bg-[#e2e8f2] border border-line text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-sage" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-card p-4 rounded-xl border border-line shadow-[0_1px_2px_rgba(15,23,42,0.03)] grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari NIS, NISN, Nama Siswa..."
            className="w-full pl-9 pr-3 py-2 bg-subtle border border-line rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-card focus:border-brand"
          />
        </div>

        <div>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full py-2 px-3 bg-subtle border border-line rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-card focus:border-brand"
          >
            <option value="">Semua Kelas</option>
            {kelasList.map((k) => (
              <option key={k.id} value={k.id}>
                {k.namaKelas} ({k._count?.siswa || 0} siswa)
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full py-2 px-3 bg-subtle border border-line rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-card focus:border-brand"
          >
            <option value="">Semua Status Siswa</option>
            <option value="AKTIF">AKTIF</option>
            <option value="LULUS">LULUS / ALUMNI</option>
            <option value="PINDAH">PINDAH</option>
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-card rounded-2xl border border-line shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-subtle text-slate-600 font-semibold border-b border-line">
              <tr>
                <th className="p-3">NIS / NISN</th>
                <th className="p-3">Nama Siswa</th>
                <th className="p-3">Kelas Rombel</th>
                <th className="p-3">L/P</th>
                <th className="p-3">No. HP Ortu / WA</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">Memuat direktori siswa...</td>
                </tr>
              ) : paginatedSiswa.length > 0 ? (
                paginatedSiswa.map((s) => (
                  <tr key={s.id} className="hover:bg-subtle/70 transition-colors">
                    <td className="p-3 font-mono font-semibold">
                      <span className="text-brand">{s.nis || '-'}</span>
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {s.nisn || '-'}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-slate-800">
                      {s.namaSiswa}
                    </td>
                    <td className="p-3 font-semibold text-slate-600">
                      {s.kelas?.namaKelas || '-'}
                    </td>
                    <td className="p-3 font-semibold">{s.jenisKelamin}</td>
                    <td className="p-3 font-mono text-sage font-semibold">
                      {s.hpOrtu || '-'}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${s.statusSiswa === 'AKTIF'
                          ? 'bg-sage-soft text-sage-text border-sage-border'
                          : 'bg-subtle text-slate-600 border-line'
                          }`}
                      >
                        {s.statusSiswa}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1">
                      <button
                        onClick={() => openEditModal(s)}
                        className="p-1.5 rounded-lg bg-brand-soft text-brand hover:bg-brand-border/50 transition-colors"
                        title="Edit Profil"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(s.id)}
                        className="p-1.5 rounded-lg bg-brick-soft text-brick hover:bg-brick-border/50 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Tidak ada siswa ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!loading && totalItems > 0 && (
          <div className="px-4 py-3 border-t border-line bg-subtle/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <p className="text-slate-600 m-0">
              Menampilkan{' '}
              <span className="font-semibold text-slate-800">{startIndex + 1}</span>
              {'–'}
              <span className="font-semibold text-slate-800">
                {Math.min(startIndex + PAGE_SIZE, totalItems)}
              </span>{' '}
              dari <span className="font-semibold text-slate-800">{totalItems}</span> siswa (urut A–Z)
            </p>

            <div className="flex items-center gap-1 flex-wrap">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="px-2.5 py-1.5 rounded-lg border border-line bg-card text-slate-700 hover:bg-subtle disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-medium transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              {pageNumbers.map((item, idx) =>
                item === 'ellipsis' ? (
                  <span key={`e-${idx}`} className="px-2 py-1 text-slate-400">
                    ...
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCurrentPage(item)}
                    className={`min-w-[30px] h-[30px] px-2 rounded-lg text-xs font-semibold transition-colors ${item === safePage
                      ? 'bg-[#00677e] text-white border border-[#00677e]'
                      : 'bg-card text-slate-700 border border-line hover:bg-subtle'
                      }`}
                  >
                    {item}
                  </button>
                )
              )}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="px-2.5 py-1.5 rounded-lg border border-line bg-card text-slate-700 hover:bg-subtle disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-medium transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Add / Edit Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-700/35 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-xl border border-line max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-sm font-bold text-slate-800 m-0">
                {editItem ? 'Edit Profile Siswa' : 'Tambah Siswa Baru'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">NIS (Opsional)</label>
                  <input
                    type="text"
                    value={formNis}
                    onChange={(e) => setFormNis(e.target.value)}
                    placeholder="misal: 14813"
                    className="w-full px-3 py-2 bg-subtle border border-line rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:bg-card focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">NISN</label>
                  <input
                    type="text"
                    value={formNisn}
                    onChange={(e) => setFormNisn(e.target.value)}
                    placeholder="misal: 0061234501"
                    className="w-full px-3 py-2 bg-subtle border border-line rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:bg-card focus:border-brand"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Lengkap Siswa *</label>
                <input
                  type="text"
                  required
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="misal: ABDUL RAHIM"
                  className="w-full px-3 py-2 bg-subtle border border-line rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-card focus:border-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Kelas Rombel *</label>
                  <select
                    required
                    value={formKelas}
                    onChange={(e) => setFormKelas(e.target.value)}
                    className="w-full px-3 py-2 bg-subtle border border-line rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-card focus:border-brand"
                  >
                    {kelasList.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.namaKelas}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Jenis Kelamin</label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value)}
                    className="w-full px-3 py-2 bg-subtle border border-line rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-card focus:border-brand"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">No. HP Ortu (WA)</label>
                  <input
                    type="text"
                    value={formHpOrtu}
                    onChange={(e) => setFormHpOrtu(e.target.value)}
                    placeholder="081263547890"
                    className="w-full px-3 py-2 bg-subtle border border-line rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:bg-card focus:border-brand"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Status Siswa</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-subtle border border-line rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-card focus:border-brand"
                  >
                    <option value="AKTIF">AKTIF</option>
                    <option value="LULUS">LULUS</option>
                    <option value="PINDAH">PINDAH</option>
                    <option value="ALUMNI">ALUMNI</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Simpan Data Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Excel Import Modal */}
      {showImportModal && isSuperAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-700/35 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-xl border border-line max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-sm font-bold text-slate-800 m-0">
                Batch Import Data Siswa (Super Admin)
              </h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-brand-soft border border-brand-border rounded-xl space-y-1">
                <p className="font-bold text-brand-text m-0">Format Kolom Excel (`.xlsx`):</p>
                <p className="font-mono text-brand text-[11px] m-0">
                  NIS | NISN | Nama Siswa | Kelas | Jenis Kelamin | HP Ortu
                </p>
              </div>

              <button
                onClick={handleDownloadTemplate}
                className="w-full py-2 bg-subtle hover:bg-[#e2e8f2] border border-line text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <FileSpreadsheet className="w-4 h-4 text-sage" />
                <span>Unduh Sample Template Excel (.xlsx)</span>
              </button>

              <div className="p-6 border-2 border-dashed border-line-strong bg-subtle/50 rounded-xl text-center space-y-3">
                <Upload className="w-8 h-8 text-brand mx-auto" />
                <p className="text-xs font-medium text-slate-600">
                  {importing ? 'Membaca & Memproses Excel...' : 'Pilih file .xlsx dari komputer Anda'}
                </p>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileUpload}
                  disabled={importing}
                  className="hidden"
                  id="excelUploadInput"
                />
                <label
                  htmlFor="excelUploadInput"
                  className="inline-block px-4 py-2 bg-sage hover:bg-sage-hover text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm"
                >
                  Pilih &amp; Import File .xlsx
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
