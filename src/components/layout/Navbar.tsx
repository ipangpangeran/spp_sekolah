'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, LogOut, Calendar, ShieldCheck, Menu } from 'lucide-react';

interface NavbarProps {
  onOpenCommandPalette: () => void;
  onToggleMobileMenu?: () => void;
  currentUser?: {
    username: string;
    namaLengkap: string;
    level: string;
    tahunAjaran?: string;
  } | null;
  academicYears?: Array<{ id: number; tahunAjaran: string; status: string }>;
  activeTa?: string;
  onTaChange?: (ta: string) => void;
}

export default function Navbar({
  onOpenCommandPalette,
  onToggleMobileMenu,
  currentUser,
  academicYears = [],
  activeTa = '2026/2027',
  onTaChange,
}: NavbarProps) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('sisma_user');
    document.cookie = 'sisma_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 h-16 md:h-24 bg-white/90 backdrop-blur-md text-slate-900 border-b border-slate-200 flex items-center justify-between select-none px-2 sm:px-4 md:px-0">
      {/* Left Section: Mobile Menu Toggle + Brand Logo Box */}
      <div className="flex items-center h-full">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors mr-1"
          title="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand Logo Box aligned with 260px Sidebar (#001f28 Stitch Midnight Teal) */}
        <div className="w-auto md:w-[260px] h-full shrink-0 border-r-0 md:border-r border-[#003443] px-2 md:px-5 flex items-center gap-3 md:gap-3.5 md:bg-[#001f28]">
          <div className="w-11 h-11 md:w-16 md:h-16 rounded-xl bg-white p-1.5 shadow-sm flex items-center justify-center shrink-0">
            <Image
              src="/logo_sisma.png"
              alt="SISMA Logo"
              width={60}
              height={60}
              className="object-contain"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-slate-900 md:text-white text-lg md:text-2xl tracking-tight leading-none m-0">
              SISMA
            </h1>
            <p className="text-[10px] md:text-xs text-[#00677e] md:text-[#87d1eb] font-medium tracking-tight m-0 mt-1 leading-snug">
              SMA Persiapan Stabat
            </p>
          </div>
        </div>

        {/* Center Section: Search Bar & TA Switcher */}
        <div className="hidden sm:flex items-center gap-2 md:gap-3 px-2 md:px-6">
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs px-3 py-1.5 md:px-3.5 md:py-2 rounded-lg border border-slate-200 transition-all shadow-sm"
          >
            <Search className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#00677e]" />
            <span className="hidden md:inline font-medium">Cari NIS / Nama Siswa...</span>
            <kbd className="hidden lg:inline-block bg-white text-slate-500 border border-slate-200 rounded px-1.5 py-0.5 text-[10px] font-mono">
              Ctrl + K
            </kbd>
          </button>

          <div className="flex items-center gap-1.5 md:gap-2 bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 text-xs shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-medium text-slate-500 hidden lg:inline">TA:</span>
            <select
              value={activeTa}
              onChange={(e) => onTaChange && onTaChange(e.target.value)}
              className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer text-slate-700"
            >
              {academicYears.length > 0 ? (
                academicYears.map((ta) => (
                  <option key={ta.id} value={ta.tahunAjaran} className="bg-white text-slate-800">
                    {ta.tahunAjaran} {ta.status === 'AKTIF' ? '(Aktif)' : ''}
                  </option>
                ))
              ) : (
                <option value="2026/2027" className="bg-white text-slate-800">2026/2027 (Aktif)</option>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Right Section: User Profile & Logout */}
      <div className="flex items-center gap-2 md:gap-3 px-2 md:px-6">
        <button
          onClick={onOpenCommandPalette}
          className="sm:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
          title="Cari Siswa"
        >
          <Search className="w-4 h-4 text-[#00677e]" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#e6f6fc] text-[#004e60] flex items-center justify-center font-bold text-xs border border-[#b5ebff]">
            {currentUser?.namaLengkap ? currentUser.namaLengkap.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-semibold text-slate-800 m-0 leading-tight">
              {currentUser?.namaLengkap || 'Administrator'}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span className="text-[10px] text-slate-500 uppercase font-semibold">
                {currentUser?.level || 'Admin'}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-[#ba1a1a] hover:bg-[#ffdad6] transition-colors ml-1"
            title="Keluar / Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
