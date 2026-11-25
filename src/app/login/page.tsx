'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Shield,
  ArrowRight,
  Globe,
  Instagram,
  Building2,
  MapPin,
  ExternalLink,
  Clock,
} from 'lucide-react';

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="p-12 text-center text-xs text-slate-500 bg-[#faf8ff] h-screen">Memuat halaman login...</div>}>
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

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row bg-[#faf8ff] text-[#191b25] overflow-hidden select-none">
      {/* Left Side: Stitch #001f28 Midnight Teal Branding */}
      <div className="hidden md:flex flex-col justify-between w-1/2 bg-[#001f28] relative p-10 lg:p-12 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#00677e]/25 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#b5ebff]/10 rounded-tl-full blur-2xl"></div>
        <div className="absolute inset-0 bg-pattern"></div>

        <div className="relative z-10 space-y-6">
          {/* Header Brand */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-white p-1 flex items-center justify-center shrink-0 shadow-sm">
              <Image
                src="/logo_sisma.png"
                alt="SISMA Logo"
                width={42}
                height={42}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white leading-none m-0">SISMA</h1>
              <p className="text-xs text-white/70 m-0 mt-1">SMA Swasta Persiapan Stabat</p>
            </div>
          </div>

          <div className="mt-10 max-w-lg space-y-3">
            <h2 className="text-3xl font-bold text-white leading-tight tracking-tight m-0">
              Sistem Informasi Keuangan Sekolah
            </h2>
            <p className="text-[#5bd5fa] text-sm lg:text-base leading-relaxed m-0">
              Kelola pembayaran siswa secara mudah, aman, dan transparan.
            </p>
          </div>
        </div>

        {/* Bottom Official School Links (Stitch glass badges style) */}
        <div className="relative z-10 space-y-3 mt-auto">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-2.5">
            <a
              href="https://www.smaspersiapanstabat.sch.id/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 bg-white/10 hover:bg-white/15 backdrop-blur-sm border border-white/10 px-3.5 py-2.5 rounded-lg transition-all group"
            >
              <Globe className="w-4 h-4 text-[#5bd5fa] shrink-0" />
              <div className="overflow-hidden min-w-0">
                <span className="block text-xs font-semibold text-white truncate">Website Sekolah</span>
                <span className="block text-[10px] text-white/65 truncate">smaspersiapanstabat.sch.id</span>
              </div>
              <ExternalLink className="w-3 h-3 text-white/50 ml-auto shrink-0" />
            </a>

            <a
              href="https://www.instagram.com/osissmaspersiapanstabat/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 bg-white/10 hover:bg-white/15 backdrop-blur-sm border border-white/10 px-3.5 py-2.5 rounded-lg transition-all group"
            >
              <Instagram className="w-4 h-4 text-[#5bd5fa] shrink-0" />
              <div className="overflow-hidden min-w-0">
                <span className="block text-xs font-semibold text-white truncate">Instagram OSIS</span>
                <span className="block text-[10px] text-white/65 truncate">@osissmaspersiapanstabat</span>
              </div>
              <ExternalLink className="w-3 h-3 text-white/50 ml-auto shrink-0" />
            </a>

            <a
              href="https://referensi.data.kemendikdasmen.go.id/pendidikan/npsn/10201322"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 bg-white/10 hover:bg-white/15 backdrop-blur-sm border border-white/10 px-3.5 py-2.5 rounded-lg transition-all group"
            >
              <Building2 className="w-4 h-4 text-[#5bd5fa] shrink-0" />
              <div className="overflow-hidden min-w-0">
                <span className="block text-xs font-semibold text-white truncate">Kemendikdasmen</span>
                <span className="block text-[10px] text-white/65 truncate">NPSN: 10201322</span>
              </div>
              <ExternalLink className="w-3 h-3 text-white/50 ml-auto shrink-0" />
            </a>

            <a
              href="https://maps.app.goo.gl/y95yStfQK8zZv9kb8"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 bg-white/10 hover:bg-white/15 backdrop-blur-sm border border-white/10 px-3.5 py-2.5 rounded-lg transition-all group"
            >
              <MapPin className="w-4 h-4 text-[#5bd5fa] shrink-0" />
              <div className="overflow-hidden min-w-0">
                <span className="block text-xs font-semibold text-white truncate">Lokasi Sekolah</span>
                <span className="block text-[10px] text-white/65 truncate">Jl. HIB Tembeleng, Stabat</span>
              </div>
              <ExternalLink className="w-3 h-3 text-white/50 ml-auto shrink-0" />
            </a>
          </div>

          <div className="text-[11px] text-white/50 pt-2">
            &copy; 2026 SMA Swasta Persiapan Stabat. Internal Administrative System.
          </div>
        </div>
      </div>

      {/* Right Side: Stitch Light Login Card */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 bg-[#faf8ff] overflow-y-auto">
        <div className="w-full max-w-md space-y-5">
          <div className="bg-white border border-slate-200/80 rounded-xl p-8 shadow-[0_4px_12px_rgba(0,0,0,0.05)] space-y-6">
            <div className="text-center md:text-left space-y-3">
              <div className="flex justify-center md:justify-start">
                <Image
                  src="/Logo_SmaPersiapan.png"
                  alt="Logo SMA Persiapan Stabat"
                  width={96}
                  height={96}
                  className="w-24 h-24 object-contain"
                />
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#e6f6fc] border border-[#b5ebff] rounded-full text-[#004e60] text-[11px] font-semibold mb-2">
                  <Shield className="w-3 h-3" /> Portal Internal Operator
                </div>
                <h2 className="text-2xl font-semibold text-[#191b25] tracking-tight m-0">Selamat Datang</h2>
                <p className="text-xs text-[#414659] mt-1 m-0">Silakan masuk menggunakan akun petugas terdaftar.</p>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-[#ffdad6] border border-[#f5b8b2] rounded-lg text-xs text-[#93000a] font-medium">
                <Clock className="w-4 h-4 shrink-0 text-[#ba1a1a]" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} autoComplete="off" className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#414659] mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="w-full h-10 px-3.5 bg-white border border-[#c1c5dd] rounded-lg text-xs text-[#191b25] placeholder-[#71768b] focus:outline-none focus:border-[#00677e] input-glow transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#414659] mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full h-10 px-3.5 bg-white border border-[#c1c5dd] rounded-lg text-xs text-[#191b25] placeholder-[#71768b] focus:outline-none focus:border-[#00677e] input-glow transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#00677e] hover:bg-[#004e60] text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{loading ? 'Memproses Login...' : 'Masuk ke Aplikasi'}</span>
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          </div>

          <p className="text-center text-[11px] text-[#71768b] m-0">
            &copy; 2026 SISMA - SMA Persiapan Stabat.
          </p>
        </div>
      </div>
    </div>
  );
}
