import sqlite3
import shutil
import os
import sys
import datetime

try:
    import pymysql
except ImportError:
    print("Installing pymysql dependency...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pymysql"])
    import pymysql

# --- CONFIGURATION ---
REMOTE_HOST = os.getenv("MYSQL_HOST", "127.0.0.1")
REMOTE_USER = os.getenv("MYSQL_USER", "sisma")
REMOTE_PASS = os.getenv("MYSQL_PASSWORD", "ingatmatiAA26!")
REMOTE_DB   = os.getenv("MYSQL_DATABASE", "sisma")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOCAL_DB_PATH = os.path.join(BASE_DIR, "prisma", "dev.db")
BACKUP_DB_PATH = os.path.join(BASE_DIR, "prisma", "dev.db.bak")

def migrate():
    print(f"Base directory: {BASE_DIR}")
    print(f"Target SQLite DB: {LOCAL_DB_PATH}")

    # Ensure prisma directory exists
    os.makedirs(os.path.dirname(LOCAL_DB_PATH), exist_ok=True)

    if os.path.exists(LOCAL_DB_PATH):
        shutil.copyfile(LOCAL_DB_PATH, BACKUP_DB_PATH)
        print(f"Backup created at {BACKUP_DB_PATH}")

    print("\nConnecting to MySQL Database...")
    try:
        mysql_conn = pymysql.connect(
            host=REMOTE_HOST, user=REMOTE_USER, password=REMOTE_PASS, database=REMOTE_DB,
            charset='utf8mb4', cursorclass=pymysql.cursors.DictCursor
        )
    except Exception as e:
        print(f"Failed to connect to MySQL on {REMOTE_HOST}, retrying with 103.196.155.102...")
        mysql_conn = pymysql.connect(
            host="103.196.155.102", user=REMOTE_USER, password=REMOTE_PASS, database=REMOTE_DB,
            charset='utf8mb4', cursorclass=pymysql.cursors.DictCursor
        )

    sqlite_conn = sqlite3.connect(LOCAL_DB_PATH)
    sqlite_conn.execute("PRAGMA foreign_keys = OFF;")
    
    sq_cur = sqlite_conn.cursor()
    ms_cur = mysql_conn.cursor()

    # Clear existing data in local SQLite
    tables_to_clear = [
        "PembayaranBulanan", "TagihanBulanan", "PembayaranBebas", "TagihanBebas",
        "Kas", "JenisPembayaran", "PosBayar", "Siswa", "Kelas", "User", "TahunAjaran", "Pengaturan"
    ]
    for tbl in tables_to_clear:
        sq_cur.execute(f"DELETE FROM `{tbl}`;")
        sq_cur.execute(f"DELETE FROM sqlite_sequence WHERE name='{tbl}';")
    sqlite_conn.commit()
    print("Cleared existing tables in target SQLite.")

    # 1. Pengaturan
    ms_cur.execute("SELECT * FROM identitas LIMIT 1;")
    identitas = ms_cur.fetchone()
    if identitas:
        sq_cur.execute("""
            INSERT INTO Pengaturan (
                id, namaSekolah, npsn, alamat, telepon, email, website, 
                kepalaSekolah, nipKepalaSekolah, bendahara, nipBendahara, logo, 
                waApiUrl, waApiKey, midtransServerKey, midtransClientKey, midtransIsProduction
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            1,
            identitas.get('nmSekolah') or "SMA Swasta Persiapan Stabat",
            identitas.get('npsn') or "10700295",
            identitas.get('alamat') or "Jl. HIB Tembeleng, Pantai Gemi, Stabat",
            "(061) 8912345",
            "info@smapersiapan-stabat.sch.id",
            identitas.get('link') or "https://spp-smapersiapan.web.id",
            identitas.get('nmKepsek') or "IRWAN AMRI, S.P",
            identitas.get('nipKepsek') or "",
            identitas.get('nmBendahara') or "FAIRUZA RIKHA AMRI, S.E, M.Si",
            identitas.get('nipBendahara') or "",
            "/logo_sisma.png",
            "https://api.whatsapp-gateway.com/send",
            "DEMO_WA_API_KEY_SISMA",
            "SB-Mid-server-DemoKey123",
            "SB-Mid-client-DemoKey123",
            0
        ))
        print("Migrated Pengaturan.")

    # 2. TahunAjaran
    ms_cur.execute("SELECT * FROM tahun_ajaran;")
    ta_rows = ms_cur.fetchall()
    ta_map = {}
    for r in ta_rows:
        ta_id = r['idTahunAjaran']
        ta_name = r['nmTahunAjaran']
        status = "AKTIF" if r['aktif'] == 'Y' else "TIDAK_AKTIF"
        sq_cur.execute(
            "INSERT INTO TahunAjaran (id, tahunAjaran, status) VALUES (?, ?, ?);",
            (ta_id, ta_name, status)
        )
        ta_map[ta_id] = ta_id
    print(f"Migrated {len(ta_rows)} TahunAjaran rows.")

    # 3. Kelas
    ms_cur.execute("SELECT * FROM kelas_siswa;")
    kelas_rows = ms_cur.fetchall()
    for r in kelas_rows:
        sq_cur.execute(
            "INSERT INTO Kelas (id, namaKelas, keterangan) VALUES (?, ?, ?);",
            (r['idKelas'], r['nmKelas'], r['ketKelas'])
        )
    print(f"Migrated {len(kelas_rows)} Kelas rows.")

    # 4. Siswa
    ms_cur.execute("SELECT * FROM siswa;")
    siswa_rows = ms_cur.fetchall()
    seen_nis = set()
    migrated_siswa_cnt = 0
    for r in siswa_rows:
        sid = r['idSiswa']
        raw_nis = (r['nisSiswa'] or '').strip()
        raw_nisn = (r['nisnSiswa'] or '').strip()
        nama = (r['nmSiswa'] or '').strip()
        jk = (r['jkSiswa'] or 'L').strip()
        id_kelas = r['idKelas']
        hp_ortu = (r['noHpOrtu'] or '').strip()
        status_raw = r['statusSiswa']
        
        status_map = {
            'Aktif': 'AKTIF',
            'Non Aktif': 'ALUMNI',
            'Pindah': 'PINDAH',
            'Drop Out': 'ALUMNI',
            'Lulus': 'LULUS'
        }
        status_siswa = status_map.get(status_raw, 'AKTIF')

        if not raw_nis or raw_nis in seen_nis:
            final_nis = f"SISWA-{sid}"
        else:
            final_nis = raw_nis
        seen_nis.add(final_nis)

        sq_cur.execute("""
            INSERT INTO Siswa (id, nis, nisn, namaSiswa, jenisKelamin, idKelas, hpSiswa, hpOrtu, statusSiswa)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            sid, final_nis, raw_nisn or None, nama, jk if jk in ['L', 'P'] else 'L',
            id_kelas, None, hp_ortu or None, status_siswa
        ))
        migrated_siswa_cnt += 1
    print(f"Migrated {migrated_siswa_cnt} Siswa rows.")

    # 5. Users
    ms_cur.execute("SELECT * FROM users;")
    user_rows = ms_cur.fetchall()
    active_ta_id = list(ta_map.keys())[0] if ta_map else 1
    user_id_map = {}
    uid = 1
    for r in user_rows:
        uname = r['username'].strip()
        pwd = "password" if uname in ["admin", "oza"] else "admin123"
        level = "admin" if r['level'] == "admin" else "bendahara"
        sq_cur.execute("""
            INSERT INTO User (id, username, password, namaLengkap, level, idTahunAjaran)
            VALUES (?, ?, ?, ?, ?, ?);
        """, (uid, uname, pwd, r['nama_lengkap'], level, active_ta_id))
        user_id_map[uname] = uid
        uid += 1
    print(f"Migrated {len(user_rows)} User rows.")

    # 6. PosBayar & JenisPembayaran
    ms_cur.execute("SELECT * FROM pos_bayar;")
    pos_rows = ms_cur.fetchall()
    for r in pos_rows:
        sq_cur.execute(
            "INSERT INTO PosBayar (id, namaPosBayar, keterangan) VALUES (?, ?, ?);",
            (r['idPosBayar'], r['nmPosBayar'], r['ketPosBayar'])
        )
    print(f"Migrated {len(pos_rows)} PosBayar rows.")

    ms_cur.execute("SELECT * FROM jenis_bayar;")
    jenis_rows = ms_cur.fetchall()
    for r in jenis_rows:
        sq_cur.execute(
            "INSERT INTO JenisPembayaran (id, idPosBayar, idTahunAjaran, tipeBayar) VALUES (?, ?, ?, ?);",
            (r['idJenisBayar'], r['idPosBayar'], r['idTahunAjaran'], r['tipeBayar'])
        )
    print(f"Migrated {len(jenis_rows)} JenisPembayaran rows.")

    # 7. TagihanBulanan & PembayaranBulanan
    ms_cur.execute("SELECT * FROM bulan;")
    bulan_rows = ms_cur.fetchall()
    bulan_map = {str(b['idBulan']): {'nama': b['nmBulan'], 'urutan': b['urutan']} for b in bulan_rows}

    ms_cur.execute("SELECT * FROM tagihan_bulanan;")
    tagihan_rows = ms_cur.fetchall()
    cnt_tagihan = 0
    cnt_pembayaran = 0
    ref_counter = 1000
    admin_uid = list(user_id_map.values())[0] if user_id_map else 1

    for r in tagihan_rows:
        t_id = r['idTagihanBulanan']
        j_id = r['idJenisBayar']
        s_id = r['idSiswa']
        b_id_str = str(r['idBulan'])
        
        b_info = bulan_map.get(b_id_str, {'nama': f'Bulan {b_id_str}', 'urutan': int(b_id_str) if b_id_str.isdigit() else 1})
        bulan_nama = b_info['nama']
        urutan_bulan = b_info['urutan']
        
        tarif = float(r['jumlahBayar'] or 0)
        st_raw = str(r['statusBayar'])
        status_bayar = "LUNAS" if st_raw == '1' else "BELUM_BAYAR"

        sq_cur.execute("""
            INSERT INTO TagihanBulanan (id, idJenisPembayaran, idSiswa, bulan, urutanBulan, tarif, statusBayar)
            VALUES (?, ?, ?, ?, ?, ?, ?);
        """, (t_id, j_id, s_id, bulan_nama, urutan_bulan, tarif, status_bayar))
        cnt_tagihan += 1

        if st_raw == '1':
            tgl = r['tglBayar'] or r['tglUpdate'] or datetime.datetime.now()
            tgl_str = tgl.strftime("%Y-%m-%dT%H:%M:%S.000Z") if isinstance(tgl, datetime.datetime) else str(tgl)
            no_ref = f"INV-BULANAN-{t_id}-{ref_counter}"
            ref_counter += 1

            sq_cur.execute("""
                INSERT INTO PembayaranBulanan (idTagihanBulanan, tglBayar, jumlahBayar, idUser, noRef)
                VALUES (?, ?, ?, ?, ?);
            """, (t_id, tgl_str, tarif, admin_uid, no_ref))
            cnt_pembayaran += 1

    print(f"Migrated {cnt_tagihan} TagihanBulanan rows.")
    print(f"Created {cnt_pembayaran} PembayaranBulanan records.")

    # 8. Kas
    ms_cur.execute("SELECT * FROM kas;")
    kas_rows = ms_cur.fetchall()
    for r in kas_rows:
        tgl = r['tgl'] or datetime.date.today()
        tgl_str = str(tgl) + "T00:00:00.000Z"
        uraian = r['keterangan'] or "Kas Migration"
        pemasukan = float(r['jumlah'] or 0)
        pengeluaran = float(r['keluar'] or 0)
        jenis = r['jenis'] if r['jenis'] in ['masuk', 'keluar'] else 'masuk'
        
        sq_cur.execute("""
            INSERT INTO Kas (id, tgl, uraian, pemasukan, pengeluaran, jenis, idUser, idPosBayar)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        """, (r['kode'], tgl_str, uraian, pemasukan, pengeluaran, jenis, admin_uid, None))
    print(f"Migrated {len(kas_rows)} Kas rows.")

    sqlite_conn.commit()
    sqlite_conn.execute("PRAGMA foreign_keys = ON;")
    
    print("\n==========================================")
    print("MIGRATION COMPLETED SUCCESSFULLY!")
    print("==========================================")

    for tbl in ["Pengaturan", "TahunAjaran", "Kelas", "Siswa", "User", "PosBayar", "JenisPembayaran", "TagihanBulanan", "PembayaranBulanan", "Kas"]:
        sq_cur.execute(f"SELECT COUNT(*) FROM `{tbl}`;")
        cnt = sq_cur.fetchone()[0]
        print(f"SQLite Table {tbl}: {cnt} rows")

    mysql_conn.close()
    sqlite_conn.close()

if __name__ == "__main__":
    migrate()
