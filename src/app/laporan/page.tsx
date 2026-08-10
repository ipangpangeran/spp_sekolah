'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  FileSpreadsheet,
  Printer,
  MessageSquare,
  Filter,
  CheckCircle2,
  AlertCircle,
  Users,
  Search,
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function LaporanKeuanganPage() {
  const [activeTab, setActiveTab] = useState<'kelas' | 'tunggakan' | 'rekap'>('kelas');
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');

  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/master/kelas')
      .then((res) => res.json())
      .then((data) => {
        setKelasList(data.kelasList || []);
        if (data.kelasList?.[0]) setSelectedClass(data.kelasList[0].id);
      })
      .catch((e) => console.error(e));
  }, []);

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/laporan?type=${activeTab}&idKelas=${selectedClass}`);
      const data = await res.json();
      setReportData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [activeTab, selectedClass]);

  const handleExportExcel = () => {
    let exportRows: any[] = [];

    if (activeTab === 'tunggakan' && reportData?.report) {
      exportRows = reportData.report.map((r: any) => ({
        NIS: r.nis,
        'Nama Siswa': r.namaSiswa,
        Kelas: r.kelas,
        'Bulan Tunggakan SPP': r.unpaidMonths?.join(', ') || '-',
        'Sisa Fee Bebas': r.unpaidBebas?.join(', ') || '-',
        'Total Tunggakan (Rp)': r.totalTunggakan,
        'HP Ortu / WA': r.hpOrtu || '-',
      }));
    } else if (activeTab === 'kelas' && reportData?.siswaList) {
      exportRows = reportData.siswaList.map((s: any) => {
        const monthsPaid = s.tagihanBulanan?.filter((t: any) => t.statusBayar === 'LUNAS').map((t: any) => t.bulan).join(', ');
        return {
          NIS: s.nis,
          'Nama Siswa': s.namaSiswa,
          Kelas: s.kelas?.namaKelas,
          'Bulan Lunas': monthsPaid || 'Belum ada',
        };
      });
    }

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Laporan_${activeTab}`);
    XLSX.writeFile(workbook, `Laporan_SISMA_${activeTab}.xlsx`);
  };

  const formatRp = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white m-0">
              Laporan Keuangan &amp; Rekapitulasi SPP
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
            Export laporan rekap per kelas, laporan tunggakan siswa, dan rekap penerimaan kas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Download Excel (.xlsx)</span>
          </button>
          <button
            onClick={() => window.print()}
            className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
        <button
          onClick={() => setActiveTab('kelas')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'kelas'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
          }`}
        >
          Laporan SPP Per Kelas
        </button>
        <button
          onClick={() => setActiveTab('tunggakan')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'tunggakan'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
          }`}
        >
          Laporan Tunggakan Siswa
        </button>
        <button
          onClick={() => setActiveTab('rekap')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'rekap'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
          }`}
        >
          Rekap Kas Pemasukan Harian
        </button>
      </div>

      {/* Filter Select */}
      {activeTab !== 'rekap' && (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-500">Pilih Kelas:</span>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="py-1.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
          >
            <option value="">Semua Kelas Rombel</option>
            {kelasList.map((k) => (
              <option key={k.id} value={k.id}>
                {k.namaKelas}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Printable Area with Kop Surat */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 printable-area">
        {/* Kop Surat for Print layout */}
        <div className="hidden print:block text-center border-b-2 border-slate-900 pb-4 mb-4">
          <h2 className="text-lg font-bold uppercase m-0">SMA SWASTA PERSIAPAN STABAT</h2>
          <p className="text-xs m-0">Jl. KH. Zainul Arifin No. 12, Stabat, Kab. Langkat | NPSN: 10201234</p>
          <p className="text-xs font-bold m-0 mt-1 uppercase">LAPORAN PEMASUKAN KEUANGAN SEKOLAH</p>
        </div>

        {/* TAB 1: Matriks Per Kelas */}
        {activeTab === 'kelas' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-bold border-b">
                <tr>
                  <th className="p-2.5">NIS</th>
                  <th className="p-2.5">Nama Siswa</th>
                  <th className="p-2.5">Kelas</th>
                  <th className="p-2.5">Jul</th>
                  <th className="p-2.5">Agu</th>
                  <th className="p-2.5">Sep</th>
                  <th className="p-2.5">Okt</th>
                  <th className="p-2.5">Nov</th>
                  <th className="p-2.5">Des</th>
                  <th className="p-2.5">Jan</th>
                  <th className="p-2.5">Feb</th>
                  <th className="p-2.5">Mar</th>
                  <th className="p-2.5">Apr</th>
                  <th className="p-2.5">Mei</th>
                  <th className="p-2.5">Jun</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {reportData?.siswaList?.map((s: any) => {
                  const bMap: any = {};
                  s.tagihanBulanan?.forEach((t: any) => {
                    bMap[t.bulan] = t.statusBayar === 'LUNAS';
                  });

                  const bulanList = ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'];

                  return (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="p-2.5 font-mono">{s.nis}</td>
                      <td className="p-2.5 font-bold text-slate-900 dark:text-white">{s.namaSiswa}</td>
                      <td className="p-2.5 font-medium text-slate-500">{s.kelas?.namaKelas}</td>
                      {bulanList.map((b) => (
                        <td key={b} className="p-2.5 text-center">
                          {bMap[b] ? (
                            <span className="inline-block w-4 h-4 rounded-full bg-emerald-500 text-white font-bold text-[10px] leading-4">
                              ✓
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">x</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: Tunggakan */}
        {activeTab === 'tunggakan' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-bold border-b">
                <tr>
                  <th className="p-3">NIS</th>
                  <th className="p-3">Nama Siswa</th>
                  <th className="p-3">Kelas</th>
                  <th className="p-3">Bulan SPP Menunggak</th>
                  <th className="p-3">Total Tunggakan (Rp)</th>
                  <th className="p-3">Aksi WA Reminder</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {reportData?.report?.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="p-3 font-mono font-bold text-blue-600">{r.nis}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{r.namaSiswa}</td>
                    <td className="p-3 font-medium">{r.kelas}</td>
                    <td className="p-3 font-medium text-rose-600">
                      {r.unpaidMonths?.join(', ') || 'Lunas SPP'}
                    </td>
                    <td className="p-3 font-mono font-bold text-rose-600">{formatRp(r.totalTunggakan)}</td>
                    <td className="p-3">
                      {r.hpOrtu && (
                        <a
                          href={`https://wa.me/${r.hpOrtu.replace(/^0/, '62')}?text=${encodeURIComponent(
                            `Pemberitahuan Tagihan SPP a.n ${r.namaSiswa} (${r.kelas}) sebesar ${formatRp(
                              r.totalTunggakan
                            )}. Mohon menyelesaikan pembayaran ke Bendahara Sekolah.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold inline-flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>Kirim WA Billing</span>
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: Rekap Kas Pemasukan */}
        {activeTab === 'rekap' && (
          <div className="space-y-4">
            <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 text-center">
              <span className="text-xs text-emerald-600 font-semibold block">Total Akumulasi Pemasukan Kas</span>
              <span className="text-2xl font-bold font-mono text-emerald-600">
                {formatRp(reportData?.totalPemasukan || 0)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
