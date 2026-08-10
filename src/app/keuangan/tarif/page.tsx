'use client';

import React, { useState, useEffect } from 'react';
import { DollarSign, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SettingTarifPage() {
  const [jenisList, setJenisList] = useState<any[]>([]);
  const [kelasList, setKelasList] = useState<any[]>([]);

  const [idJenis, setIdJenis] = useState('');
  const [idKelas, setIdKelas] = useState('');
  const [tarif, setTarif] = useState('125000');
  const [totalTagihan, setTotalTagihan] = useState('1500000');
  const [mode, setMode] = useState<'kelas' | 'siswa'>('kelas');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    Promise.all([fetch('/api/keuangan/jenis-bayar'), fetch('/api/master/kelas')])
      .then(async ([resJ, resK]) => {
        const dataJ = await resJ.json();
        const dataK = await resK.json();
        setJenisList(dataJ.jenisList || []);
        setKelasList(dataK.kelasList || []);
        if (dataJ.jenisList?.[0]) setIdJenis(dataJ.jenisList[0].id);
        if (dataK.kelasList?.[0]) setIdKelas(dataK.kelasList[0].id);
      })
      .catch((e) => console.error(e));
  }, []);

  const selectedJenisObj = jenisList.find((j) => j.id === parseInt(idJenis));

  const handleGenerateTarif = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/keuangan/tarif', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idJenisPembayaran: idJenis,
          idKelas,
          tarif,
          totalTagihan,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal');

      setMessage(data.message || 'Berhasil menetapkan tarif & membuat matriks tagihan!');
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
        <div className="flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-bold text-slate-900 dark:text-white m-0">
            Setting Tarif Pembayaran &amp; Generasi Tagihan
          </h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
          Tetapkan tarif SPP per kelas (generasi 12 bulan matriks otomatis) atau tarif bebas/beasiswa.
        </p>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{message}</span>
        </div>
      )}

      <form
        onSubmit={handleGenerateTarif}
        className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4"
      >
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            Pilih Jenis Pembayaran *
          </label>
          <select
            value={idJenis}
            onChange={(e) => setIdJenis(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-semibold"
          >
            {jenisList.map((j) => (
              <option key={j.id} value={j.id}>
                {j.posBayar?.namaPosBayar} ({j.tahunAjaran?.tahunAjaran}) - Tipe: {j.tipeBayar}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            Pilih Target Kelas Rombel *
          </label>
          <select
            value={idKelas}
            onChange={(e) => setIdKelas(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-semibold"
          >
            {kelasList.map((k) => (
              <option key={k.id} value={k.id}>
                {k.namaKelas} ({k._count?.siswa || 0} Siswa)
              </option>
            ))}
          </select>
        </div>

        {selectedJenisObj?.tipeBayar === 'bulanan' ? (
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Tarif SPP Bulanan Per Siswa (Rp) *
            </label>
            <input
              type="number"
              required
              value={tarif}
              onChange={(e) => setTarif(e.target.value)}
              placeholder="125000"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white"
            />
            <p className="text-[11px] text-slate-400 m-0 mt-1">
              Sistem akan otomatis membuat 12 record tagihan SPP (Juli s.d Juni) untuk seluruh siswa di kelas ini.
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Total Tagihan Bebas Per Siswa (Rp) *
            </label>
            <input
              type="number"
              required
              value={totalTagihan}
              onChange={(e) => setTotalTagihan(e.target.value)}
              placeholder="1500000"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white"
            />
          </div>
        )}

        <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Memproses Generasi Tarif...' : 'Simpan Tarif &amp; Generate Tagihan'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
