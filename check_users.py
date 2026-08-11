import sqlite3
import json

conn = sqlite3.connect('/var/www/sisma_new/prisma/dev.db')
cursor = conn.cursor()
users = cursor.execute('SELECT id, username, namaLengkap, level FROM User').fetchall()
print("CURRENT USERS IN DB:", json.dumps(users, indent=2))
