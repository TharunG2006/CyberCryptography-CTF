from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
import bcrypt
import os
import re
import traceback
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_url_path='', static_folder='.')
CORS(app)  # Enable CORS for all routes

def get_db_connection():
    print(f"DEBUG: Connecting to DB Host: {os.getenv('DB_HOST')}, User: {os.getenv('DB_USER')}, DB: {os.getenv('DB_NAME')}, Port: {os.getenv('DB_PORT')}")
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
    except Exception:
        print("CRITICAL ERROR: Failed to connect to database.")
        print(traceback.format_exc())
        return None

def init_db():
    conn = get_db_connection()
    if conn:
        try:
            cur = conn.cursor()
            with open('schema.sql', 'r') as f:
                cur.execute(f.read())
            conn.commit()
            cur.close()
            conn.close()
            print("Database initialized.")
        except Exception as e:
            print(f"Error initializing schema: {e}")

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
    contact = data.get('contact') # Contact Number
    password = data.get('password')

    # Validation
    if not all([username, email, contact, password]):
        return jsonify({'error': 'Missing required fields'}), 400

    # Email Validation
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_regex, email):
        return jsonify({'error': 'Invalid email format'}), 400

    # Contact Number Validation (Basic: 10-15 digits)
    if not re.match(r'^\d{10,15}$', contact):
        return jsonify({'error': 'Invalid contact number (must be 10-15 digits)'}), 400

    hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database unavailable'}), 500

    try:
        cur = conn.cursor()
        # Default Rank E, Score 0
        cur.execute(
            "INSERT INTO users (username, email, contact_number, password_hash, score, rank) VALUES (%s, %s, %s, %s, 0, 'E') RETURNING id",
            (username, email, contact, hashed_pw)
        )
        user_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({'message': 'Registration successful', 'user_id': user_id}), 201
    except psycopg2.errors.UniqueViolation:
        return jsonify({'error': 'Username or Email already exists'}), 409
    except Exception as e:
        return jsonify({'error': str(e)}), 500

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
            "SELECT id, password_hash, username, email FROM users WHERE username = %s OR email = %s OR contact_number = %s", 
            (username, username, username)
        )
        user = cur.fetchone()
        cur.close()
        conn.close()

        if user and bcrypt.checkpw(password.encode('utf-8'), user[1].encode('utf-8')):
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
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
