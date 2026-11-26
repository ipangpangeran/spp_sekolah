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
        { name: 'Tahun Ajaran', href: '/master/tahun-ajaran', icon: Award, roles: ['admin', 'bendahara'] },
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
      group: 'PENGATURAN & SETUP',
      items: [
        { name: 'Arsip Data & Kelas', href: '/master/arsip-kelas', icon: Archive, roles: ['admin'] },
        { name: 'Data Pengguna', href: '/master/users', icon: Shield, roles: ['admin'] },
        { name: 'Pengaturan Sistem', href: '/pengaturan', icon: Settings, roles: ['admin'] },
      ],
    },
  ];

  const renderNavContent = () => (
    <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
      {navigation.map((group, idx) => {
        const filteredItems = group.items.filter((item) => item.roles.includes(userRole));
        if (filteredItems.length === 0) return null;

        return (
          <div key={idx}>
            <h2 className="text-[10px] font-semibold text-[#87d1eb]/65 tracking-wider uppercase px-3 mb-1.5">
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
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all duration-200 group ${
                      isActive
                        ? 'bg-[#00677e]/35 text-[#5bd5fa] font-semibold border border-[#5bd5fa]/20'
                        : 'text-[#b5ebff]/80 font-medium hover:bg-[#b5ebff]/10 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-[#5bd5fa]' : 'text-[#87d1eb]/75 group-hover:text-white'}`} />
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
      {/* DESKTOP SIDEBAR: #001f28 Stitch Midnight Teal */}
      <aside className="hidden md:flex w-[260px] shrink-0 bg-[#001f28] text-white border-r border-[#003443] flex-col h-full select-none z-20 shadow-lg">
        {renderNavContent()}
        <div className="p-3.5 border-t border-[#004e60]/60 bg-[#001820] text-[11px] text-[#87d1eb]/80">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#5bd5fa]"></div>
            <span className="font-medium text-white">Sistem Internal Aktif</span>
          </div>
          <p className="mt-0.5 m-0 text-[10px] text-[#87d1eb]/60">
            SMA Persiapan Stabat &copy; 2026
          </p>
        </div>
      </aside>

      {/* MOBILE SIDEBAR DRAWER */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-[260px] max-w-[80vw] bg-[#001f28] text-white h-full flex flex-col shadow-xl border-r border-[#004e60] z-50">
            <div className="p-4 border-b border-[#004e60]/60 flex items-center justify-between bg-[#001820]">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Navigasi SISMA</span>
              <button
                onClick={onCloseMobile}
                className="p-1 rounded-lg text-[#87d1eb] hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {renderNavContent()}

            <div className="p-3 border-t border-[#004e60]/60 bg-[#001820] text-[11px] text-[#87d1eb]/80">
              <p className="m-0 text-[10px] text-[#87d1eb]/70">SMA Persiapan Stabat &copy; 2026</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
