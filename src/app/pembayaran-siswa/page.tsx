'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  User,
  CreditCard,
  CheckCircle2,
  Printer,
  MessageSquare,
  CheckSquare,
  Square,
  X,
  ShieldAlert,
} from 'lucide-react';

export default function PembayaranSiswaPage() {
  return (
    <React.Suspense fallback={<div className="p-12 text-center text-xs text-slate-500">Memuat halaman pembayaran...</div>}>
      <PembayaranSiswaContent />
    </React.Suspense>
  );
}

function PembayaranSiswaContent() {
  const searchParams = useSearchParams();
  const urlNis = searchParams.get('nis');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(urlNis || '');
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);

  const [hasSearched, setHasSearched] = useState(false);
  const [lastSearchedQuery, setLastSearchedQuery] = useState('');

  // Modals
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [showWaModal, setShowWaModal] = useState(false);
  const [waMessage, setWaMessage] = useState('');

  // Tagihan Bebas Modal
  const [showBebasModal, setShowBebasModal] = useState(false);
  const [selectedBebas, setSelectedBebas] = useState<any>(null);
  const [bebasAmount, setBebasAmount] = useState('');
  const [bebasKet, setBebasKet] = useState('');

  // Undo Modal
  const [showUndoModal, setShowUndoModal] = useState(false);
  const [undoTarget, setUndoTarget] = useState<any>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem('sisma_user');
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const activePetugasName = currentUser?.namaLengkap || 'Administrator';

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const fetchStudentData = async (targetNis: string) => {
    if (!targetNis || !targetNis.trim()) {
      setStudent(null);
      setHasSearched(false);
      return;
    }
    setLoading(true);
    setHasSearched(true);
    setLastSearchedQuery(targetNis.trim());
    try {
      const res = await fetch(`/api/pembayaran/lookup?nis=${encodeURIComponent(targetNis.trim())}`);
      const data = await res.json();
      if (res.ok && data.siswa) {
        setStudent(data.siswa);
        setSelectedMonths([]);
      } else {
        setStudent(null);
      }
    } catch (err) {
      console.error(err);
      setStudent(null);
    } finally {
      setLoading(false);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  };

  useEffect(() => {
    if (urlNis) {
      fetchStudentData(urlNis);
    }
  }, [urlNis]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudentData(query);
  };

  const toggleMonthSelection = (id: number) => {
    if (selectedMonths.includes(id)) {
      setSelectedMonths(selectedMonths.filter((mId) => mId !== id));
    } else {
      setSelectedMonths([...selectedMonths, id]);
    }
  };

  const handlePaySelectedSPP = async (overrideIds?: number[]) => {
    const targetIds = overrideIds || selectedMonths;
    if (targetIds.length === 0) return;
    setActionLoading(true);

    try {
      const res = await fetch('/api/pembayaran/bulanan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: targetIds }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memproses pembayaran');

      await fetchStudentData(student.nis || student.namaSiswa);

      const paidItems = data.processedPayments || [];
      const totalPaid = paidItems.reduce((s: number, i: any) => s + i.tarif, 0);

      const refNo = paidItems[0]?.noRef || `SYR-${Date.now()}`;
      setReceiptData({
        noRef: refNo,
        tgl: new Date().toLocaleDateString('id-ID', { dateStyle: 'full' }),
        siswa: student,
        items: paidItems,
        totalPaid,
        petugas: activePetugasName,
      });

      setWaMessage(
        `Terima kasih, pembayaran SPP bulan ${paidItems.map((i: any) => i.bulan).join(', ')} 2026 a.n ${student.namaSiswa} (${student.kelas?.namaKelas}) sebesar Rp ${totalPaid.toLocaleString('id-ID')} telah diterima pada ${new Date().toLocaleDateString('id-ID')}. No. Ref: ${refNo}.`
      );

      setShowReceiptModal(true);
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePayBebasSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBebas || !bebasAmount) return;
    setActionLoading(true);

    try {
      const res = await fetch('/api/pembayaran/bebas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idTagihanBebas: selectedBebas.id,
          jumlahBayar: parseFloat(bebasAmount),
          keterangan: bebasKet,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membayar');

      setShowBebasModal(false);
      setBebasAmount('');
      setBebasKet('');

      await fetchStudentData(student.nis || student.namaSiswa);

      setReceiptData({
        noRef: data.noRef,
        tgl: new Date().toLocaleDateString('id-ID', { dateStyle: 'full' }),
        siswa: student,
        items: [
          {
            posBayar: selectedBebas.jenisPembayaran.posBayar.namaPosBayar,
            bulan: bebasKet || 'Cicilan Bebas',
            tarif: parseFloat(bebasAmount),
          },
        ],
        totalPaid: parseFloat(bebasAmount),
        petugas: activePetugasName,
      });

      setShowReceiptModal(true);
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmUndo = async () => {
    if (!undoTarget) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/pembayaran/batal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(undoTarget),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membatalkan');

      setShowUndoModal(false);
      setUndoTarget(null);
      await fetchStudentData(student.nis || student.namaSiswa);
    } catch (err: any) {
      alert(err.message || 'Gagal membatalkan');
    } finally {
      setActionLoading(false);
    }
  };

  const formatRp = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Search Header */}
      <div className="bg-card p-5 rounded-2xl border border-line shadow-[0_1px_2px_rgba(15,23,42,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 m-0">
            Loket Pembayaran SPP &amp; Keuangan Siswa
          </h1>
          <p className="text-xs text-slate-500 m-0 mt-0.5">
            Cari siswa berdasarkan NIS atau Nama untuk melihat tagihan &amp; memproses transaksi.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              ref={searchInputRef}
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Scan barcode kartu siswa / Ketik NIS/Nama..."
              className="w-full pl-9 pr-3 py-2 bg-subtle border border-line rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-card focus:border-brand font-medium input-glow"
            />
          </div>
          <button
            type="submit"
            className="bg-brand hover:bg-brand-hover text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-sm transition-all"
          >
            Cari
          </button>
        </form>
      </div>

      {loading && (
        <div className="p-12 text-center text-xs text-slate-500">Mencari data tagihan siswa...</div>
      )}

      {/* State 1: Initial Empty State */}
      {!loading && !student && !hasSearched && (
        <div className="bg-card p-12 rounded-2xl border border-line text-center space-y-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="w-16 h-16 rounded-2xl bg-brand-soft text-brand flex items-center justify-center mx-auto border border-brand-border">
            <CreditCard className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="text-base font-bold text-slate-800 m-0">
              Scan Kartu Siswa / Ketik NIS
            </h2>
            <p className="text-xs text-slate-500 m-0 leading-relaxed">
              Kursor telah aktif otomatis. Silakan langsung scan barcode kartu siswa atau ketikkan NIS/Nama pada kolom pencarian di atas.
            </p>
          </div>
        </div>
      )}

      {/* State 2: Not Found */}
      {!loading && !student && hasSearched && (
        <div className="bg-card p-10 rounded-2xl border border-brick-border text-center space-y-3 shadow-sm">
          <User className="w-10 h-10 text-brick mx-auto" />
          <h2 className="text-sm font-bold text-slate-800 m-0">
            Data Siswa Tidak Ditemukan
          </h2>
          <p className="text-xs text-slate-500 m-0">
            NIS / Nama &quot;<span className="font-semibold text-slate-700">{lastSearchedQuery}</span>&quot; tidak terdaftar. Silakan periksa kembali barcode kartu atau NIS siswa.
          </p>
        </div>
      )}

      {!loading && student && (
        <div className="space-y-6">
          {/* Stitch Cyan-Teal Student Profile Bar */}
          <div className="bg-card p-6 rounded-2xl text-slate-900 shadow-premium flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-200 border-t-4 border-t-[#00677e]">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#e6f6fc] text-[#004e60] border border-[#b5ebff] flex items-center justify-center font-bold text-xl">
                {student.namaSiswa.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight text-slate-900 m-0">{student.namaSiswa}</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#dbe1ff] text-[#324478]">
                    • {student.statusSiswa}
                  </span>
                </div>
                <p className="text-xs text-slate-600 m-0 mt-1">
                  NIS: <span className="font-mono font-semibold text-[#00677e]">{student.nis || '-'}</span> | NISN:{' '}
                  <span className="font-mono text-slate-700">{student.nisn || '-'}</span> | Kelas:{' '}
                  <span className="font-bold text-slate-900">{student.kelas?.namaKelas}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 md:text-right bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-[11px] text-slate-500 block">No. HP Orang Tua / WA</span>
                <span className="text-xs font-mono text-[#00677e] font-bold">
                  {student.hpOrtu || 'Belum diisi'}
                </span>
              </div>
            </div>
          </div>

          {/* SPP 12-Month Grid Card */}
          <div className="bg-card p-6 rounded-2xl border border-line shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-line pb-4 gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-800 m-0">
                  Matrix SPP Bulanan (12 Bulan: Juli 2026 - Juni 2027)
                </h3>
                <p className="text-xs text-slate-500 m-0 mt-0.5">
                  Pilih satu atau beberapa bulan sekaligus untuk diproses bayar.
                </p>
              </div>

              {selectedMonths.length > 0 && (
                <button
                  onClick={() => handlePaySelectedSPP()}
                  disabled={actionLoading}
                  className="bg-sage hover:bg-sage-hover text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Bayar {selectedMonths.length} Bulan Terpilih</span>
                </button>
              )}
            </div>

            {/* 12 Month Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {student.tagihanBulanan?.map((t: any) => {
                const isPaid = t.statusBayar === 'LUNAS';
                const isSelected = selectedMonths.includes(t.id);
                const pDetail = t.pembayaranBulanan?.[0];

                return (
                  <div
                    key={t.id}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between relative ${
                      isPaid
                        ? 'bg-sage-soft/55 border-sage-border'
                        : isSelected
                        ? 'bg-brand-soft border-brand ring-1 ring-brand/40 shadow-sm'
                        : 'bg-subtle/75 border-line hover:border-brand/50 hover:bg-subtle'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-800">
                          {t.bulan}
                        </span>
                        {!isPaid && (
                          <button
                            onClick={() => toggleMonthSelection(t.id)}
                            className="text-slate-400 hover:text-brand"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-brand" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>

                      <div className="text-sm font-bold font-mono-data mb-2 text-slate-800">
                        {formatRp(t.tarif)}
                      </div>
                    </div>

                    <div>
                      {isPaid ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sage-soft text-sage-text border border-sage-border">
                            <CheckCircle2 className="w-3 h-3" /> LUNAS
                          </span>
                          <p className="text-[10px] text-slate-500 m-0">
                            {new Date(pDetail?.tglBayar || Date.now()).toLocaleDateString('id-ID')}
                          </p>
                          <button
                            onClick={() => {
                              setUndoTarget({ idPembayaranBulanan: pDetail?.id });
                              setShowUndoModal(true);
                            }}
                            className="text-[10px] text-brick hover:underline block font-semibold"
                          >
                            Batalkan Bayar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedMonths([t.id]);
                            handlePaySelectedSPP([t.id]);
                          }}
                          disabled={actionLoading}
                          className="w-full py-1.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                        >
                          Bayar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tagihan Bebas Section */}
          <div className="bg-card p-6 rounded-2xl border border-line shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-4">
            <div className="border-b border-line pb-3">
              <h3 className="text-base font-bold text-slate-800 m-0">
                Tagihan Bebas / Non-SPP (Cicilan Pembangunan &amp; Seragam)
              </h3>
              <p className="text-xs text-slate-500 m-0 mt-0.5">
                Daftar kewajiban non-bulanan yang dapat dicicil dengan nominal bebas.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {student.tagihanBebas?.map((tb: any) => {
                const sisa = Math.max(0, tb.totalTagihan - tb.terbayar);
                const percent = Math.min(100, Math.round((tb.terbayar / tb.totalTagihan) * 100));

                return (
                  <div
                    key={tb.id}
                    className="p-4 rounded-xl bg-subtle/80 border border-line space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        {tb.jenisPembayaran?.posBayar?.namaPosBayar}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          tb.statusBayar === 'LUNAS'
                            ? 'bg-sage-soft text-sage-text border-sage-border'
                            : 'bg-[#f8efd9] text-[#8a5b13] border-[#e7d2a3]'
                        }`}
                      >
                        {tb.statusBayar}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-mono-data">
                        <span className="text-slate-500">Terbayar: {formatRp(tb.terbayar)}</span>
                        <span className="font-bold text-slate-800">
                          Total: {formatRp(tb.totalTagihan)}
                        </span>
                      </div>

                      <div className="w-full bg-line h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-brand h-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                      <div className="text-[11px] text-right font-mono text-slate-500">
                        Sisa: {formatRp(sisa)} ({percent}%)
                      </div>
                    </div>

                    {sisa > 0 && (
                      <button
                        onClick={() => {
                          setSelectedBebas(tb);
                          setShowBebasModal(true);
                        }}
                        className="w-full py-2 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                      >
                        + Input Pembayaran Partial / Cicilan
                      </button>
                    )}

                    {tb.pembayaranBebas && tb.pembayaranBebas.length > 0 && (
                      <div className="pt-2 border-t border-line space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Riwayat Cicilan:</span>
                        <div className="space-y-1 max-h-28 overflow-y-auto">
                          {tb.pembayaranBebas.map((pb: any) => (
                            <div
                              key={pb.id}
                              className="text-[11px] flex items-center justify-between text-slate-600"
                            >
                              <span>
                                {new Date(pb.tglBayar).toLocaleDateString('id-ID')} ({pb.keterangan || 'Cicilan'})
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="font-bold font-mono text-slate-800">{formatRp(pb.jumlahBayar)}</span>
                                <button
                                  onClick={() => {
                                    setUndoTarget({ idPembayaranBebas: pb.id });
                                    setShowUndoModal(true);
                                  }}
                                  className="text-brick hover:underline text-[10px] font-semibold"
                                >
                                  Batal
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Receipt Print Modal */}
      {showReceiptModal && receiptData && (
        <div className="fixed inset-0 z-50 bg-slate-700/35 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-xl border border-line max-w-md w-full overflow-hidden">
            <div className="p-4 border-b border-line flex items-center justify-between bg-panel">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-brand" />
                <h3 className="text-sm font-bold text-slate-800 m-0">
                  Bukti Pembayaran / Kwitansi
                </h3>
              </div>
              <button onClick={() => setShowReceiptModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 printable-area text-slate-800 text-xs">
              <div className="text-center border-b border-line pb-3">
                <div className="w-10 h-10 mx-auto mb-1">
                  <Image src="/logo_sisma.png" alt="Logo" width={40} height={40} className="object-contain" />
                </div>
                <h4 className="font-bold text-sm text-slate-800 uppercase m-0">
                  SMA SWASTA PERSIAPAN STABAT
                </h4>
                <p className="text-[10px] text-slate-500 m-0">
                  Jl. HIB Tembeleng, Kec. Stabat, Kab. Langkat
                </p>
                <p className="text-[10px] font-mono text-brand font-bold m-0 mt-1">
                  KWITANSI / SLIP PEMBAYARAN SPP
                </p>
              </div>

              <div className="space-y-1 text-[11px] font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">No. Ref:</span>
                  <span className="font-bold">{receiptData.noRef}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tanggal:</span>
                  <span>{receiptData.tgl}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nama Siswa:</span>
                  <span className="font-bold text-slate-800">
                    {receiptData.siswa?.namaSiswa}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">NIS / Kelas:</span>
                  <span>
                    {receiptData.siswa?.nis || '-'} ({receiptData.siswa?.kelas?.namaKelas})
                  </span>
                </div>
              </div>

              <div className="border border-line rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead className="bg-subtle font-bold text-slate-700">
                    <tr>
                      <th className="p-2 border-b border-line">Uraian Pembayaran</th>
                      <th className="p-2 border-b border-line text-right">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receiptData.items?.map((it: any, idx: number) => (
                      <tr key={idx} className="border-b border-line/60 last:border-0">
                        <td className="p-2">
                          {it.posBayar || 'SPP'} Bulan {it.bulan}
                        </td>
                        <td className="p-2 text-right font-mono font-semibold">
                          {formatRp(it.tarif)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center text-sm font-bold pt-1 border-t border-line">
                <span>TOTAL DIBAYAR:</span>
                <span className="text-sage font-mono">{formatRp(receiptData.totalPaid)}</span>
              </div>

              <div className="text-[10px] text-center text-slate-400 pt-2">
                Petugas: {receiptData.petugas} • Simpan bukti ini sebagai tanda terima sah.
              </div>
            </div>

            <div className="p-4 bg-panel border-t border-line flex flex-col sm:flex-row items-center gap-2 no-print">
              <button
                onClick={() => {
                  setShowReceiptModal(false);
                  setReceiptData(null);
                }}
                className="w-full sm:w-auto py-2.5 px-3.5 bg-subtle hover:bg-[#e2e8f2] text-slate-700 border border-line rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                title="Selesai tanpa cetak & tanpa kirim WA"
              >
                <CheckCircle2 className="w-4 h-4 text-sage" />
                <span>Catat Pembayaran</span>
              </button>

              <button
                onClick={() => window.print()}
                className="w-full sm:flex-1 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak</span>
              </button>

              <button
                onClick={() => {
                  setShowReceiptModal(false);
                  setShowWaModal(true);
                }}
                className="w-full sm:w-auto py-2.5 px-4 bg-sage hover:bg-sage-hover text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Kirim WA</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: WhatsApp Notification Modal */}
      {showWaModal && (
        <div className="fixed inset-0 z-50 bg-slate-700/35 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-xl border border-line max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-sage" />
                <h3 className="text-sm font-bold text-slate-800 m-0">
                  Notifikasi WhatsApp Kwitansi
                </h3>
              </div>
              <button onClick={() => setShowWaModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Pesan WhatsApp:</label>
              <textarea
                rows={4}
                value={waMessage}
                onChange={(e) => setWaMessage(e.target.value)}
                className="w-full p-3 bg-subtle border border-line rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-card focus:border-brand"
              ></textarea>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`https://wa.me/${student?.hpOrtu?.replace(/^0/, '62')}?text=${encodeURIComponent(
                  waMessage
                )}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 bg-sage hover:bg-sage-hover text-white rounded-xl text-xs font-bold text-center flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Kirim via WhatsApp Web</span>
              </a>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(waMessage);
                  alert('Pesan berhasil disalin!');
                }}
                className="py-2.5 px-4 bg-subtle hover:bg-[#e2e8f2] border border-line text-slate-700 rounded-xl text-xs font-semibold"
              >
                Salin Teks
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Flexible Tagihan Bebas Modal */}
      {showBebasModal && selectedBebas && (
        <div className="fixed inset-0 z-50 bg-slate-700/35 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-xl border border-line max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-sm font-bold text-slate-800 m-0">
                Input Pembayaran {selectedBebas.jenisPembayaran?.posBayar?.namaPosBayar}
              </h3>
              <button onClick={() => setShowBebasModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePayBebasSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nominal Pembayaran (Rp):
                </label>
                <input
                  type="number"
                  required
                  value={bebasAmount}
                  onChange={(e) => setBebasAmount(e.target.value)}
                  placeholder="misal: 250000"
                  className="w-full px-3.5 py-2 bg-subtle border border-line rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:bg-card focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Keterangan (opsional):
                </label>
                <input
                  type="text"
                  value={bebasKet}
                  onChange={(e) => setBebasKet(e.target.value)}
                  placeholder="misal: Cicilan ke-2 Uang Pembangunan"
                  className="w-full px-3.5 py-2 bg-subtle border border-line rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-card focus:border-brand"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Proses Simpan Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Undo Payment Modal */}
      {showUndoModal && (
        <div className="fixed inset-0 z-50 bg-slate-700/35 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-xl border border-line max-w-sm w-full p-6 space-y-4 text-center">
            <ShieldAlert className="w-12 h-12 text-brick mx-auto" />
            <div>
              <h3 className="text-base font-bold text-slate-800 m-0">
                Batalkan Pembayaran?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Status tagihan akan dikembalikan ke Belum Bayar dan jurnal kas pemasukan akan dikurangi otomatis.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowUndoModal(false)}
                className="flex-1 py-2 bg-subtle hover:bg-[#e2e8f2] border border-line text-slate-700 rounded-xl text-xs font-semibold"
              >
                Tutup
              </button>
              <button
                onClick={handleConfirmUndo}
                disabled={actionLoading}
                className="flex-1 py-2 bg-brick hover:bg-brick-hover text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Ya, Batalkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
