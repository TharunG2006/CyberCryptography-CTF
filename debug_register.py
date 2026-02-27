import psycopg2
import os
import bcrypt
import uuid
from dotenv import load_dotenv

load_dotenv()

def debug_register():
    username = "debug_user_" + str(int(__import__('time').time()))
    email = "debug_" + str(int(__import__('time').time())) + "@example.com"
    contact = "1234567890"
    country_code = "+91"
    pwd = "Password123!"
    
    hashed_pw = bcrypt.hashpw(pwd.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    token = str(uuid.uuid4())
    
    print(f"--- Debugging Registration Logic ---")
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
        print("Executing INSERT...")
        cur.execute(
            "INSERT INTO users (username, email, contact_number, phone_country_code, password_hash, verification_token, is_verified, score, rank) VALUES (%s, %s, %s, %s, %s, %s, FALSE, 0, 'E') RETURNING id",
            (username, email, contact, country_code, hashed_pw, token)
        )
        user_id = cur.fetchone()[0]
        conn.commit()
        print(f"✅ INSERT Success: User ID {user_id}")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ INSERT FAILED: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_register()
