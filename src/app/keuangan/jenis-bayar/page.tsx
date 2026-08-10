'use client';

import React, { useState, useEffect } from 'react';
import { Receipt, Plus, X } from 'lucide-react';

export default function JenisBayarPage() {
  const [jenisList, setJenisList] = useState<any[]>([]);
  const [posList, setPosList] = useState<any[]>([]);
  const [taList, setTaList] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);

  const [idPosBayar, setIdPosBayar] = useState('');
  const [idTahunAjaran, setIdTahunAjaran] = useState('');
  const [tipeBayar, setTipeBayar] = useState('bulanan');

  const loadData = async () => {
    try {
      const [resJ, resP, resT] = await Promise.all([
        fetch('/api/keuangan/jenis-bayar'),
        fetch('/api/keuangan/pos-bayar'),
        fetch('/api/master/tahun-ajaran'),
      ]);
      const dataJ = await resJ.json();
      const dataP = await resP.json();
      const dataT = await resT.json();
      setJenisList(dataJ.jenisList || []);
      setPosList(dataP.posList || []);
      setTaList(dataT.tahunAjaranList || []);

      if (dataP.posList?.[0]) setIdPosBayar(dataP.posList[0].id);
      const activeTa = dataT.tahunAjaranList?.find((t: any) => t.status === 'AKTIF');
      if (activeTa) setIdTahunAjaran(activeTa.id);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/keuangan/jenis-bayar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idPosBayar, idTahunAjaran, tipeBayar }),
      });
      if (res.ok) {
        setShowModal(false);
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white m-0">
              Jenis Pembayaran (Tipe Tagihan Per Tahun)
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
            Mapping antara Pos Bayar, Tahun Ajaran, dan Tipe (Bulanan vs Bebas Flexible).
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Setting Jenis Pembayaran</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {jenisList.map((j) => (
          <div
            key={j.id}
            className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-slate-900 dark:text-white">
                {j.posBayar?.namaPosBayar}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  j.tipeBayar === 'bulanan'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                    : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                }`}
              >
                {j.tipeBayar}
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
              Tahun Ajaran: <span className="font-semibold text-slate-700 dark:text-slate-300">{j.tahunAjaran?.tahunAjaran}</span>
            </p>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white m-0">Setting Jenis Pembayaran</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Pos Bayar *</label>
                <select
                  value={idPosBayar}
                  onChange={(e) => setIdPosBayar(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                >
                  {posList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.namaPosBayar}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Tahun Ajaran *</label>
                <select
                  value={idTahunAjaran}
                  onChange={(e) => setIdTahunAjaran(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                >
                  {taList.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.tahunAjaran} {t.status === 'AKTIF' ? '(Aktif)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Tipe Pembayaran *</label>
                <select
                  value={tipeBayar}
                  onChange={(e) => setTipeBayar(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                >
                  <option value="bulanan">Bulanan (SPP 12 Bulan Matrix)</option>
                  <option value="bebas">Bebas (Non-Recurring / Flexible Installment)</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Simpan Jenis Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
