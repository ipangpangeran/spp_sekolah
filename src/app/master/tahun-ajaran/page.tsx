'use client';

import React, { useState, useEffect } from 'react';
import { Award, Plus, CheckCircle2, X } from 'lucide-react';

export default function MasterTahunAjaranPage() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [tahun, setTahun] = useState('');
  const [setAktif, setSetAktif] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/master/tahun-ajaran');
      const data = await res.json();
      setList(data.tahunAjaranList || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tahun) return;

    try {
      const res = await fetch('/api/master/tahun-ajaran', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tahunAjaran: tahun, setAktif }),
      });

      if (res.ok) {
        setShowModal(false);
        setTahun('');
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSetActive = async (id: number) => {
    try {
      const res = await fetch('/api/master/tahun-ajaran', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) loadData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white m-0">
              Master Tahun Ajaran
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
            Hanya ada 1 Tahun Ajaran yang AKTIF sebagai konteks penagihan SPP.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Tahun Ajaran</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {list.map((item) => (
          <div
            key={item.id}
            className={`p-5 rounded-2xl border shadow-sm space-y-3 ${
              item.status === 'AKTIF'
                ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-500'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                {item.tahunAjaran}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  item.status === 'AKTIF'
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                }`}
              >
                {item.status}
              </span>
            </div>

            {item.status !== 'AKTIF' && (
              <button
                onClick={() => handleSetActive(item.id)}
                className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm"
              >
                Set Sebagai Tahun Ajaran Aktif
              </button>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white m-0">Tambah Tahun Ajaran</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Tahun Ajaran *</label>
                <input
                  type="text"
                  required
                  value={tahun}
                  onChange={(e) => setTahun(e.target.value)}
                  placeholder="misal: 2027/2028"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="setAktifCheck"
                  checked={setAktif}
                  onChange={(e) => setSetAktif(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <label htmlFor="setAktifCheck" className="text-xs text-slate-700 dark:text-slate-300">
                  Langsung aktifkan tahun ajaran ini
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Simpan Tahun Ajaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
