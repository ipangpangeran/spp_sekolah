'use client';

import React, { useState, useEffect } from 'react';
import { DollarSign, CheckCircle2 } from 'lucide-react';

export default function SettingTarifPage() {
  const [jenisList, setJenisList] = useState<any[]>([]);
  const [kelasList, setKelasList] = useState<any[]>([]);

  const [idJenis, setIdJenis] = useState('');
  const [idKelas, setIdKelas] = useState('');
  const [tarif, setTarif] = useState('125000');
  const [totalTagihan, setTotalTagihan] = useState('1500000');

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
      <div className="bg-card p-6 rounded-2xl border border-line shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-1.5">
        <div className="flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-brand" />
          <h1 className="text-xl font-bold text-slate-800 m-0">
            Setting Tarif Pembayaran &amp; Generasi Tagihan
          </h1>
        </div>
        <p className="text-xs text-slate-500 m-0">
          Tetapkan tarif SPP per kelas (generasi 12 bulan matriks otomatis) atau tarif bebas/beasiswa.
        </p>
      </div>

      {message && (
        <div className="p-4 bg-sage-soft border border-sage-border rounded-2xl text-xs text-sage-text flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-sage shrink-0" />
          <span className="font-semibold">{message}</span>
        </div>
      )}

      <form
        onSubmit={handleGenerateTarif}
        className="bg-card p-6 rounded-2xl border border-line shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-4"
      >
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Pilih Jenis Pembayaran *
          </label>
          <select
            value={idJenis}
            onChange={(e) => setIdJenis(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-subtle border border-line rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:bg-card focus:border-brand"
          >
            {jenisList.map((j) => (
              <option key={j.id} value={j.id}>
                {j.posBayar?.namaPosBayar} ({j.tahunAjaran?.tahunAjaran}) - Tipe: {j.tipeBayar}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Pilih Target Kelas Rombel *
          </label>
          <select
            value={idKelas}
            onChange={(e) => setIdKelas(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-subtle border border-line rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:bg-card focus:border-brand"
          >
            <option value="all">-- SEMUA KELAS (Terapkan ke Seluruh Siswa Rombel) --</option>
            {kelasList.map((k) => (
              <option key={k.id} value={k.id}>
                {k.namaKelas} ({k._count?.siswa || 0} Siswa)
              </option>
            ))}
          </select>
        </div>

        {selectedJenisObj?.tipeBayar === 'bulanan' ? (
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Tarif SPP Bulanan Per Siswa (Rp) *
            </label>
            <input
              type="number"
              required
              value={tarif}
              onChange={(e) => setTarif(e.target.value)}
              placeholder="125000"
              className="w-full px-3.5 py-2.5 bg-subtle border border-line rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:bg-card focus:border-brand"
            />
            <p className="text-[11px] text-slate-500 m-0 mt-1">
              Sistem akan otomatis membuat/memperbarui 12 record tagihan SPP (Juli s.d Juni) untuk seluruh siswa di target kelas.
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Total Tagihan Bebas Per Siswa (Rp) *
            </label>
            <input
              type="number"
              required
              value={totalTagihan}
              onChange={(e) => setTotalTagihan(e.target.value)}
              placeholder="1500000"
              className="w-full px-3.5 py-2.5 bg-subtle border border-line rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:bg-card focus:border-brand"
            />
          </div>
        )}

        <div className="pt-3 border-t border-line">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Memproses Generasi Tarif...' : 'Simpan Tarif & Generate Tagihan'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
