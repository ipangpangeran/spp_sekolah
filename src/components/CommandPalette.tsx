'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, User, ArrowRight, CreditCard, LayoutDashboard, FileSpreadsheet } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        isOpen ? onClose() : null; // Toggle in parent if needed
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setStudents([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/pembayaran/lookup?query=${encodeURIComponent(query)}`);
        const data = await res.json();
        setStudents(data.students || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const navigateToStudent = (nis: string) => {
    onClose();
    router.push(`/pembayaran-siswa?nis=${nis}`);
  };

  const quickLinks = [
    { title: 'Loket Pembayaran SPP', icon: CreditCard, path: '/pembayaran-siswa' },
    { title: 'Executive Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { title: 'Laporan Keuangan', icon: FileSpreadsheet, path: '/laporan' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center pt-20 px-4 animate-fade-in">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari NIS, NISN, atau Nama Siswa... (misal: ABDUL)"
            className="w-full bg-transparent text-sm focus:outline-none text-slate-800 dark:text-white placeholder-slate-400"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results / Suggestions */}
        <div className="p-3 max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {loading && (
            <div className="py-6 text-center text-xs text-slate-500">Mencari data siswa...</div>
          )}

          {!loading && query && students.length === 0 && (
            <div className="py-6 text-center text-xs text-slate-500">Tidak ada siswa ditemukan dengan kata kunci &quot;{query}&quot;.</div>
          )}

          {students.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Hasil Pencarian Siswa ({students.length})
              </div>
              {students.map((s) => (
                <button
                  key={s.id}
                  onClick={() => navigateToStudent(s.nis)}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-800 text-left transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                      {s.namaSiswa.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 m-0">
                        {s.namaSiswa}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0">
                        NIS: {s.nis} | Kelas: {s.kelas?.namaKelas}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-1" />
                </button>
              ))}
            </div>
          )}

          {!query && (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Navigasi Cepat
              </div>
              {quickLinks.map((link, idx) => {
                const Icon = link.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      onClose();
                      router.push(link.path);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                        {link.title}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 flex items-center justify-between">
          <span>Gunakan panah untuk memilih</span>
          <span>ESC untuk menutup</span>
        </div>
      </div>
    </div>
  );
}
