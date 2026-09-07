'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Settings, Save, CheckCircle2, Download, MessageSquare } from 'lucide-react';

export default function PengaturanPage() {
  const [settings, setSettings] = useState<any>({
    namaSekolah: 'SMA Swasta Persiapan Stabat',
    npsn: '10201234',
    alamat: 'Jl. KH. Zainul Arifin No. 12, Stabat',
    telepon: '(061) 8912345',
    email: 'info@smapersiapan-stabat.sch.id',
    website: 'https://spp-smapersiapan.web.id',
    kepalaSekolah: 'Drs. H. Ahmad Dahlan, M.Pd',
    nipKepalaSekolah: '19680512 199303 1 004',
    bendahara: 'Siti Rahmah, S.Pd',
    nipBendahara: '19750820 200212 2 001',
    logo: '/logo_sisma.png',
    waApiUrl: 'https://api.whatsapp-gateway.com/send',
    waApiKey: 'DEMO_WA_API_KEY_SISMA',
  });

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch('/api/pengaturan')
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) setSettings(data.settings);
      })
      .catch((e) => console.error(e));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');

    try {
      const res = await fetch('/api/pengaturan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (res.ok) {
        setMsg('Pengaturan sistem berhasil diperbarui!');
        alert('Pengaturan sistem berhasil disimpan!');
      } else {
        throw new Error(data.error || 'Gagal menyimpan pengaturan');
      }
    } catch (e: any) {
      alert(e.message || 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(settings, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `SISMA_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white m-0">
              Pengaturan Sistem &amp; Identitas Sekolah
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
            Identitas sekolah, WhatsApp Gateway, &amp; Backup Database.
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 transition-all"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
        </button>
      </div>

      {msg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 rounded-2xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span className="font-semibold">{msg}</span>
        </div>
      )}

      {/* Form Grid */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Identitas Sekolah */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-700 pb-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white p-1 border border-slate-200 shadow-sm flex items-center justify-center">
              <Image src="/logo_sisma.png" alt="Logo" width={32} height={32} className="object-contain" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white m-0">
                1. Profil &amp; Identitas Sekolah
              </h2>
              <p className="text-xs text-slate-500 m-0">Tampil pada Kop Surat, Kwitansi, dan Laporan</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Nama Sekolah</label>
              <input
                type="text"
                value={settings.namaSekolah || ''}
                onChange={(e) => setSettings({ ...settings, namaSekolah: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">NPSN / NSSA</label>
              <input
                type="text"
                value={settings.npsn || ''}
                onChange={(e) => setSettings({ ...settings, npsn: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Alamat Lengkap</label>
              <input
                type="text"
                value={settings.alamat || ''}
                onChange={(e) => setSettings({ ...settings, alamat: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Nama Kepala Sekolah</label>
              <input
                type="text"
                value={settings.kepalaSekolah || ''}
                onChange={(e) => setSettings({ ...settings, kepalaSekolah: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Nama Bendahara Sekolah</label>
              <input
                type="text"
                value={settings.bendahara || ''}
                onChange={(e) => setSettings({ ...settings, bendahara: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Section 2: WhatsApp Gateway */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-700 pb-3 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white m-0">
              2. Integrasi WhatsApp Gateway (Billing Reminder &amp; Kwitansi)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">API Endpoint URL</label>
              <input
                type="text"
                value={settings.waApiUrl || ''}
                onChange={(e) => setSettings({ ...settings, waApiUrl: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">API Secret Key / Token</label>
              <input
                type="password"
                value={settings.waApiKey || ''}
                onChange={(e) => setSettings({ ...settings, waApiKey: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Database Backup */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white m-0">
            3. Utility Backup &amp; Restore Database
          </h2>
          <p className="text-xs text-slate-500 m-0">
            Unduh salinan cadangan data konfigurasi &amp; transaksi sekolah dalam format JSON.
          </p>

          <button
            type="button"
            onClick={handleDownloadBackup}
            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Download Backup JSON Database</span>
          </button>
        </div>
      </form>
    </div>
  );
}
