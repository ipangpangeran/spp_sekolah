'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CreditCard,
  Users,
  GraduationCap,
  Award,
  Layers,
  DollarSign,
  Receipt,
  BookOpen,
  FileSpreadsheet,
  Settings,
  Shield,
  Archive,
  X,
} from 'lucide-react';

interface SidebarProps {
  userRole?: string;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({
  userRole = 'admin',
  isOpenMobile = false,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    {
      group: 'UTAMA',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'bendahara', 'operator'] },
        { name: 'Pembayaran Siswa', href: '/pembayaran-siswa', icon: CreditCard, roles: ['admin', 'bendahara', 'operator'] },
      ],
    },
    {
      group: 'MASTER DATA',
      items: [
        { name: 'Data Siswa', href: '/master/siswa', icon: Users, roles: ['admin', 'bendahara', 'operator'] },
        { name: 'Data Kelas', href: '/master/kelas', icon: GraduationCap, roles: ['admin', 'bendahara', 'operator'] },
        { name: 'Arsip Kelas & Siswa', href: '/master/arsip-kelas', icon: Archive, roles: ['admin', 'bendahara'] },
        { name: 'Tahun Ajaran', href: '/master/tahun-ajaran', icon: Award, roles: ['admin', 'bendahara'] },
        { name: 'Data Pengguna', href: '/master/users', icon: Shield, roles: ['admin'] },
      ],
    },
    {
      group: 'KEUANGAN & TARIF',
      items: [
        { name: 'Pos Bayar', href: '/keuangan/pos-bayar', icon: Layers, roles: ['admin', 'bendahara'] },
        { name: 'Jenis Pembayaran', href: '/keuangan/jenis-bayar', icon: Receipt, roles: ['admin', 'bendahara'] },
        { name: 'Setting Tarif', href: '/keuangan/tarif', icon: DollarSign, roles: ['admin', 'bendahara'] },
      ],
    },
    {
      group: 'KAS & LAPORAN',
      items: [
        { name: 'Kas & Pemasukan', href: '/kas', icon: BookOpen, roles: ['admin', 'bendahara', 'operator'] },
        { name: 'Laporan Keuangan', href: '/laporan', icon: FileSpreadsheet, roles: ['admin', 'bendahara', 'operator'] },
      ],
    },
    {
      group: 'PENGATURAN',
      items: [
        { name: 'Pengaturan Sistem', href: '/pengaturan', icon: Settings, roles: ['admin', 'bendahara'] },
      ],
    },
  ];

  const renderNavContent = () => (
    <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
      {navigation.map((group, idx) => {
        const filteredItems = group.items.filter((item) => item.roles.includes(userRole));
        if (filteredItems.length === 0) return null;

        return (
          <div key={idx}>
            <h2 className="text-[11px] font-semibold text-slate-500 tracking-wider uppercase px-3 mb-2">
              {group.group}
            </h2>
            <div className="space-y-1">
              {filteredItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => onCloseMobile && onCloseMobile()}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group relative ${
                      isActive
                        ? 'bg-blue-600/10 text-blue-400 font-bold border-l-4 border-blue-500 pl-2 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-64 shrink-0 bg-slate-950 text-slate-300 border-r border-slate-800 flex-col h-full select-none z-20">
        {renderNavContent()}
        <div className="p-3 border-t border-slate-800 bg-slate-900/50 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span>Internal System</span>
          </div>
          <p className="mt-1 m-0 text-[10px] text-slate-600">
            SMA Persiapan Stabat &copy; 2026
          </p>
        </div>
      </aside>

      {/* MOBILE SIDEBAR DRAWER */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-64 max-w-[80vw] bg-slate-950 text-slate-300 h-full flex flex-col shadow-2xl border-r border-slate-800 z-50">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Navigasi SISMA</span>
              <button
                onClick={onCloseMobile}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {renderNavContent()}

            <div className="p-3 border-t border-slate-800 bg-slate-900/50 text-[11px] text-slate-500">
              <p className="m-0 text-[10px] text-slate-500">SMA Persiapan Stabat &copy; 2026</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
