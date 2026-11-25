'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Settings,
  Save,
  CheckCircle2,
  Download,
  Upload,
  Database,
  MessageSquare,
  ShieldAlert,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

export default function PengaturanPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [settings, setSettings] = useState<any>({
    namaSekolah: 'SMA Swasta Persiapan Stabat',
    npsn: '10201322',
    alamat: 'JL. HIB Tembeleng, Kec. Stabat, Kab. Langkat',
    telepon: '(061) 8911118',
    email: 'info@smapersiapan-stabat.sch.id',
    website: 'https://spp-smapersiapan.web.id',
    kepalaSekolah: 'Irwan Amri, S.P',
    nipKepalaSekolah: '-',
    bendahara: 'Fairuza Rikha Amri, S.E, M.Si',
    nipBendahara: '-',
    logo: '/logo_sisma.png',
    waApiUrl: 'https://api.whatsapp-gateway.com/send',
    waApiKey: 'DEMO_WA_API_KEY_SISMA',
  });

  const [dbInfo, setDbInfo] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [downloadingDb, setDownloadingDb] = useState(false);
  const [restoringDb, setRestoringDb] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [msg, setMsg] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDbInfo = async () => {
    try {
      const res = await fetch('/api/pengaturan/backup?info=1');
      if (res.ok) {
        const data = await res.json();
        setDbInfo(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('sisma_user');
    let parsedUser: any = null;
    if (saved) {
      try {
        parsedUser = JSON.parse(saved);
        setCurrentUser(parsedUser);
      } catch (e) {
        console.error(e);
      }
    }
    setAuthChecked(true);

    if (parsedUser?.level === 'admin') {
      fetch('/api/pengaturan')
        .then((res) => res.json())
        .then((data) => {
          if (data.settings) setSettings(data.settings);
        })
        .catch((e) => console.error(e));

      loadDbInfo();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    setErrMsg('');

    try {
      const res = await fetch('/api/pengaturan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (res.ok) {
        setMsg('Pengaturan sistem berhasil diperbarui!');
      } else {
        throw new Error(data.error || 'Gagal menyimpan pengaturan');
      }
    } catch (e: any) {
      setErrMsg(e.message || 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadDbBackup = async () => {
    setDownloadingDb(true);
    setErrMsg('');
    try {
      const res = await fetch('/api/pengaturan/backup');
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Gagal mengunduh backup database');
      }
      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match ? match[1] : `SISMA_DB_Backup_${new Date().toISOString().slice(0, 10)}.db`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setMsg(`Backup database (${filename}) berhasil diunduh.`);
    } catch (e: any) {
      setErrMsg(e.message || 'Gagal mengunduh backup');
    } finally {
      setDownloadingDb(false);
    }
  };

  const handleRestoreDb = async () => {
    if (!restoreFile) return;
    if (
      !confirm(
        `PERINGATAN: Seluruh data saat ini akan digantikan dengan isi file "${restoreFile.name}".\n\nSistem otomatis menyimpan cadangan darurat (dev.db.bak) sebelum menimpa. Lanjutkan restore?`
      )
    ) {
      return;
    }

    setRestoringDb(true);
    setMsg('');
    setErrMsg('');
    try {
      const formData = new FormData();
      formData.append('file', restoreFile);

      const res = await fetch('/api/pengaturan/backup', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal melakukan restore database');
      }

      setMsg(
        `${data.message} (${data.counts?.siswa ?? 0} siswa, ${data.counts?.tagihanBulanan ?? 0} tagihan SPP)`
      );
      setRestoreFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadDbInfo();
    } catch (e: any) {
      setErrMsg(e.message || 'Gagal restore database');
    } finally {
      setRestoringDb(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (!authChecked) {
    return <div className="p-12 text-center text-xs text-slate-500">Memverifikasi hak akses...</div>;
  }

  if (currentUser?.level !== 'admin') {
    return (
      <div className="max-w-lg mx-auto mt-12 bg-white p-8 rounded-2xl border border-slate-200 shadow-premium text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h1 className="text-lg font-bold text-slate-900 m-0">Akses Terbatas (Admin Only)</h1>
          <p className="text-xs text-slate-500 m-0">
            Menu Pengaturan Sistem, Backup, dan Restore Database hanya dapat diakses oleh akun dengan level Administrator.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center px-5 py-2.5 bg-[#00677e] hover:bg-[#004e60] text-white rounded-lg text-xs font-semibold transition-all"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-premium flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#00677e]" />
            <h1 className="text-xl font-bold text-slate-900 m-0">
              Pengaturan Sistem &amp; Identitas Sekolah
            </h1>
          </div>
          <p className="text-xs text-slate-500 m-0 mt-0.5">
            Khusus Administrator: Identitas sekolah, WhatsApp Gateway, serta Backup &amp; Restore Database cepat.
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="bg-[#00677e] hover:bg-[#004e60] text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm flex items-center gap-2 transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
        </button>
      </div>

      {msg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{msg}</span>
        </div>
      )}

      {errMsg && (
        <div className="p-4 bg-[#ffdad6] border border-[#f5b8b2] rounded-xl text-xs text-[#93000a] flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-[#ba1a1a] shrink-0" />
          <span className="font-semibold">{errMsg}</span>
        </div>
      )}

      {/* Section 0: Fast Database Backup & Restore */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-premium space-y-5">
        <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#e6f6fc] text-[#00677e] border border-[#b5ebff] flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 m-0">
                Backup &amp; Restore Database Cepat (Full SQLite Snapshot)
              </h2>
              <p className="text-xs text-slate-500 m-0">
                Cadangkan atau pulihkan seluruh data siswa, tagihan, pembayaran, kas, dan pengguna dalam 1 klik.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadDbInfo}
            className="text-xs text-[#00677e] hover:underline font-semibold flex items-center gap-1 self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Status DB</span>
          </button>
        </div>

        {/* Live DB Stats Strip */}
        {dbInfo && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase block">Ukuran File DB</span>
              <span className="font-mono font-bold text-slate-800">{formatBytes(dbInfo.sizeBytes)}</span>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase block">Total Siswa</span>
              <span className="font-mono font-bold text-slate-800">{dbInfo.counts?.siswa ?? 0}</span>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase block">Tagihan Bulanan</span>
              <span className="font-mono font-bold text-slate-800">{dbInfo.counts?.tagihanBulanan ?? 0}</span>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase block">Transaksi Bayar</span>
              <span className="font-mono font-bold text-emerald-700">{dbInfo.counts?.pembayaranBulanan ?? 0}</span>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase block">Jurnal Kas</span>
              <span className="font-mono font-bold text-slate-800">{dbInfo.counts?.kas ?? 0}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Fast Backup Box */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-800 m-0">1. Download Full Backup (.db)</h3>
              <p className="text-[11px] text-slate-500 m-0 leading-relaxed">
                Mengunduh salinan utuh database SQLite aktif (semua 12 tabel) langsung ke komputer Anda.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadDbBackup}
              disabled={downloadingDb}
              className="w-full py-2.5 px-4 bg-[#00677e] hover:bg-[#004e60] disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>{downloadingDb ? 'Menyiapkan File .db...' : 'Backup Database Sekarang (.db)'}</span>
            </button>
          </div>

          {/* Fast Restore Box */}
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-800 m-0">2. Restore Database dari File (.db)</h3>
              <p className="text-[11px] text-slate-500 m-0 leading-relaxed">
                Pilih file backup <code className="text-slate-700 font-mono">.db</code>. Sistem otomatis membuat cadangan <code className="text-slate-700 font-mono">dev.db.bak</code> sebelum menimpa.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".db,.sqlite,.sqlite3"
                onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                className="flex-1 text-[11px] text-slate-600 file:mr-2.5 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-slate-300 file:text-xs file:font-semibold file:bg-white file:text-slate-700 hover:file:bg-slate-100 cursor-pointer"
              />
              <button
                type="button"
                onClick={handleRestoreDb}
                disabled={!restoreFile || restoringDb}
                className="py-2.5 px-4 bg-[#ba1a1a] hover:bg-[#93000a] disabled:opacity-40 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shrink-0 shadow-sm"
              >
                <Upload className="w-4 h-4" />
                <span>{restoringDb ? 'Memulihkan...' : 'Restore DB'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Form Grid */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Identitas Sekolah */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-premium space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-50 p-1 border border-slate-200 flex items-center justify-center">
              <Image src="/logo_sisma.png" alt="Logo" width={32} height={32} className="object-contain" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 m-0">
                1. Profil &amp; Identitas Sekolah
              </h2>
              <p className="text-xs text-slate-500 m-0">Tampil pada Kop Surat, Kwitansi, dan Laporan</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Sekolah</label>
              <input
                type="text"
                value={settings.namaSekolah || ''}
                onChange={(e) => setSettings({ ...settings, namaSekolah: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-[#00677e]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">NPSN / NSSA</label>
              <input
                type="text"
                value={settings.npsn || ''}
                onChange={(e) => setSettings({ ...settings, npsn: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-mono focus:outline-none focus:bg-white focus:border-[#00677e]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Alamat Lengkap</label>
              <input
                type="text"
                value={settings.alamat || ''}
                onChange={(e) => setSettings({ ...settings, alamat: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-[#00677e]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Kepala Sekolah</label>
              <input
                type="text"
                value={settings.kepalaSekolah || ''}
                onChange={(e) => setSettings({ ...settings, kepalaSekolah: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-[#00677e]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Bendahara Sekolah</label>
              <input
                type="text"
                value={settings.bendahara || ''}
                onChange={(e) => setSettings({ ...settings, bendahara: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-[#00677e]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: WhatsApp Gateway */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-premium space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 m-0">
              2. Integrasi WhatsApp Gateway (Billing Reminder &amp; Kwitansi)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">API Endpoint URL</label>
              <input
                type="text"
                value={settings.waApiUrl || ''}
                onChange={(e) => setSettings({ ...settings, waApiUrl: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-mono focus:outline-none focus:bg-white focus:border-[#00677e]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">API Secret Key / Token</label>
              <input
                type="password"
                value={settings.waApiKey || ''}
                onChange={(e) => setSettings({ ...settings, waApiKey: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-mono focus:outline-none focus:bg-white focus:border-[#00677e]"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
