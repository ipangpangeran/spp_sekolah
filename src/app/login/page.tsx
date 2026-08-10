'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Shield,
  Lock,
  AlertCircle,
  ArrowRight,
  UserCheck,
  Globe,
  Instagram,
  Building2,
  MapPin,
  ExternalLink,
  Clock,
} from 'lucide-react';

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="p-12 text-center text-xs text-slate-500 bg-slate-950 h-screen">Memuat halaman login...</div>}>
      <LoginContent />
    </React.Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isTimeout = searchParams.get('timeout') === '1';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isTimeout) {
      setError('Sesi login telah berakhir. Silakan login kembali.');
    }
  }, [isTimeout]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login gagal');
      }

      localStorage.setItem('sisma_user', JSON.stringify(data.user));
      window.dispatchEvent(new Event('storage'));
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickCredential = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Left Side: Branding & Official School Info Links */}
      <div className="hidden md:flex flex-col justify-between w-1/2 bg-slate-950 relative p-10 lg:p-12 overflow-hidden border-r border-slate-800/80">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-tl-full blur-2xl"></div>
        <div className="absolute inset-0 bg-pattern"></div>

        <div className="relative z-10 space-y-6">
          {/* Header Brand */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white p-1 shadow-lg border border-slate-700 flex items-center justify-center shrink-0">
              <Image
                src="/logo_sisma.png"
                alt="SISMA Logo"
                width={42}
                height={42}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-black text-white leading-none m-0">SISMA</h1>
              <p className="text-xs text-blue-400 font-extrabold m-0 mt-1">SMA Swasta Persiapan Stabat</p>
            </div>
          </div>

          <div className="max-w-lg space-y-4">
            <h2 className="text-2xl lg:text-3xl font-extrabold text-white leading-tight">
              Sistem Informasi Keuangan &amp; SPP Internal Sekolah
            </h2>
            <p className="text-slate-400 text-xs lg:text-sm leading-relaxed">
              Aplikasi khusus internal operator &amp; bendahara SMA Swasta Persiapan Stabat untuk mengelola data SPP, Keuangan Siswa, buku kas harian dan lain-lain.
            </p>

            {/* Official School Information & Links */}
            <div className="pt-3 space-y-2.5">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider m-0 mb-2">
                Informasi &amp; Tautan Resmi Sekolah
              </h3>

              <a
                href="https://www.smaspersiapanstabat.sch.id/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 bg-slate-900/90 hover:bg-slate-900 border border-slate-800 p-2.5 rounded-xl transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-950 text-blue-400 flex items-center justify-center shrink-0 border border-blue-800/60">
                  <Globe className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </div>
                <div className="overflow-hidden min-w-0">
                  <span className="block text-xs font-bold text-white truncate">Website Resmi Sekolah</span>
                  <span className="block text-[11px] text-slate-400 truncate">www.smaspersiapanstabat.sch.id</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 ml-auto shrink-0" />
              </a>

              <a
                href="https://www.instagram.com/osissmaspersiapanstabat/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 bg-slate-900/90 hover:bg-slate-900 border border-slate-800 p-2.5 rounded-xl transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-pink-950 text-pink-400 flex items-center justify-center shrink-0 border border-pink-800/60">
                  <Instagram className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </div>
                <div className="overflow-hidden min-w-0">
                  <span className="block text-xs font-bold text-white truncate">Instagram OSIS Official</span>
                  <span className="block text-[11px] text-slate-400 truncate">@osissmaspersiapanstabat</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 ml-auto shrink-0" />
              </a>

              <a
                href="https://referensi.data.kemendikdasmen.go.id/pendidikan/npsn/10201322"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 bg-slate-900/90 hover:bg-slate-900 border border-slate-800 p-2.5 rounded-xl transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-950 text-amber-400 flex items-center justify-center shrink-0 border border-amber-800/60">
                  <Building2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </div>
                <div className="overflow-hidden min-w-0">
                  <span className="block text-xs font-bold text-white truncate">Info Kemendikdasmen (NPSN: 10201322)</span>
                  <span className="block text-[11px] text-slate-400 truncate">Referensi Data Pendidikan Resmi</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 ml-auto shrink-0" />
              </a>

              <a
                href="https://maps.app.goo.gl/y95yStfQK8zZv9kb8"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 bg-slate-900/90 hover:bg-slate-900 border border-slate-800 p-2.5 rounded-xl transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-950 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-800/60">
                  <MapPin className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </div>
                <div className="overflow-hidden min-w-0">
                  <span className="block text-xs font-bold text-white truncate">Lokasi Google Maps</span>
                  <span className="block text-[11px] text-slate-400 truncate">Jl. HIB Tembeleng, Stabat</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 ml-auto shrink-0" />
              </a>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-[11px] text-slate-500 border-t border-slate-800/80 pt-3">
          &copy; 2026 SMA Swasta Persiapan Stabat. Internal Administrative System.
        </div>
      </div>

      {/* Right Side: Login Card with School Logo above Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 bg-slate-900 overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          {/* Logo SMA Persiapan above Login Form (Polos, No Background Frame, Larger) */}
          <div className="text-center md:text-left space-y-3">
            <div className="mx-auto md:mx-0">
              <Image
                src="/Logo_SmaPersiapan.png"
                alt="Logo SMA Persiapan Stabat"
                width={128}
                height={128}
                className="w-28 h-28 md:w-32 md:h-32 object-contain drop-shadow-2xl"
              />
            </div>

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-950/80 border border-blue-800/60 rounded-full text-blue-400 text-xs font-semibold mb-2">
                <Shield className="w-3.5 h-3.5" /> Portal Internal Operator
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight m-0">Login Petugas Sekolah</h2>
              <p className="text-xs text-slate-400 mt-1 m-0">Silakan masuk menggunakan akun petugas terdaftar</p>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-amber-950/50 border border-amber-800/80 rounded-xl text-xs text-amber-300">
              <Clock className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} autoComplete="off" className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Username
              </label>
              <input
                type="text"
                required
                autoComplete="off"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Memproses Login...' : 'Masuk ke Aplikasi'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
