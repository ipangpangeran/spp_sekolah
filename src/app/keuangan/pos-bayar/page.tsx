'use client';

import React, { useState, useEffect } from 'react';
import { Layers, Plus, X } from 'lucide-react';

export default function PosBayarPage() {
  const [posList, setPosList] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [namaPosBayar, setNamaPosBayar] = useState('');
  const [keterangan, setKeterangan] = useState('');

  const loadData = async () => {
    try {
      const res = await fetch('/api/keuangan/pos-bayar');
      const data = await res.json();
      setPosList(data.posList || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaPosBayar) return;

    try {
      const res = await fetch('/api/keuangan/pos-bayar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ namaPosBayar, keterangan }),
      });

      if (res.ok) {
        setShowModal(false);
        setNamaPosBayar('');
        setKeterangan('');
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
            <Layers className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white m-0">
              Pos Bayar (Kategori Biaya Sekolah)
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
            Definisi pos penerimaan keuangan seperti SPP, Uang Pembangunan, Seragam, dan Uang Ujian.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pos Bayar</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {posList.map((p) => (
          <div
            key={p.id}
            className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2"
          >
            <h3 className="text-base font-bold text-slate-900 dark:text-white m-0">
              {p.namaPosBayar}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
              {p.keterangan || 'Tidak ada keterangan tambahan.'}
            </p>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white m-0">Tambah Pos Bayar</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Nama Pos Bayar *</label>
                <input
                  type="text"
                  required
                  value={namaPosBayar}
                  onChange={(e) => setNamaPosBayar(e.target.value)}
                  placeholder="misal: SPP Bulanan"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Keterangan</label>
                <input
                  type="text"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="misal: Sumbangan Pembinaan Pendidikan"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Simpan Pos Bayar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
