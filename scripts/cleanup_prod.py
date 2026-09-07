import sqlite3
import os

db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "prisma", "dev.db")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 1. Clean SISWA-% placeholders
cursor.execute("UPDATE Siswa SET nis = NULL WHERE nis LIKE 'SISWA-%'")

# 2. Update user roles
cursor.execute("UPDATE User SET level = 'admin' WHERE username = 'admin'")
cursor.execute("UPDATE User SET level = 'bendahara' WHERE username IN ('erwin', 'oza', 'tina')")

conn.commit()

null_nis = cursor.execute("SELECT COUNT(*) FROM Siswa WHERE nis IS NULL").fetchone()[0]
print(f"Production DB updated successfully! Null NIS count: {null_nis}")

users = cursor.execute("SELECT id, username, namaLengkap, level FROM User").fetchall()
print("Updated User levels:", users)

conn.close()
