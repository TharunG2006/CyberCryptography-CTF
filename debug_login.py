import psycopg2
import os
import bcrypt
from dotenv import load_dotenv

load_dotenv()

def debug_login(username, password):
    print(f"--- Debugging Login: {username} ---")
    try:
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST'),
            database=os.getenv('DB_NAME'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASS'),
            port=os.getenv('DB_PORT'),
            sslmode='require',
            connect_timeout=10
        )
        cur = conn.cursor()
        print("Querying user...")
        cur.execute("SELECT id, password_hash, username, email, is_verified, score, rank FROM users WHERE username = %s OR email = %s", (username, username))
        user = cur.fetchone()
        cur.close()
        conn.close()
        
        if not user:
            print("❌ User not found in DB.")
            return

        print(f"✅ User found: ID={user[0]}, Username={user[2]}, Verified={user[4]}")
        
        stored_hash = user[1]
        print(f"Stored Hash (type {type(stored_hash)}): {stored_hash}")
        
        # Manually check bcrypt
        try:
            is_match = bcrypt.checkpw(password.encode('utf-8'), stored_hash.encode('utf-8'))
            print(f"Bcrypt Match Result: {is_match}")
        except Exception as e:
            print(f"❌ Bcrypt Error: {e}")

    except Exception as e:
        print(f"❌ DB Error: {e}")

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 3:
        print("Usage: python debug_login.py <username> <password>")
    else:
        debug_login(sys.argv[1], sys.argv[2])
