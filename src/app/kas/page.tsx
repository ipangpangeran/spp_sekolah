'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, ArrowDownRight, Wallet, CheckCircle2 } from 'lucide-react';

export default function KasPemasukanPage() {
  const [kasList, setKasList] = useState<any[]>([]);
  const [posList, setPosList] = useState<any[]>([]);
  const [saldo, setSaldo] = useState({ totalPemasukan: 0 });
  const [loading, setLoading] = useState(true);

  // Dynamic Multi-Row Input Form for Incoming Funds
  const [rows, setRows] = useState([
    { uraian: '', pemasukan: '', idPosBayar: '' },
  ]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resK, resP] = await Promise.all([
        fetch('/api/kas'),
        fetch('/api/keuangan/pos-bayar'),
      ]);
      const dataK = await resK.json();
      const dataP = await resP.json();
      setKasList(dataK.kasList || []);
      setPosList(dataP.posList || []);
      setSaldo({
        totalPemasukan: dataK.totalPemasukan || 0,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addRow = () => {
    setRows([...rows, { uraian: '', pemasukan: '', idPosBayar: '' }]);
  };

  const removeRow = (idx: number) => {
    if (rows.length === 1) return;
    setRows(rows.filter((_, i) => i !== idx));
  };

  const updateRow = (idx: number, field: string, value: any) => {
    const newRows = [...rows];
    (newRows[idx] as any)[field] = value;
    setRows(newRows);
  };

  const handleSubmitJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    const items = rows
      .filter((r) => r.uraian.trim())
      .map((r) => ({
        uraian: r.uraian,
        pemasukan: parseFloat(r.pemasukan) || 0,
        jenis: 'masuk' as const,
        idPosBayar: r.idPosBayar ? parseInt(r.idPosBayar) : null,
      }));

    if (items.length === 0) return;

    try {
      const res = await fetch('/api/kas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      if (res.ok) {
        setRows([{ uraian: '', pemasukan: '', idPosBayar: '' }]);
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatRp = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Summary Banner */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-500">Total Akumulasi Kas Pemasukan</span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono-data">
            {formatRp(saldo.totalPemasukan)}
          </div>
        </div>
        <Wallet className="w-10 h-10 text-emerald-500/30" />
      </div>

      {/* Multi-Row Form Input */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white m-0">
              Form Input Jurnal Pemasukan Kas Sekolah
            </h2>
          </div>
          <button
            type="button"
            onClick={addRow}
            className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            <span>Baris Pemasukan Baru</span>
          </button>
        </div>

        <form onSubmit={handleSubmitJournal} className="space-y-3">
          {rows.map((row, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="text"
                required
                value={row.uraian}
                onChange={(e) => updateRow(idx, 'uraian', e.target.value)}
                placeholder={`Uraian Pemasukan ${idx + 1} (misal: Pembelian Baju Olahraga, Buku Paket, Seragam)`}
                className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
              />
              <select
                value={row.idPosBayar}
                onChange={(e) => updateRow(idx, 'idPosBayar', e.target.value)}
                className="w-full sm:w-44 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
              >
                <option value="">Pos Bayar (Opsional)</option>
                {posList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.namaPosBayar}
                  </option>
                ))}
              </select>
              <input
                type="number"
                required
                value={row.pemasukan}
                onChange={(e) => updateRow(idx, 'pemasukan', e.target.value)}
                placeholder="Jumlah (Rp)"
                className="w-full sm:w-48 px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white"
              />
              {rows.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRow(idx)}
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}

          <div className="pt-2">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition-all"
            >
              Simpan Jurnal Pemasukan
            </button>
          </div>
        </form>
      </div>

      {/* Ledger Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-200">
          Buku Kas Pemasukan (Stream Jurnal Pemasukan Sah)
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 font-semibold">
              <tr>
                <th className="p-3">Tanggal</th>
                <th className="p-3">Uraian Transaksi Pemasukan</th>
                <th className="p-3">Pos Bayar</th>
                <th className="p-3 text-right">Nominal Pemasukan (Debet)</th>
                <th className="p-3">Petugas Kasir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {kasList.map((k) => (
                <tr key={k.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="p-3 font-mono text-slate-500">
                    {new Date(k.tgl).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                  </td>
                  <td className="p-3 font-semibold text-slate-900 dark:text-white">{k.uraian}</td>
                  <td className="p-3 font-medium text-slate-500">{k.posBayar?.namaPosBayar || '-'}</td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-600">
                    +{formatRp(k.pemasukan)}
                  </td>
                  <td className="p-3 text-slate-500">{k.user?.namaLengkap || 'System'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
