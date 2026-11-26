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
  ChevronLeft,
  ChevronRight,
  Calendar,
} from 'lucide-react';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [period, setPeriod] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const params = new URLSearchParams({
      page: String(page),
      limit: '10',
      period,
    });
    if (period === 'custom') {
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
    }

    if (data) setTxLoading(true);
    fetch(`/api/dashboard?${params.toString()}`)
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        setLoading(false);
        setTxLoading(false);
      });
  }, [page, period, startDate, endDate]);

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
          <div className="w-8 h-8 border-4 border-[#00677e] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 font-medium">Memuat Dashboard SISMA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto">
      {/* Stitch Clean Stripe-Style Header (No heavy banner) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 m-0">Ikhtisar Keuangan</h1>
          <p className="text-xs text-slate-500 mt-1 m-0">
            Status pembayaran SPP dan arus kas masuk SMA Swasta Persiapan Stabat • Tahun Ajaran 2026/2027.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/laporan"
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-lg text-xs font-medium border border-slate-200 shadow-sm transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-500" />
            <span>Laporan</span>
          </Link>
          <Link
            href="/kas"
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-lg text-xs font-medium border border-slate-200 shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4 text-slate-500" />
            <span>Input Kas</span>
          </Link>
          <Link
            href="/pembayaran-siswa"
            className="flex items-center gap-2 bg-[#00677e] hover:bg-[#004e60] text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <CreditCard className="w-4 h-4" />
            <span>+ Terima Pembayaran</span>
          </Link>
        </div>
      </div>

      {/* KPI Bento Cards (Stitch style: white card, border-slate-200, subtle shadow, colored icon pill) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-premium space-y-3 min-w-0 hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 truncate">Total Siswa Aktif</span>
            <span className="w-8 h-8 rounded-md bg-[#e6f6fc] text-[#00677e] flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-semibold text-slate-900 font-mono-data truncate">
            {data?.totalSiswa || 0}
          </div>
          <p className="text-[11px] text-emerald-700 bg-emerald-50/70 inline-flex items-center gap-1 px-2 py-0.5 rounded-md m-0">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Terdaftar aktif di sistem</span>
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-premium space-y-3 min-w-0 hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 truncate">Total Kelas Cohort</span>
            <span className="w-8 h-8 rounded-md bg-[#dbe1ff] text-[#4b5c92] flex items-center justify-center shrink-0">
              <GraduationCap className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-semibold text-slate-900 font-mono-data truncate">
            {data?.totalKelas || 0}
          </div>
          <p className="text-[11px] text-slate-500 m-0 truncate">X, XI, XII Rombel</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-premium space-y-3 min-w-0 hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 truncate">Pemasukan Hari Ini</span>
            <span className="w-8 h-8 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-semibold text-emerald-600 font-mono-data truncate">
            {formatRp(data?.todayIncome || 0)}
          </div>
          <p className="text-[11px] text-slate-500 m-0 truncate">SPP &amp; Pembayaran Bebas</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-premium space-y-3 min-w-0 hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 truncate">Total Pemasukan Pembayaran</span>
            <span className="w-8 h-8 rounded-md bg-[#b5ebff]/60 text-[#004e60] flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-semibold text-slate-900 font-mono-data truncate">
            {formatRp(data?.totalPaymentIncome || 0)}
          </div>
          <p className="text-[11px] text-slate-500 m-0 truncate">
            SPP &amp; Bebas • Kas: {formatRp(data?.totalKasIncome || 0)}
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Transaksi Terbaru */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-premium overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50/70 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#00677e]" />
                <h2 className="text-sm font-semibold text-slate-900 m-0">
                  Transaksi Terbaru
                </h2>
                {data?.latestTransactionDate && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#e6f6fc] text-[#004e60] border border-[#b5ebff]">
                    Terakhir:{' '}
                    {new Date(data.latestTransactionDate).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                )}
              </div>
              <Link
                href="/laporan"
                className="text-xs text-[#00677e] font-semibold hover:underline flex items-center gap-1"
              >
                <span>Lihat Laporan</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={period}
                  onChange={(e) => {
                    setPeriod(e.target.value);
                    setPage(1);
                  }}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#00677e]"
                >
                  <option value="all">Semua Tanggal</option>
                  <option value="today">Hari Ini</option>
                  <option value="7d">7 Hari Terakhir</option>
                  <option value="30d">30 Hari Terakhir</option>
                  <option value="month">Bulan Ini</option>
                  <option value="custom">Rentang Tanggal</option>
                </select>
              </div>

              {period === 'custom' && (
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setPage(1);
                    }}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-[#00677e]"
                  />
                  <span className="text-slate-400">s/d</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setPage(1);
                    }}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-[#00677e]"
                  />
                </div>
              )}
            </div>
          </div>

          <div className={`divide-y divide-slate-100 flex-1 ${txLoading ? 'opacity-60' : ''}`}>
            {data?.recentTransactions && data.recentTransactions.length > 0 ? (
              data.recentTransactions.map((tx: any) => (
                <div
                  key={tx.id}
                  className="p-3.5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                      <ArrowDownRight className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900 m-0 line-clamp-1">
                        {tx.uraian}
                      </p>
                      <p className="text-[11px] text-slate-500 m-0">
                        {new Date(tx.tgl).toLocaleString('id-ID', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}{' '}
                        • Operator: <span className="font-medium text-slate-700">{tx.petugas}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-semibold font-mono-data text-emerald-600">
                      +{formatRp(tx.pemasukan)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-500">
                Tidak ada transaksi penerimaan pada periode yang dipilih.
              </div>
            )}
          </div>

          {data?.pagination && data.pagination.totalTransactions > 0 && (
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="text-slate-500">
                Menampilkan{' '}
                <strong className="text-slate-700">
                  {(data.pagination.page - 1) * data.pagination.limit + 1}
                </strong>
                –
                <strong className="text-slate-700">
                  {Math.min(
                    data.pagination.page * data.pagination.limit,
                    data.pagination.totalTransactions
                  )}
                </strong>{' '}
                dari <strong className="text-slate-700">{data.pagination.totalTransactions}</strong> transaksi
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={data.pagination.page <= 1 || txLoading}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-medium"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>
                <span className="px-2 text-slate-600 font-medium">
                  Hal {data.pagination.page} / {data.pagination.totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                  disabled={data.pagination.page >= data.pagination.totalPages || txLoading}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-medium"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Quick Links & School Info */}
        <div className="space-y-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-premium space-y-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider m-0">
              Akses Cepat Modul
            </h3>
            <div className="grid grid-cols-1 gap-2">
              <Link
                href="/pembayaran-siswa"
                className="flex items-center justify-between p-3 rounded-xl bg-[#e6f6fc] hover:bg-[#d5effa] border border-[#b5ebff] text-[#004e60] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-4 h-4 text-[#00677e]" />
                  <span className="text-xs font-semibold">Loket Pembayaran SPP</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#00677e] group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/kas"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <PlusCircle className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-semibold">Input Pemasukan Kas</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/laporan"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-4 h-4 text-[#4b5c92]" />
                  <span className="text-xs font-semibold">Export Laporan Keuangan</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-premium space-y-2">
            <div className="text-[11px] font-semibold text-[#00677e] uppercase tracking-wider m-0">
              Informasi Sekolah
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-900 m-0">SMA Swasta Persiapan Stabat</p>
              <p className="text-xs text-slate-600 m-0">NPSN: 10201322 | Akreditasi A</p>
              <p className="text-xs text-slate-500 m-0 leading-relaxed">JL. HIB Tembeleng, Kec. Stabat, Kab. Langkat, Prov. Sumatera Utara</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
