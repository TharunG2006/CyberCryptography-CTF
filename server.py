from flask import Flask, request, jsonify, redirect
from flask_cors import CORS
import psycopg2
import bcrypt
import os
import re
import smtplib
import uuid
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_url_path='', static_folder='.')
CORS(app)  # Enable CORS for all routes

# SMTP Configuration (Placeholders)
SMTP_SERVER = "smtp.gmail.com" # Default for Edu/Gmail
SMTP_PORT = 587
MAIL_USERNAME = "24104039@nec.edu.in"
MAIL_PASSWORD = os.getenv('MAIL_PASSWORD') # User must provide this

def get_db_connection():
    try:
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST'),
            database=os.getenv('DB_NAME'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASS'),
            port=os.getenv('DB_PORT'),
            sslmode='require'
        )
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return None

def send_verification_email(to_email, token):
    if not MAIL_PASSWORD:
        print("DEBUG: MAIL_PASSWORD is missing in environment variables.")
        # For demo purposes, print the link
        print(f"VERIFICATION LINK: http://localhost:5000/api/verify_email/{token}")
        return

    try:
        print(f"DEBUG: Attempting to send email to {to_email} via {SMTP_SERVER}...")
        
        msg = MIMEMultipart()
        msg['From'] = MAIL_USERNAME
        msg['To'] = to_email
        msg['Subject'] = "Protocol: ARISE - Activate Your Account"

        verification_link = f"https://solobreach-ctf.vercel.app/api/verify_email/{token}"
        # Fallback for local testing
        if os.getenv('FLASK_ENV') == 'development':
             verification_link = f"http://127.0.0.1:5000/api/verify_email/{token}"

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

        print("DEBUG: Connecting to SMTP server...")
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        print("DEBUG: Logging in...")
        server.login(MAIL_USERNAME, MAIL_PASSWORD)
        print("DEBUG: Sending data...")
        server.sendmail(MAIL_USERNAME, to_email, msg.as_string())
        server.quit()
        print(f"SUCCESS: Verification email sent to {to_email}")
    except Exception as e:
        print(f"ERROR: Failed to send email. Reason: {e}")

@app.route('/')
def index():
    return app.send_static_file('login.html')

@app.route('/scoreboard')
def scoreboard():
    return app.send_static_file('scoreboard.html')

@app.route('/login')
def login_page():
    return app.send_static_file('login.html')

@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database unavailable'}), 500
    
    try:
        cur = conn.cursor()
        cur.execute("SELECT username, guild, score, rank FROM users ORDER BY score DESC LIMIT 10")
        rows = cur.fetchall()
        leaderboard = []
        for row in rows:
            leaderboard.append({
                'username': row[0],
                'guild': row[1],
                'score': row[2],
                'rank': row[3]
            })
        cur.close()
        conn.close()
        return jsonify(leaderboard), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    contact = data.get('contact')
    country_code = data.get('country_code', '+91')
    password = data.get('password')

    # Validation
    if not all([username, email, contact, password]):
        return jsonify({'error': 'Missing required fields'}), 400

    # Email Validation
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_regex, email):
        return jsonify({'error': 'Invalid email format'}), 400

    # Strict Phone Validation (10 Digits)
    if not re.match(r'^\d{10}$', contact):
        return jsonify({'error': 'Invalid contact number (Must be exactly 10 digits)'}), 400

    hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    verification_token = str(uuid.uuid4())

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database unavailable'}), 500

    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO users (username, email, contact_number, phone_country_code, password_hash, verification_token, is_verified, score, rank) VALUES (%s, %s, %s, %s, %s, %s, FALSE, 0, 'E') RETURNING id",
            (username, email, contact, country_code, hashed_pw, verification_token)
        )
        user_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()

        # Send Email
        send_verification_email(email, verification_token)

        return jsonify({'message': 'Registration successful. Please check your email to verify account.', 'user_id': user_id}), 201
    except psycopg2.errors.UniqueViolation:
        return jsonify({'error': 'Username or Email already exists'}), 409
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/verify_email/<token>', methods=['GET'])
def verify_email(token):
    conn = get_db_connection()
    if not conn:
        return "Database Error", 500
    
    try:
        cur = conn.cursor()
        cur.execute("UPDATE users SET is_verified = TRUE WHERE verification_token = %s RETURNING id", (token,))
        user_id = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        if user_id:
            # Redirect to verify page
            return redirect("/verify.html")
        else:
            return redirect("/verify.html?error=invalid")
    except Exception as e:
        return str(e), 500

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Missing credentials'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database unavailable'}), 500

    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT id, password_hash, username, email, is_verified FROM users WHERE username = %s OR email = %s", 
            (username, username)
        )
        user = cur.fetchone()
        cur.close()
        conn.close()

        if user:
            # Check Verification
            is_verified = user[4]
            if not is_verified:
                return jsonify({'error': 'Account not verified. Please check your email.'}), 403

            if bcrypt.checkpw(password.encode('utf-8'), user[1].encode('utf-8')):
                return jsonify({
                    'message': 'Login successful',
                    'user': {
                        'id': user[0],
                        'username': user[2],
                        'email': user[3]
                    }
                }), 200
            else:
                return jsonify({'error': 'Invalid credentials'}), 401
        else:
            return jsonify({'error': 'Invalid credentials'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# --- CHALLENGE SYSTEM DATA ---

@app.route('/api/challenges', methods=['GET'])
def get_challenges():
    user_id = request.args.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'User ID required'}), 400

    conn = get_db_connection()
    if not conn: return jsonify({'error': 'DB Error'}), 500

    try:
        cur = conn.cursor()
        
        # Get all challenges
        cur.execute("SELECT id, title, category, points, hint_cost, description, hint FROM challenges ORDER BY id ASC")
        challenges_data = cur.fetchall()

        # Get solved challenges for user
        cur.execute("SELECT challenge_id FROM user_solves WHERE user_id = %s", (user_id,))
        solved_ids = [row[0] for row in cur.fetchall()]

        # Get unlocked hints for user
        cur.execute("SELECT challenge_id FROM user_hints WHERE user_id = %s", (user_id,))
        unlocked_hints = [row[0] for row in cur.fetchall()]
        
        cur.close()
        conn.close()

        challenges_list = []
        for row in challenges_data:
            c_id = row[0]
            is_hint_unlocked = c_id in unlocked_hints
            
            challenges_list.append({
                'id': c_id,
                'title': row[1],
                'category': row[2],
                'points': row[3],
                'hint_cost': row[4],
                'solved': c_id in solved_ids,
                'hint_unlocked': is_hint_unlocked,
                'description': row[5],
                # Only send hint text if unlocked, else send None or masked
                'hint': row[6] if is_hint_unlocked else None
            })
            
        return jsonify(challenges_list), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/submit_flag', methods=['POST'])
def submit_flag():
    data = request.json
    user_id = data.get('user_id')
    challenge_id = data.get('challenge_id')
    submitted_flag = data.get('flag')

    if not all([user_id, challenge_id, submitted_flag]):
        return jsonify({'error': 'Missing data'}), 400

    conn = get_db_connection()
    try:
        cur = conn.cursor()
        
        # 1. Check if already solved
        cur.execute("SELECT 1 FROM user_solves WHERE user_id = %s AND challenge_id = %s", (user_id, challenge_id))
        if cur.fetchone():
            return jsonify({'message': 'Already Solved', 'correct': True, 'first_time': False}), 200

        # 2. Verify Flag
        cur.execute("SELECT flag, points FROM challenges WHERE id = %s", (challenge_id,))
        row = cur.fetchone()
        if not row:
            return jsonify({'error': 'Challenge not found'}), 404
        
        real_flag = row[0]
        points = row[1]

        # Case-insensitive comparison and whitespace stripping
        if submitted_flag.strip() == real_flag.strip():
            # Correct!
            # Record solve (Ignore conflict if repeat submission happens rapidly)
            # cursor should already handle repeats via earlier check, but good to be safe
            cur.execute("INSERT INTO user_solves (user_id, challenge_id) VALUES (%s, %s)", (user_id, challenge_id))
            
            # Update Score
            cur.execute("UPDATE users SET score = score + %s WHERE id = %s RETURNING score", (points, user_id))
            new_score = cur.fetchone()[0]

            # Calculate New Rank
            new_rank = 'E'
            if new_score >= 10000: new_rank = 'S'
            elif new_score >= 5000: new_rank = 'A'
            elif new_score >= 2500: new_rank = 'B'
            elif new_score >= 1000: new_rank = 'C'
            elif new_score >= 500: new_rank = 'D'

            # Update Rank
            cur.execute("UPDATE users SET rank = %s WHERE id = %s", (new_rank, user_id))
            
            conn.commit()
            cur.close()
            conn.close()
            return jsonify({
                'message': 'Flag Correct!', 
                'correct': True, 
                'first_time': True, 
                'points_added': points,
                'new_score': new_score,
                'new_rank': new_rank
            }), 200
        else:
            cur.close()
            conn.close()
            return jsonify({'message': 'Incorrect Flag', 'correct': False}), 400

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/unlock_hint', methods=['POST'])
def unlock_hint():
    data = request.json
    user_id = data.get('user_id')
    challenge_id = data.get('challenge_id')

    conn = get_db_connection()
    try:
        cur = conn.cursor()

        # Check if already unlocked
        cur.execute("SELECT 1 FROM user_hints WHERE user_id = %s AND challenge_id = %s", (user_id, challenge_id))
        if cur.fetchone():
            cur.execute("SELECT hint FROM challenges WHERE id = %s", (challenge_id,))
            hint = cur.fetchone()[0]
            return jsonify({'hint': hint, 'status': 'ALREADY_UNLOCKED'}), 200

        # Get cost and user score
        cur.execute("SELECT hint, hint_cost FROM challenges WHERE id = %s", (challenge_id,))
        row = cur.fetchone()
        hint = row[0]
        cost = row[1]

        cur.execute("SELECT score FROM users WHERE id = %s", (user_id,))
        user_score = cur.fetchone()[0]

        if user_score >= cost:
            # Deduct points
            cur.execute("UPDATE users SET score = score - %s WHERE id = %s", (cost, user_id))
            # Record unlock
            cur.execute("INSERT INTO user_hints (user_id, challenge_id) VALUES (%s, %s)", (user_id, challenge_id))
            conn.commit()
            
            cur.close()
            conn.close()
            return jsonify({'hint': hint, 'status': 'UNLOCKED', 'check_deducted': cost}), 200
        else:
            cur.close()
            conn.close()
            return jsonify({'error': 'Insufficient Points'}), 403

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
