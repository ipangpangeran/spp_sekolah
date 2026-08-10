'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import CommandPalette from '@/components/CommandPalette';
import '@/app/globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [activeTa, setActiveTa] = useState('2026/2027');

  const syncUserSession = () => {
    const savedUser = localStorage.getItem('sisma_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error(e);
      }
    } else {
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    syncUserSession();

    // Listen for storage events (e.g. login/logout)
    window.addEventListener('storage', syncUserSession);
    return () => window.removeEventListener('storage', syncUserSession);
  }, [pathname]);

  // 10-Minute Session Timeout Inactivity Manager
  useEffect(() => {
    if (isLoginPage) return;

    const TEN_MINUTES_MS = 10 * 60 * 1000;
    let lastActivityTime = Date.now();

    const updateActivity = () => {
      lastActivityTime = Date.now();
    };

    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('scroll', updateActivity);
    window.addEventListener('touchstart', updateActivity);

    const interval = setInterval(() => {
      const savedUser = localStorage.getItem('sisma_user');
      if (savedUser) {
        const inactiveDuration = Date.now() - lastActivityTime;
        if (inactiveDuration >= TEN_MINUTES_MS) {
          localStorage.removeItem('sisma_user');
          document.cookie = 'sisma_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
          window.location.href = '/login?timeout=1';
        }
      }
    }, 15000);

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
      clearInterval(interval);
    };
  }, [isLoginPage]);

  useEffect(() => {
    // Load academic years
    fetch('/api/master/tahun-ajaran')
      .then((res) => res.json())
      .then((data) => {
        if (data.tahunAjaranList) {
          setAcademicYears(data.tahunAjaranList);
          const active = data.tahunAjaranList.find((t: any) => t.status === 'AKTIF');
          if (active) setActiveTa(active.tahunAjaran);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <html lang="id" className="light">
      <head>
        <title>SISMA - Sistem Informasi Keuangan Sekolah</title>
        <meta name="description" content="Aplikasi Kelola SPP & Keuangan Sekolah SMA Swasta Persiapan Stabat" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="/logo_sisma.png" type="image/png" />
        <link rel="shortcut icon" href="/logo_sisma.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo_sisma.png" />
      </head>
      <body className="bg-slate-900 text-slate-900 dark:text-slate-100 h-screen w-screen overflow-hidden flex flex-col font-sans transition-colors duration-200">
        {!isLoginPage && (
          <Navbar
            onOpenCommandPalette={() => setCommandPaletteOpen(true)}
            onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
            currentUser={currentUser}
            academicYears={academicYears}
            activeTa={activeTa}
            onTaChange={(ta) => setActiveTa(ta)}
          />
        )}

        <div className={`flex-1 flex overflow-hidden w-full ${isLoginPage ? 'h-screen' : 'h-[calc(100vh-4rem)]'}`}>
          {!isLoginPage && (
            <Sidebar
              userRole={currentUser?.level || 'admin'}
              isOpenMobile={mobileMenuOpen}
              onCloseMobile={() => setMobileMenuOpen(false)}
            />
          )}

          <main className={`flex-1 overflow-y-auto ${isLoginPage ? 'p-0' : 'p-3 sm:p-4 md:p-6'} transition-all h-full max-w-full overflow-x-hidden`}>
            {children}
          </main>
        </div>

        <CommandPalette
          isOpen={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
        />
      </body>
    </html>
  );
}
