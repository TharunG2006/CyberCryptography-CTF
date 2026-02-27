from flask import Flask, request, jsonify, redirect
from flask_cors import CORS
import psycopg2
from psycopg2 import pool
import bcrypt
import os
import re
import smtplib
import uuid
import threading
import queue
import time
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# SMTP Configuration
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
MAIL_USERNAME = os.getenv('MAIL_USERNAME', '24104039@nec.edu.in')
MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')

# Database Connection Pool
# Vercel Adjustment: Vercel auto-scales instances. 
# Large pools per instance will crash Supabase. 
# We use 3 for Vercel, 20 for local production.
IS_VERCEL = os.getenv('VERCEL') == '1' or 'VERCEL' in os.environ
POOL_SIZE = 2 if IS_VERCEL else 10 # Drastically reduced for Vercel scaling

db_pool = None

def init_db_pool():
    global db_pool
    if db_pool:
        return True
    
    try:
        host = os.getenv('DB_HOST')
        port = os.getenv('DB_PORT', '5432') # Default to AWS RDS port
        print(f"📡 INITIALIZING DB POOL: {host}:{port} (Pool Size: {POOL_SIZE})...")
        
        db_pool = pool.ThreadedConnectionPool(
            1, POOL_SIZE,
            host=host,
            database=os.getenv('DB_NAME'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASS'),
            port=port,
            sslmode='require',
            connect_timeout=10
        )
        print("✅ DB CONNECTION POOL READY")
        return True
    except Exception as e:
        print(f"⚠️  LAZY_CONNECT FAILED: {e}")
        return False

@app.route('/health')
@app.route('/api/health')
def health():
    db_status = "Online" if db_pool else "Offline (Will connect on demand)"
    return jsonify({
        "status": "Running",
        "database": db_status,
        "env": "Vercel" if IS_VERCEL else "Local",
        "timestamp": datetime.now().isoformat()
    })

def get_db_connection():
    global db_pool
    if not db_pool:
        init_db_pool()
    
    if not db_pool:
        return None
        
    try:
        return db_pool.getconn()
    except Exception as e:
        print(f"❌ Error getting connection: {e}")
        return None

def release_db_connection(conn):
    if db_pool and conn:
        try:
            db_pool.putconn(conn)
        except:
            pass

SCHEMA_FEATURES = {
    "users_last_solve_at": False,
    "user_solves_solved_at": False,
}

def parse_json_body():
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else {}

def detect_schema_features():
    conn = get_db_connection()
    if not conn:
        return

    try:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT table_name, column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND (
                (table_name = 'users' AND column_name = 'last_solve_at')
                OR (table_name = 'user_solves' AND column_name = 'solved_at')
              );
            """
        )
        for table_name, column_name in cur.fetchall():
            if table_name == "users" and column_name == "last_solve_at":
                SCHEMA_FEATURES["users_last_solve_at"] = True
            if table_name == "user_solves" and column_name == "solved_at":
                SCHEMA_FEATURES["user_solves_solved_at"] = True
        cur.close()
        print(f"Schema features: {SCHEMA_FEATURES}")
    except Exception as e:
        print(f"Warning: Could not detect schema features: {e}")
    finally:
        release_db_connection(conn)

# --- GLOBAL STATUS CACHE ---
# This drastically reduces latency for users in different regions (e.g. Mumbai vs Stockholm)
_LOCK_CACHE = {'value': True, 'expiry': 0}

def is_event_locked():
    global _LOCK_CACHE
    now = time.time()
    
    # Check cache (2 second ttl)
    if now < _LOCK_CACHE['expiry']:
        return _LOCK_CACHE['value']
    
    conn = get_db_connection()
    if not conn: return _LOCK_CACHE['value'] # Return last known or default
    try:
        cur = conn.cursor()
        cur.execute("SELECT value FROM site_settings WHERE key = 'event_locked'")
        res = cur.fetchone()
        cur.close()
        locked = res[0] == 'true' if res else True
        
        # Update cache
        _LOCK_CACHE = {'value': locked, 'expiry': now + 2}
        return locked
    except:
        return _LOCK_CACHE['value']
    finally:
        release_db_connection(conn)

def ensure_schema_ready():
    global _SCHEMA_DETECTED
    if not _SCHEMA_DETECTED:
        detect_schema_features()
        _SCHEMA_DETECTED = True

def send_verification_email_sync(to_email, token):
    print(f"📧 [DEBUG] Starting SMTP transmission for: {to_email}")
    if not MAIL_PASSWORD:
        print(f"❌ [DEBUG] MAIL_PASSWORD missing. VERIFICATION LINK: http://localhost:3000/api/verify_email/{token}")
        return

    try:
        msg = MIMEMultipart()
        msg['From'] = MAIL_USERNAME
        msg['To'] = to_email
        msg['Subject'] = "Protocol: ARISE - Activate Your Account"
        
        # Determine environment for email link
        # Use our reliable IS_VERCEL check
        domain = "https://solobreach-ctf.vercel.app" if IS_VERCEL else "http://localhost:3000"
        verification_link = f"{domain}/api/verify_email/{token}"

        body = f"""
        <html>
        <body style="background-color: #050914; color: #e0e6ed; font-family: sans-serif; padding: 20px;">
            <div style="max-width: 600px; margin: auto; border: 1px solid #2de2e6; padding: 20px; border-radius: 5px;">
                <h2 style="color: #2de2e6; text-align: center;">SYSTEM ACCESS REQUEST</h2>
                <p>Hunter,</p>
                <p>An awakening request coordinates for your identity.</p>
                <p>Click the link below to verify your frequency:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{verification_link}" style="background-color: #2de2e6; color: #000; padding: 10px 20px; text-decoration: none; font-weight: bold; display: inline-block;">INITIATE AWAKENING</a>
                </div>
                <p style="color: #8b9bb4; font-size: 12px;">If you did not request this, ignore this transmission.</p>
            </div>
        </body>
        </html>
        """
        msg.attach(MIMEText(body, 'html'))
        print(f"🔗 [DEBUG] Connecting to SMTP Server: {SMTP_SERVER}:{SMTP_PORT}")
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=15)
        server.starttls()
        print(f"🔐 [DEBUG] Logging in as: {MAIL_USERNAME}")
        server.login(MAIL_USERNAME, MAIL_PASSWORD)
        print(f"📤 [DEBUG] Sending email to: {to_email}")
        server.sendmail(MAIL_USERNAME, to_email, msg.as_string())
        server.quit()
        print(f"✅ [DEBUG] Email successfully sent to: {to_email}")
    except Exception as e:
        print(f"ERROR: Failed to send email to {to_email}. Reason: {e}")

# --- BACKGROUND EMAIL QUEUE SYSTEM ---
MAIL_QUEUE = queue.Queue()

def mail_worker():
    """Background worker to send emails one by one from the queue."""
    print("🚀 EMAIL WORKER STARTED")
    while True:
        try:
            # Wait for an email task
            to_email, token = MAIL_QUEUE.get()
            print(f"📧 Processing email for: {to_email}")
            send_verification_email_sync(to_email, token)
            MAIL_QUEUE.task_done()
            # Small delay to be polite to Gmail SMTP
            time.sleep(1) 
        except Exception as e:
            print(f"❌ Email Worker Error: {e}")
            time.sleep(5)

# Start the email worker thread immediately
daemon_worker = threading.Thread(target=mail_worker, daemon=True)
daemon_worker.start()

def send_verification_email(to_email, token):
    """Pushes email task to the background queue or sends synchronously if on Vercel."""
    if IS_VERCEL:
        print(f"⚡ [PRODUCTION] Sending synchronous email for: {to_email}")
        send_verification_email_sync(to_email, token)
    else:
        print(f"📥 [DEBUG] Enqueuing verification email for: {to_email}")
        MAIL_QUEUE.put((to_email, token))
        print(f"📊 [DEBUG] Queue size: {MAIL_QUEUE.qsize()}")

@app.route('/')
def index():
    return jsonify({"message": "Protocol: ARISE Backend Online", "status": "active"})

@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    if is_event_locked():
        return jsonify({'error': 'Event is currently encrypted. Check back later.'}), 403
    
    ensure_schema_ready()
    conn = get_db_connection()
    if not conn: return jsonify({'error': 'Database unavailable'}), 500
    try:
        cur = conn.cursor()
        if SCHEMA_FEATURES["users_last_solve_at"]:
            cur.execute("SELECT username, guild, score, rank FROM users ORDER BY score DESC, last_solve_at ASC LIMIT 10")
        else:
            cur.execute("SELECT username, guild, score, rank FROM users ORDER BY score DESC LIMIT 10")
        
        rows = cur.fetchall()
        cur.close()
        leaderboard = [{'username': r[0], 'guild': r[1], 'score': r[2], 'rank': r[3]} for r in rows]
        return jsonify(leaderboard), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        release_db_connection(conn)

@app.route('/api/register', methods=['POST'])
def register():
    data = parse_json_body()
    username, email, contact, pwd = data.get('username'), data.get('email'), data.get('contact'), data.get('password')
    country_code = data.get('country_code', '+91')

    if not all([username, email, contact, pwd]):
        return jsonify({'error': 'Missing fields'}), 400

    # Sanitize contact
    contact = re.sub(r'\D', '', str(contact))
    
    hashed_pw = bcrypt.hashpw(pwd.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    token = str(uuid.uuid4())

    conn = get_db_connection()
    if not conn: return jsonify({'error': 'Database unavailable'}), 500
    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO users (username, email, contact_number, phone_country_code, password_hash, verification_token, is_verified, score, rank) VALUES (%s, %s, %s, %s, %s, %s, FALSE, 0, 'E') RETURNING id",
            (username, email, contact, country_code, hashed_pw, token)
        )
        user_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        send_verification_email(email, token)
        return jsonify({'message': 'Registration successful.', 'user_id': user_id}), 201
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        return jsonify({'error': 'Username or Email already exists'}), 409
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        release_db_connection(conn)

@app.route('/api/verify_email/<token>', methods=['GET'])
def verify_email(token):
    conn = get_db_connection()
    if not conn: return "DB Error", 500
    try:
        cur = conn.cursor()
        cur.execute("UPDATE users SET is_verified = TRUE WHERE verification_token = %s RETURNING id", (token,))
        row = cur.fetchone()
        conn.commit()
        cur.close()
        
        # Consistent redirect for all environments
        base_url = "https://solobreach-ctf.vercel.app" if IS_VERCEL else "http://localhost:3000"
        
        if row:
            return redirect(f"{base_url}/login?verified=true")
        return redirect(f"{base_url}/login?error=invalid")
    except Exception as e:
        conn.rollback()
        return str(e), 500
    finally:
        release_db_connection(conn)

@app.route('/api/login', methods=['POST'])
def login():
    data = parse_json_body()
    username, password = data.get('username'), data.get('password')
    if not username or not password:
        return jsonify({'error': 'Missing credentials'}), 400

    conn = get_db_connection()
    if not conn: return jsonify({'error': 'DB Error'}), 500
    try:
        cur = conn.cursor()
        cur.execute("SELECT id, password_hash, username, email, is_verified, score, rank FROM users WHERE username = %s OR email = %s", (username, username))
        user = cur.fetchone()
        cur.close()
        
        if user:
            if not user[4]: return jsonify({'error': 'Account not verified'}), 403
            if bcrypt.checkpw(password.encode('utf-8'), user[1].encode('utf-8')):
                return jsonify({
                    'message': 'Login successful',
                    'user': {
                        'id': user[0], 'username': user[2], 'email': user[3], 'score': user[5], 'rank': user[6]
                    }
                }), 200
        return jsonify({'error': 'Invalid credentials'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        release_db_connection(conn)

@app.route('/api/challenges', methods=['GET'])
def get_challenges():
    if is_event_locked():
        return jsonify({'error': 'Event is currently encrypted. Access denied.', 'status': 'locked'}), 403
    
    ensure_schema_ready()
    u_id = request.args.get('user_id')
    if not u_id: return jsonify({'error': 'User ID required'}), 400
    
    conn = get_db_connection()
    if not conn: return jsonify({'error': 'DB Error'}), 500
    try:
        cur = conn.cursor()
        cur.execute("SELECT id, title, category, points, hint_cost, description, hint FROM challenges ORDER BY id ASC")
        challenges_data = cur.fetchall()
        cur.execute("SELECT challenge_id FROM user_solves WHERE user_id = %s", (u_id,))
        solved_ids = [row[0] for row in cur.fetchall()]
        cur.execute("SELECT challenge_id FROM user_hints WHERE user_id = %s", (u_id,))
        unlocked_hints = [row[0] for row in cur.fetchall()]
        cur.close()
        res = []
        for r in challenges_data:
            c_id = r[0]
            is_unlocked = c_id in unlocked_hints
            res.append({
                'id': c_id, 'title': r[1], 'category': r[2], 'points': r[3], 'hint_cost': r[4],
                'solved': c_id in solved_ids, 'hint_unlocked': is_unlocked, 'description': r[5],
                'hint': r[6] if is_unlocked else None
            })
        return jsonify(res), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        release_db_connection(conn)

@app.route('/api/submit_flag', methods=['POST'])
def submit_flag():
    if is_event_locked():
        return jsonify({'error': 'Event is currently encrypted. Transmission blocked.'}), 403
    
    ensure_schema_ready()
    data = parse_json_body()
    u_id, c_id, flag = data.get('user_id'), data.get('challenge_id'), data.get('flag')
    if not all([u_id, c_id, flag]): return jsonify({'error': 'Missing fields'}), 400

    conn = get_db_connection()
    if not conn: return jsonify({'error': 'DB Error'}), 500
    try:
        cur = conn.cursor()
        cur.execute("SELECT 1 FROM user_solves WHERE user_id = %s AND challenge_id = %s", (u_id, c_id))
        if cur.fetchone(): return jsonify({'message': 'Already Solved', 'correct': True}), 200

        cur.execute("SELECT flag, points FROM challenges WHERE id = %s", (c_id,))
        row = cur.fetchone()
        if not row: return jsonify({'error': 'Not found'}), 404
        
        if flag.strip() == row[0].strip():
            now = datetime.now()
            if SCHEMA_FEATURES["user_solves_solved_at"]:
                cur.execute("INSERT INTO user_solves (user_id, challenge_id, solved_at) VALUES (%s, %s, %s)", (u_id, c_id, now))
            else:
                cur.execute("INSERT INTO user_solves (user_id, challenge_id) VALUES (%s, %s)", (u_id, c_id))

            if SCHEMA_FEATURES["users_last_solve_at"]:
                cur.execute("UPDATE users SET score = score + %s, last_solve_at = %s WHERE id = %s RETURNING score", (row[1], now, u_id))
            else:
                cur.execute("UPDATE users SET score = score + %s WHERE id = %s RETURNING score", (row[1], u_id))
            
            new_score = cur.fetchone()[0]
            ranks = [('S', 3000), ('A', 1500), ('B', 800), ('C', 400), ('D', 100)]
            new_rank = next((r[0] for r in ranks if new_score >= r[1]), 'E')
            cur.execute("UPDATE users SET rank = %s WHERE id = %s", (new_rank, u_id))
            conn.commit()
            return jsonify({'message': 'Correct!', 'correct': True, 'points': row[1], 'new_score': new_score, 'new_rank': new_rank}), 200
        return jsonify({'message': 'Incorrect', 'correct': False}), 400
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        release_db_connection(conn)

@app.route('/api/unlock_hint', methods=['POST'])
def unlock_hint():
    data = parse_json_body()
    u_id, c_id = data.get('user_id'), data.get('challenge_id')
    if not all([u_id, c_id]):
        return jsonify({'error': 'Missing fields'}), 400
    conn = get_db_connection()
    if not conn: return jsonify({'error': 'DB Error'}), 500
    try:
        cur = conn.cursor()
        cur.execute("SELECT 1 FROM user_hints WHERE user_id = %s AND challenge_id = %s", (u_id, c_id))
        if cur.fetchone():
            cur.execute("SELECT hint FROM challenges WHERE id = %s", (c_id,))
            hint_row = cur.fetchone()
            if not hint_row:
                return jsonify({'error': 'Challenge not found'}), 404
            return jsonify({'hint': hint_row[0], 'status': 'EXISTING'}), 200

        cur.execute("SELECT hint, hint_cost FROM challenges WHERE id = %s", (c_id,))
        r = cur.fetchone()
        if not r:
            return jsonify({'error': 'Challenge not found'}), 404
        cur.execute("SELECT score FROM users WHERE id = %s", (u_id,))
        user_row = cur.fetchone()
        if not user_row:
            return jsonify({'error': 'User not found'}), 404
        u_score = user_row[0]

        if u_score >= r[1]:
            cur.execute("UPDATE users SET score = score - %s WHERE id = %s", (r[1], u_id))
            cur.execute("INSERT INTO user_hints (user_id, challenge_id) VALUES (%s, %s)", (u_id, c_id))
            conn.commit()
            return jsonify({'hint': r[0], 'status': 'UNLOCKED'}), 200
        return jsonify({'error': 'Insufficient Points'}), 403
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        release_db_connection(conn)

@app.route('/api/site-status', methods=['GET'])
def get_site_status():
    locked = is_event_locked()
    return jsonify({'event_locked': locked}), 200

@app.route('/api/admin/toggle', methods=['POST'])
def toggle_lock():
    data = parse_json_body()
    admin_key = data.get('admin_key')
    lock = data.get('lock') # True to lock, False to unlock
    
    expected_key = os.getenv('ADMIN_PASSWORD')
    
    if admin_key != expected_key:
        return jsonify({'error': 'Unauthorized'}), 401
    
    new_status = 'true' if data.get('lock') else 'false'
    conn = get_db_connection()
    if not conn: return jsonify({'error': 'DB Error'}), 500
    try:
        cur = conn.cursor()
        cur.execute("UPDATE site_settings SET value = %s WHERE key = 'event_locked'", (new_status,))
        conn.commit()
        cur.close()
        return jsonify({'message': f'Event lock set to {new_status}', 'event_locked': data.get('lock')}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        release_db_connection(conn)

@app.route('/api/admin/users', methods=['GET'])
def get_admin_users():
    admin_key = request.args.get('admin_key')
    expected_key = os.getenv('ADMIN_PASSWORD')
    
    if admin_key != expected_key:
        return jsonify({'error': 'Unauthorized'}), 401
        
    conn = get_db_connection()
    if not conn: return jsonify({'error': 'DB Error'}), 500
    try:
        cur = conn.cursor()
        query = """
            SELECT username, email, contact_number, phone_country_code, score, rank, is_verified, last_solve_at 
            FROM users 
            ORDER BY score DESC, last_solve_at ASC NULLS LAST
        """
        cur.execute(query)
        rows = cur.fetchall()
        users = []
        for r in rows:
            users.append({
                'username': r[0],
                'email': r[1],
                'contact': f"{r[3]}{r[2]}",
                'score': r[4],
                'rank': r[5],
                'is_verified': r[6],
                'last_solve_at': r[7].isoformat() if r[7] else None
            })
        cur.close()
        return jsonify(users), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        release_db_connection(conn)

if __name__ == '__main__':
    # detect_schema_features() - Now called lazily via ensure_schema_ready()
    app.run(debug=False, port=5000)
