'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  GraduationCap,
  TrendingUp,
  Wallet,
  CreditCard,
  PlusCircle,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const formatRp = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 font-medium">Memuat Dashboard SISMA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 rounded-2xl text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Tahun Ajaran 2026/2027 Aktif
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Executive Financial Dashboard</h1>
          <p className="text-xs text-slate-300">
            Ringkasan transaksi pembayaran SPP, penerimaan biaya sekolah, dan total saldo kas pemasukan SMA Swasta Persiapan Stabat.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 shrink-0">
          <Link
            href="/pembayaran-siswa"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all"
          >
            <CreditCard className="w-4 h-4" />
            <span>Loket Pembayaran SPP</span>
          </Link>
          <Link
            href="/kas"
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl text-xs font-semibold backdrop-blur-md transition-all border border-white/10"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Input Pemasukan Kas</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid (4 Cards: Siswa, Kelas, Today Income, Net Balance) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Total Siswa */}
        <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-3 min-w-0">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">Total Siswa Aktif</span>
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono-data truncate">
            {data?.totalSiswa || 0}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0 flex items-center gap-1 truncate">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Terdaftar di sistem</span>
          </p>
        </div>

        {/* Card 2: Total Kelas */}
        <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-3 min-w-0">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">Total Kelas Cohort</span>
            <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono-data truncate">
            {data?.totalKelas || 0}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0 truncate">X, XI, XII Rombel</p>
        </div>

        {/* Card 3: Today Income */}
        <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-3 min-w-0">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">Pemasukan Hari Ini</span>
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono-data truncate">
            {formatRp(data?.todayIncome || 0)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0 truncate">SPP &amp; Pembayaran Bebas</p>
        </div>

        {/* Card 4: Total Pemasukan Kas */}
        <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-3 min-w-0">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">Total Kas Pemasukan</span>
            <Wallet className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white font-mono-data truncate">
            {formatRp(data?.netBalance || 0)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0 truncate">Total Penerimaan Masuk</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Stream Transaksi Terbaru */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white m-0">
                Stream Transaksi Pemasukan Terbaru
              </h2>
            </div>
            <Link
              href="/kas"
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
            >
              <span>Buku Kas Pemasukan</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-700/50 flex-1 overflow-y-auto">
            {data?.recentTransactions && data.recentTransactions.length > 0 ? (
              data.recentTransactions.map((tx: any) => (
                <div
                  key={tx.id}
                  className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <ArrowDownRight className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 m-0 line-clamp-1">
                        {tx.uraian}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0">
                        {new Date(tx.tgl).toLocaleString('id-ID', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}{' '}
                        • Operator: <span className="font-medium text-slate-700 dark:text-slate-300">{tx.petugas}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold font-mono-data text-emerald-600 dark:text-emerald-400">
                      +{formatRp(tx.pemasukan)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-500">Belum ada transaksi penerimaan tercatat.</div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Quick Links */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider m-0">
              Akses Cepat Modul
            </h3>
            <div className="grid grid-cols-1 gap-2.5">
              <Link
                href="/pembayaran-siswa"
                className="flex items-center justify-between p-3 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 border border-blue-200/60 dark:border-blue-800/60 text-blue-900 dark:text-blue-200 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-semibold">Loket Pembayaran SPP</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/kas"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <PlusCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-semibold">Input Pemasukan Kas</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/laporan"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-semibold">Export Laporan Keuangan</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-3 relative overflow-hidden border border-slate-800">
            <div className="text-xs font-bold text-blue-400 uppercase tracking-wider m-0">
              Informasi Sekolah
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-white m-0">SMA Swasta Persiapan Stabat</p>
              <p className="text-xs text-slate-400 m-0">NPSN: 10201322 | Akreditasi A</p>
              <p className="text-xs text-slate-400 m-0">JL. HIB Tembeleng, Kec. Stabat, Kab. Langkat, Prov. Sumatera Utara</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
