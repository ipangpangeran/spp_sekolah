'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, Sun, Moon, LogOut, Calendar, ShieldCheck, Menu } from 'lucide-react';

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
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('theme') === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setDarkMode(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('sisma_user');
    document.cookie = 'sisma_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between shadow-md select-none px-2 sm:px-4 md:px-0">
      {/* Left Section: Mobile Menu Toggle + Brand Logo Box */}
      <div className="flex items-center h-full">
        {/* Hamburger Menu button for mobile */}
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors mr-1"
          title="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand Logo Box */}
        <div className="w-auto md:w-64 h-full shrink-0 border-r-0 md:border-r border-slate-800 px-2 md:px-3.5 flex items-center gap-2.5 md:gap-3 bg-slate-950/90">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white p-0.5 shadow-md border border-slate-600 flex items-center justify-center shrink-0">
            <Image
              src="/logo_sisma.png"
              alt="SISMA Logo"
              width={46}
              height={46}
              className="object-contain"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-black text-white text-lg md:text-2xl tracking-wider leading-none m-0">
              SISMA
            </h1>
            <p className="text-[10px] md:text-[11px] text-blue-300 font-extrabold tracking-tight m-0 mt-0.5 md:mt-1 truncate">
              SMA Persiapan Stabat
            </p>
          </div>
        </div>

        {/* Center Section: Search Bar & TA Switcher */}
        <div className="hidden sm:flex items-center gap-2 md:gap-3 px-2 md:px-4">
          {/* Search Bar */}
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-2 bg-slate-800/90 hover:bg-slate-800 text-slate-300 text-xs px-3 py-1.5 md:px-3.5 md:py-2 rounded-xl border border-slate-700/80 transition-all shadow-inner"
          >
            <Search className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-400" />
            <span className="hidden md:inline font-medium">Cari NIS / Nama Siswa...</span>
            <kbd className="hidden lg:inline-block bg-slate-900 text-slate-400 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] font-mono">
              Cmd / Ctrl + K
            </kbd>
          </button>

          {/* Academic Year Switcher */}
          <div className="flex items-center gap-1.5 md:gap-2 bg-slate-800/90 text-slate-200 px-2.5 py-1.5 rounded-xl border border-slate-700/80 text-xs">
            <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="font-semibold text-slate-400 hidden lg:inline">TA:</span>
            <select
              value={activeTa}
              onChange={(e) => onTaChange && onTaChange(e.target.value)}
              className="bg-transparent text-xs font-bold focus:outline-none cursor-pointer text-white"
            >
              {academicYears.length > 0 ? (
                academicYears.map((ta) => (
                  <option key={ta.id} value={ta.tahunAjaran} className="bg-slate-900 text-slate-100">
                    {ta.tahunAjaran} {ta.status === 'AKTIF' ? '(Aktif)' : ''}
                  </option>
                ))
              ) : (
                <option value="2026/2027" className="bg-slate-900 text-slate-100">2026/2027 (Aktif)</option>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Right Section: Dark Mode Toggle & User Profile */}
      <div className="flex items-center gap-2 md:gap-3 px-2 md:px-4">
        {/* Mobile Search Button */}
        <button
          onClick={onOpenCommandPalette}
          className="sm:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl"
          title="Cari Siswa"
        >
          <Search className="w-4 h-4 text-blue-400" />
        </button>

        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Toggle Dark/Light Mode"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        <div className="h-4 w-px bg-slate-800 hidden sm:block"></div>

        {/* User Info & Badge */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-md border border-blue-400/30">
            {currentUser?.namaLengkap ? currentUser.namaLengkap.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-semibold text-white m-0 leading-tight">
              {currentUser?.namaLengkap || 'Administrator'}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] text-slate-400 uppercase font-semibold">
                {currentUser?.level || 'Admin'}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors ml-0.5"
            title="Keluar / Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
