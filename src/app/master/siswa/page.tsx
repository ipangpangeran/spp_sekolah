'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  FileSpreadsheet,
  Upload,
  GraduationCap,
  Award,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Filter,
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function MasterSiswaPage() {
  const [siswaList, setSiswaList] = useState<any[]>([]);
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  // Form State
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
    loadData();
  }, [search, selectedClass, selectedStatus]);

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
    setFormNis(item.nis);
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
      NIS: s.nis,
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
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white m-0">
              Direktori &amp; Master Data Siswa
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
            Kelola data induk siswa, impor batch Excel (Super Admin), serta cetak direktori.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Siswa</span>
          </button>

          {/* Import Button ONLY visible for Super Admin */}
          {isSuperAdmin && (
            <button
              onClick={() => setShowImportModal(true)}
              className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all"
            >
              <Upload className="w-4 h-4 text-emerald-600" />
              <span>Import Excel (Super Admin)</span>
            </button>
          )}

          <button
            onClick={handleExportExcel}
            className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari NIS, NISN, Nama Siswa..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
          />
        </div>

        <div>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
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
            className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="">Semua Status Siswa</option>
            <option value="AKTIF">AKTIF</option>
            <option value="LULUS">LULUS / ALUMNI</option>
            <option value="PINDAH">PINDAH</option>
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
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
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-800 dark:text-slate-200">
              {siswaList.length > 0 ? (
                siswaList.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="p-3 font-mono font-semibold">
                      <span className="text-blue-600 dark:text-blue-400">{s.nis}</span>
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {s.nisn || '-'}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white">
                      {s.namaSiswa}
                    </td>
                    <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">
                      {s.kelas?.namaKelas || '-'}
                    </td>
                    <td className="p-3 font-semibold">{s.jenisKelamin}</td>
                    <td className="p-3 font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      {s.hpOrtu || '-'}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.statusSiswa === 'AKTIF'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {s.statusSiswa}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1">
                      <button
                        onClick={() => openEditModal(s)}
                        className="p-1.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300 transition-colors"
                        title="Edit Profil"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(s.id)}
                        className="p-1.5 rounded bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/40 dark:text-rose-300 transition-colors"
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
      </div>

      {/* MODAL 1: Add / Edit Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white m-0">
                {editItem ? 'Edit Profile Siswa' : 'Tambah Siswa Baru'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">NIS *</label>
                  <input
                    type="text"
                    required
                    value={formNis}
                    onChange={(e) => setFormNis(e.target.value)}
                    placeholder="misal: 14813"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">NISN</label>
                  <input
                    type="text"
                    value={formNisn}
                    onChange={(e) => setFormNisn(e.target.value)}
                    placeholder="misal: 0061234501"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Nama Lengkap Siswa *</label>
                <input
                  type="text"
                  required
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="misal: ABDUL RAHIM"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Kelas Rombel *</label>
                  <select
                    required
                    value={formKelas}
                    onChange={(e) => setFormKelas(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                  >
                    {kelasList.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.namaKelas}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Jenis Kelamin</label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">No. HP Ortu (WA)</label>
                  <input
                    type="text"
                    value={formHpOrtu}
                    onChange={(e) => setFormHpOrtu(e.target.value)}
                    placeholder="081263547890"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Status Siswa</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
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
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Simpan Data Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Excel Import Modal (Super Admin Only) */}
      {showImportModal && isSuperAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white m-0">
                Batch Import Data Siswa (Super Admin)
              </h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl space-y-1">
                <p className="font-bold text-blue-900 dark:text-blue-300 m-0">Format Kolom Excel (`.xlsx`):</p>
                <p className="font-mono text-blue-700 dark:text-blue-400 text-[11px] m-0">
                  NIS | NISN | Nama Siswa | Kelas | Jenis Kelamin | HP Ortu
                </p>
              </div>

              <button
                onClick={handleDownloadTemplate}
                className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Unduh Sample Template Excel (.xlsx)</span>
              </button>

              <div className="p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-center space-y-3">
                <Upload className="w-8 h-8 text-blue-500 mx-auto" />
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {importing ? 'Membaca & Memproses Excel...' : 'Pilih file `.xlsx` dari komputer Anda'}
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
                  className="inline-block px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm"
                >
                  Pilih &amp; Import File `.xlsx`
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
