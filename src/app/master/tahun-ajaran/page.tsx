'use client';

import React, { useState, useEffect } from 'react';
import { Award, Plus, X } from 'lucide-react';

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
      <div className="bg-card p-5 rounded-2xl border border-line shadow-[0_1px_2px_rgba(15,23,42,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-brand" />
            <h1 className="text-xl font-bold text-slate-800 m-0">
              Master Tahun Ajaran
            </h1>
          </div>
          <p className="text-xs text-slate-500 m-0 mt-0.5">
            Hanya ada 1 Tahun Ajaran yang AKTIF sebagai konteks penagihan SPP.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-brand hover:bg-brand-hover text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Tahun Ajaran</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full p-8 text-center text-xs text-slate-500">Memuat tahun ajaran...</div>
        ) : (
          list.map((item) => (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-3 ${
                item.status === 'AKTIF'
                  ? 'bg-brand-soft/60 border-brand-border'
                  : 'bg-card border-line'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-slate-800">
                  {item.tahunAjaran}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    item.status === 'AKTIF'
                      ? 'bg-sage-soft text-sage-text border-sage-border'
                      : 'bg-subtle text-slate-500 border-line'
                  }`}
                >
                  {item.status}
                </span>
              </div>

              {item.status !== 'AKTIF' && (
                <button
                  onClick={() => handleSetActive(item.id)}
                  className="w-full py-1.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  Set Sebagai Tahun Ajaran Aktif
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-700/35 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-xl border border-line max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-sm font-bold text-slate-800 m-0">Tambah Tahun Ajaran</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tahun Ajaran *</label>
                <input
                  type="text"
                  required
                  value={tahun}
                  onChange={(e) => setTahun(e.target.value)}
                  placeholder="misal: 2027/2028"
                  className="w-full px-3 py-2 bg-subtle border border-line rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:bg-card focus:border-brand"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="setAktifCheck"
                  checked={setAktif}
                  onChange={(e) => setSetAktif(e.target.checked)}
                  className="rounded text-brand"
                />
                <label htmlFor="setAktifCheck" className="text-xs text-slate-700">
                  Langsung aktifkan tahun ajaran ini
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold shadow-sm"
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
