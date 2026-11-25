import { cookies } from 'next/headers';

export interface SessionUser {
  id: number;
  username: string;
  namaLengkap: string;
  level: string;
  idTahunAjaran?: number | null;
}

export function getSessionFromCookies(): SessionUser | null {
  try {
    const cookieStore = cookies();
    const raw = cookieStore.get('sisma_session')?.value;
    if (!raw) return null;
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function isAdminSession(): boolean {
  const user = getSessionFromCookies();
  return user?.level === 'admin';
}
