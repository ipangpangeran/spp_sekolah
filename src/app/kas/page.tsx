'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, Wallet } from 'lucide-react';

export default function KasPemasukanPage() {
  const [kasList, setKasList] = useState<any[]>([]);
  const [posList, setPosList] = useState<any[]>([]);
  const [saldo, setSaldo] = useState({ totalPemasukan: 0 });
  const [loading, setLoading] = useState(true);

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
      <div className="bg-gradient-to-r from-[#dff3fa] via-[#e7f4f1] to-[#f2f3ff] p-5 rounded-lg border border-brand-border/80 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-600">Total Akumulasi Kas Pemasukan</span>
          <div className="text-2xl font-bold text-sage-text font-mono-data mt-0.5">
            {formatRp(saldo.totalPemasukan)}
          </div>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-card/80 border border-sage-border flex items-center justify-center">
          <Wallet className="w-6 h-6 text-sage" />
        </div>
      </div>

      {/* Multi-Row Form Input */}
      <div className="bg-card p-5 rounded-2xl border border-line shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand" />
            <h2 className="text-sm font-bold text-slate-800 m-0">
              Form Input Jurnal Pemasukan Kas Sekolah
            </h2>
          </div>
          <button
            type="button"
            onClick={addRow}
            className="text-xs text-brand hover:underline font-semibold flex items-center gap-1"
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
                className="flex-1 w-full px-3.5 py-2 bg-subtle border border-line rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-card focus:border-brand"
              />
              <select
                value={row.idPosBayar}
                onChange={(e) => updateRow(idx, 'idPosBayar', e.target.value)}
                className="w-full sm:w-44 px-3 py-2 bg-subtle border border-line rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-card focus:border-brand"
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
                className="w-full sm:w-48 px-3.5 py-2 bg-subtle border border-line rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:bg-card focus:border-brand"
              />
              {rows.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRow(idx)}
                  className="p-2 text-brick hover:bg-brick-soft rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}

          <div className="pt-2">
            <button
              type="submit"
              className="bg-brand hover:bg-brand-hover text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition-all"
            >
              Simpan Jurnal Pemasukan
            </button>
          </div>
        </form>
      </div>

      {/* Ledger Table */}
      <div className="bg-card rounded-2xl border border-line shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">
        <div className="p-4 bg-panel border-b border-line font-bold text-xs text-slate-700">
          Buku Kas Pemasukan (Stream Jurnal Pemasukan Sah)
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-subtle text-slate-600 font-semibold border-b border-line">
              <tr>
                <th className="p-3">Tanggal</th>
                <th className="p-3">Uraian Transaksi Pemasukan</th>
                <th className="p-3">Pos Bayar</th>
                <th className="p-3 text-right">Nominal Pemasukan (Debet)</th>
                <th className="p-3">Petugas Kasir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">Memuat buku kas...</td>
                </tr>
              ) : (
                kasList.map((k) => (
                  <tr key={k.id} className="hover:bg-subtle/70">
                    <td className="p-3 font-mono text-slate-500">
                      {new Date(k.tgl).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="p-3 font-semibold text-slate-800">{k.uraian}</td>
                    <td className="p-3 font-medium text-slate-500">{k.posBayar?.namaPosBayar || '-'}</td>
                    <td className="p-3 text-right font-mono font-bold text-sage">
                      +{formatRp(k.pemasukan)}
                    </td>
                    <td className="p-3 text-slate-500">{k.user?.namaLengkap || 'System'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
