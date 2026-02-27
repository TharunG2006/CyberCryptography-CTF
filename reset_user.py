import psycopg2
import os
import bcrypt
from dotenv import load_dotenv

load_dotenv()

def reset_user():
    username = os.getenv('RESET_USERNAME', 'Tharun G')
    new_pwd = os.getenv('RESET_PASSWORD')
    
    if not new_pwd:
        print("❌ ERROR: RESET_PASSWORD environment variable not set.")
        return
    
    hashed_pw = bcrypt.hashpw(new_pwd.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    print(f"--- [SECURITY TRANSMISSION] Resetting User: {username} ---")
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
        
        # Check if user exists
        cur.execute("SELECT id FROM users WHERE username = %s", (username,))
        user = cur.fetchone()
        
        if user:
            print(f"User found (ID {user[0]}). Updating...")
            cur.execute(
                "UPDATE users SET password_hash = %s, is_verified = TRUE WHERE id = %s",
                (hashed_pw, user[0])
            )
            conn.commit()
            print("✅ Password reset to 'Tharun2006' and account VERIFIED.")
        else:
            print("❌ User 'Tharun G' not found.")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ DB Error: {e}")

if __name__ == "__main__":
    reset_user()
