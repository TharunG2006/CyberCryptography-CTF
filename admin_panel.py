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
        
        cur.execute("""
            SELECT u.id, u.username, u.email, u.score, u.rank, u.is_verified,
                   (SELECT COUNT(*) FROM user_activity_logs WHERE user_id = u.id AND event_type = 'TAB_HIDDEN') as tab_switches
            FROM users u
            ORDER BY score DESC;
        """)
        rows = cur.fetchall()
        
        header = f"{'ID':<4} | {'Username':<15} | {'Score':<6} | {'Rank':<4} | {'Tabs':<5} | {'Verified':<8} | {'Email'}"
        print(header)
        print("-" * 80)
        
        for row in rows:
            verified = "✅" if row['is_verified'] else "❌"
            tabs = row['tab_switches']
            print(f"{row['id']:<4} | {row['username']:<15} | {row['score']:<6} | {row['rank']:<4} | {tabs:<5} | {verified:<8} | {row['email']}")
            
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
