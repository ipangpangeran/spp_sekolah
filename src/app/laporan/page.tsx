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
  BookOpen,
  DollarSign,
  TrendingUp,
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
        setSelectedClass('');
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
        NIS: r.nis || '-',
        NISN: r.nisn || '-',
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
          NIS: s.nis || '-',
          NISN: s.nisn || '-',
          'Nama Siswa': s.namaSiswa,
          Kelas: s.kelas?.namaKelas || '-',
          'Bulan Lunas': monthsPaid || 'Belum ada',
        };
      });
    } else if (activeTab === 'rekap' && reportData?.kasEntries) {
      exportRows = reportData.kasEntries.map((k: any) => ({
        Tanggal: new Date(k.tgl).toLocaleDateString('id-ID'),
        Uraian: k.uraian,
        Jenis: k.jenis === 'masuk' ? 'Pemasukan' : 'Pengeluaran',
        Pemasukan: k.pemasukan,
        Pengeluaran: k.pengeluaran,
      }));
    }

    let classLabel = 'Semua_Kelas';
    if (selectedClass) {
      const kObj = kelasList.find((k) => k.id === parseInt(selectedClass));
      if (kObj) {
        classLabel = kObj.namaKelas.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
      }
    }

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Laporan_${activeTab}`);
    XLSX.writeFile(workbook, `Laporan_Keuangan_${classLabel}_${activeTab}.xlsx`);
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
          Rekap Kas &amp; Total Pemasukan
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
          <p className="text-xs font-bold m-0 mt-1 uppercase">LAPORAN KEUANGAN SEKOLAH</p>
        </div>

        {/* TAB 1: Matriks Per Kelas */}
        {activeTab === 'kelas' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-bold border-b">
                <tr>
                  <th className="p-2.5">NIS</th>
                  <th className="p-2.5">NISN</th>
                  <th className="p-2.5">Nama Siswa</th>
                  <th className="p-2.5">Kelas</th>
                  <th className="p-2.5 text-center">Jul</th>
                  <th className="p-2.5 text-center">Agu</th>
                  <th className="p-2.5 text-center">Sep</th>
                  <th className="p-2.5 text-center">Okt</th>
                  <th className="p-2.5 text-center">Nov</th>
                  <th className="p-2.5 text-center">Des</th>
                  <th className="p-2.5 text-center">Jan</th>
                  <th className="p-2.5 text-center">Feb</th>
                  <th className="p-2.5 text-center">Mar</th>
                  <th className="p-2.5 text-center">Apr</th>
                  <th className="p-2.5 text-center">Mei</th>
                  <th className="p-2.5 text-center">Jun</th>
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
                      <td className="p-2.5 font-mono">{s.nis || '-'}</td>
                      <td className="p-2.5 font-mono text-slate-500">{s.nisn || '-'}</td>
                      <td className="p-2.5 font-bold text-slate-900 dark:text-white">{s.namaSiswa}</td>
                      <td className="p-2.5 font-medium text-slate-500">{s.kelas?.namaKelas || '-'}</td>
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
                  <th className="p-3">NISN</th>
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
                    <td className="p-3 font-mono font-bold text-blue-600">{r.nis || '-'}</td>
                    <td className="p-3 font-mono text-slate-500">{r.nisn || '-'}</td>
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

        {/* TAB 3: Rekap Kas & Total Pemasukan */}
        {activeTab === 'rekap' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-800">
                <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold block">Total Pemasukan SPP Bulanan</span>
                <span className="text-xl font-bold font-mono text-blue-700 dark:text-blue-300">
                  {formatRp(reportData?.totalSppPemasukan || 0)}
                </span>
              </div>
              <div className="p-5 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold block">Total Kas &amp; Penerimaan Lain</span>
                <span className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
                  {formatRp(reportData?.totalKasPemasukan || 0)}
                </span>
              </div>
              <div className="p-5 bg-indigo-600 text-white rounded-2xl shadow-md">
                <span className="text-xs text-indigo-200 font-semibold block">Total Akumulasi Pemasukan Keuangan</span>
                <span className="text-2xl font-black font-mono">
                  {formatRp(reportData?.totalPemasukan || 0)}
                </span>
              </div>
            </div>

            {reportData?.kasEntries?.length > 0 && (
              <div className="overflow-x-auto">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Rincian Catatan Buku Kas</h3>
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-bold border-b">
                    <tr>
                      <th className="p-3">Tanggal</th>
                      <th className="p-3">Uraian / Keterangan</th>
                      <th className="p-3">Jenis</th>
                      <th className="p-3">Jumlah (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    {reportData.kasEntries.map((k: any) => (
                      <tr key={k.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                        <td className="p-3 font-mono">{new Date(k.tgl).toLocaleDateString('id-ID')}</td>
                        <td className="p-3 font-semibold text-slate-900 dark:text-white">{k.uraian}</td>
                        <td className="p-3 font-bold uppercase">{k.jenis}</td>
                        <td className="p-3 font-mono font-bold text-emerald-600">
                          {formatRp(k.jenis === 'masuk' ? k.pemasukan : k.pengeluaran)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
