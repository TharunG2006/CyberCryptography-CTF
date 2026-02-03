import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

# Challenge Data Parsed from User Request
challenges = [
    # EASY (1-5) - 100 Pts
    {
        "id": 1, "title": "Greatest Common Divisor", "category": "Easy", "points": 100,
        "description": "Given the integers: a = 756, b = 420. Using the Euclidean Algorithm, compute gcd(a, b). Submit only the numerical value.",
        "flag": "flag{84}", "hint": "The Euclidean algorithm is based on the principle that the greatest common divisor of two numbers does not change if the larger number is replaced by its difference with the smaller number.", "hint_cost": 10
    },
    {
        "id": 2, "title": "Solving a Congruence", "category": "Easy", "points": 100,
        "description": "Solve the congruence: 7x ≡ 21 (mod 28). Find the smallest non-negative solution for x.",
        "flag": "flag{3}", "hint": "Divide the entire equation by the greatest common divisor of the coefficient and modulus.", "hint_cost": 10
    },
    {
        "id": 3, "title": "Modular Exponentiation", "category": "Easy", "points": 100,
        "description": "Using Fermat’s Little Theorem, evaluate: 5^100 mod 13",
        "flag": "flag{1}", "hint": "Fermat's Little Theorem states that if p is a prime number, then for any integer a, a^p ≡ a (mod p).", "hint_cost": 10
    },
    {
        "id": 4, "title": "Shift Cipher Decryption", "category": "Easy", "points": 100,
        "description": "The following text was encrypted using a Caesar cipher with an unknown shift: WKLV LV D VHFUHW. Decrypt the message.",
        "flag": "flag{this_is_a_secret}", "hint": "Try shifting the letters back by 3.", "hint_cost": 10
    },
    {
        "id": 5, "title": "Substitution Cipher", "category": "Easy", "points": 100,
        "description": "The message below was encrypted using a monoalphabetic substitution cipher: UIJT JT B TBNQMF NFTTBHF. Decrypt the message.",
        "flag": "flag{this_is_a_sample_message}", "hint": "Analyze letter frequency or try a simple shift related to the previous letter.", "hint_cost": 10
    },

    # MEDIUM (6-10) - 250 Pts
    {
        "id": 6, "title": "Modular Inverse Computation", "category": "Medium", "points": 250,
        "description": "Using the Extended Euclidean Algorithm, find the modular inverse of: 17 mod 3120",
        "flag": "flag{2753}", "hint": "The extended Euclidean algorithm finds integers x and y such that ax + by = gcd(a, b).", "hint_cost": 25
    },
    {
        "id": 7, "title": "System of Congruences", "category": "Medium", "points": 250,
        "description": "Find the smallest positive integer x that satisfies: x ≡ 2 (mod 5), x ≡ 3 (mod 7), x ≡ 4 (mod 9)",
        "flag": "flag{157}", "hint": "Use the Chinese Remainder Theorem.", "hint_cost": 25
    },
    {
        "id": 8, "title": "Primality Verification", "category": "Medium", "points": 250,
        "description": "Use Fermat’s Primality Test to test whether: n = 341 is prime or composite.",
        "flag": "flag{prime}", "hint": "Be careful, 341 is a pseudoprime.", "hint_cost": 25
    },
    {
        "id": 9, "title": "Vigenère Cipher", "category": "Medium", "points": 250,
        "description": "The ciphertext below was generated using a Vigenère cipher: LXFOPVEFRNHR. Assume the key is a valid English word of length 5. Decrypt the message.",
        "flag": "flag{attackatdawn}", "hint": "Key length is 5. Try common 5-letter words.", "hint_cost": 25
    },
    {
        "id": 10, "title": "Digraph Substitution", "category": "Medium", "points": 250,
        "description": "A Playfair cipher was constructed using the key: MONARCHY. Decrypt the following ciphertext: GATLMZCLRQTX",
        "flag": "flag{instruments}", "hint": "Construct the 5x5 Playfair matrix with MONARCHY first.", "hint_cost": 25
    },

    # HARD (11-15) - 500 Pts
    {
        "id": 11, "title": "Generator of a Finite Field", "category": "Hard", "points": 500,
        "description": "Let: p = 29. Determine the smallest primitive root modulo p.",
        "flag": "flag{2}", "hint": "Check orders of elements starting from 2.", "hint_cost": 50
    },
    {
        "id": 12, "title": "Strong Primality Test", "category": "Hard", "points": 500,
        "description": "Apply the Miller–Rabin primality test to determine whether: n = 561 is prime or composite.",
        "flag": "flag{composite}", "hint": "561 is a Carmichael number.", "hint_cost": 50
    },
    {
        "id": 13, "title": "Matrix-Based Cipher Decryption", "category": "Hard", "points": 500,
        "description": "A Hill cipher was used with the encryption matrix: [ 3 3 ] [ 2 5 ]. The ciphertext obtained is: POH. Decrypt the plaintext using modulo 26 arithmetic.",
        "flag": "flag{act}", "hint": "Find the inverse of the matrix modulo 26.", "hint_cost": 50
    },
    {
        "id": 14, "title": "Key Reuse Vulnerability", "category": "Hard", "points": 500,
        "description": "Two plaintext messages were encrypted using the same one-time pad key. Explain why this violates the security of the one-time pad and recover the plaintext relationship. Submit the recovered message.",
        "flag": "flag{key_reuse_leaks_plaintext}", "hint": "XORing two ciphertexts encrypted with the same OTP key reveals the XOR of the plaintexts.", "hint_cost": 50
    },
    {
        "id": 15, "title": "Failure of Fermat Test", "category": "Hard", "points": 500,
        "description": "Show that: n = 561 passes Fermat’s Primality Test for multiple bases but is not prime. Classify the number.",
        "flag": "flag{carmichael_number}", "hint": "It behaves like a prime regarding Fermat's Little Theorem.", "hint_cost": 50
    },

    # EXTREME (16-17) - 1000 Pts
    {
        "id": 16, "title": "Existence of Inverse", "category": "Extreme", "points": 1000,
        "description": "Determine whether the modular inverse of: a = 84 mod 180 exists. Justify your answer using number-theoretic reasoning.",
        "flag": "flag{does_not_exist}", "hint": "Check the GCD of 84 and 180.", "hint_cost": 100
    },
    {
        "id": 17, "title": "Perfect Secrecy Conditions", "category": "Extreme", "points": 1000,
        "description": "The Vernam cipher is proven to be perfectly secure under certain conditions. Identify all conditions required for perfect secrecy and explain why violating them compromises security. Submit your answer concisely.",
        "flag": "flag{random_key_same_length_used_once}", "hint": "Shannon's criteria for perfect secrecy.", "hint_cost": 100
    }
]

def seed():
    try:
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST'),
            database=os.getenv('DB_NAME'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASS'),
            port=os.getenv('DB_PORT'),
            sslmode='require'
        )
        conn.autocommit = True
        cur = conn.cursor()

        print("--- Setting up Challenge Tables ---")

        # 1. table: challenges
        cur.execute("""
            CREATE TABLE IF NOT EXISTS challenges (
                id SERIAL PRIMARY KEY,
                title VARCHAR(100),
                description TEXT,
                category VARCHAR(50),
                points INTEGER,
                flag VARCHAR(100),
                hint TEXT,
                hint_cost INTEGER
            );
        """)
        print("✅ Table 'challenges' ensured.")

        # 2. table: user_solves
        cur.execute("""
            CREATE TABLE IF NOT EXISTS user_solves (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                challenge_id INTEGER REFERENCES challenges(id),
                solved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, challenge_id)
            );
        """)
        print("✅ Table 'user_solves' ensured.")

        # 3. table: user_hints
        cur.execute("""
            CREATE TABLE IF NOT EXISTS user_hints (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                challenge_id INTEGER REFERENCES challenges(id),
                unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, challenge_id)
            );
        """)
        print("✅ Table 'user_hints' ensured.")

        print("\n--- Seeding Questions ---")
        for c in challenges:
            # Check if exists to avoid duplicates (based on ID or Title)
            # We will use upsert style or delete all first? 
            # Safer to Upsert on ID if possible, or just delete row with that ID and re-insert.
            
            # For simplicity in this script, let's Check then Insert/Update
            cur.execute("SELECT id FROM challenges WHERE id = %s", (c['id'],))
            exists = cur.fetchone()

            if exists:
                cur.execute("""
                    UPDATE challenges SET 
                        title=%s, description=%s, category=%s, points=%s, flag=%s, hint=%s, hint_cost=%s
                    WHERE id=%s
                """, (c['title'], c['description'], c['category'], c['points'], c['flag'], c['hint'], c['hint_cost'], c['id']))
                print(f"Updated Q{c['id']}: {c['title']}")
            else:
                cur.execute("""
                    INSERT INTO challenges (id, title, description, category, points, flag, hint, hint_cost)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, (c['id'], c['title'], c['description'], c['category'], c['points'], c['flag'], c['hint'], c['hint_cost']))
                print(f"Inserted Q{c['id']}: {c['title']}")

        cur.close()
        conn.close()
        print("\n✅ Database Seeding Complete.")
    
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    seed()
