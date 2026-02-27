import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def verify():
    conn = psycopg2.connect(
        host=os.getenv('DB_HOST'),
        database=os.getenv('DB_NAME'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASS'),
        port=os.getenv('DB_PORT'),
        sslmode='require'
    )
    cur = conn.cursor()
    cur.execute('SELECT id, title, flag FROM challenges ORDER BY id ASC LIMIT 5')
    rows = cur.fetchall()
    print("--- FIRST 5 CHALLENGES ---")
    for r in rows:
        print(f"ID {r[0]} | {r[1]}: {r[2]}")
    
    cur.execute('SELECT id, title, flag FROM challenges WHERE id = 17')
    r = cur.fetchone()
    print(f"ID {r[0]} | {r[1]}: {r[2]}")
    
    cur.close()
    conn.close()

if __name__ == "__main__":
    verify()
