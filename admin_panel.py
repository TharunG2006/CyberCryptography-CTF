import psycopg2
from psycopg2 import extras
import os
from dotenv import load_dotenv

load_dotenv()

def view_data():
    try:
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST'),
            database=os.getenv('DB_NAME'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASS'),
            port=os.getenv('DB_PORT'),
            sslmode='require'
        )
        cur = conn.cursor(cursor_factory=extras.DictCursor)
        
        print("\n" + "="*80)
        print("  SHADOW REALM ADMIN PANEL - PLAYER DATA".center(80))
        print("="*80)
        
        cur.execute("SELECT id, username, email, score, rank, is_verified, created_at FROM users ORDER BY score DESC;")
        rows = cur.fetchall()
        
        header = f"{'ID':<4} | {'Username':<15} | {'Score':<6} | {'Rank':<4} | {'Verified':<8} | {'Email'}"
        print(header)
        print("-" * 80)
        
        for row in rows:
            verified = "✅" if row['is_verified'] else "❌"
            print(f"{row['id']:<4} | {row['username']:<15} | {row['score']:<6} | {row['rank']:<4} | {verified:<8} | {row['email']}")
            
        print("="*80)
        print(f"Total Operatives: {len(rows)}")
        print("="*80 + "\n")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ Connection Error: {e}")

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "verify":
        if len(sys.argv) < 3:
            print("Usage: python admin_panel.py verify <user_id>")
        else:
            try:
                user_id = sys.argv[2]
                conn = psycopg2.connect(host=os.getenv('DB_HOST'), database=os.getenv('DB_NAME'), user=os.getenv('DB_USER'), password=os.getenv('DB_PASS'), port=os.getenv('DB_PORT'), sslmode='require')
                cur = conn.cursor()
                cur.execute("UPDATE users SET is_verified = TRUE WHERE id = %s", (user_id,))
                conn.commit()
                print(f"✅ User {user_id} verified successfully.")
                cur.close()
                conn.close()
            except Exception as e:
                print(f"❌ Error: {e}")
    else:
        view_data()
