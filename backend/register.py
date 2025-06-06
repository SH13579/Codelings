from flask import Flask, request, jsonify
import psycopg2
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# Database config
DB_HOST = 'localhost'
DB_NAME = 'test'
DB_USER = 'postgres'
DB_PASS = '' #reminder to set environment variable
DB_PORT = '5432'

#connect to PostgreSQL database
try:
  conn = psycopg2.connect(
    host=DB_HOST,
    dbname=DB_NAME,
    user=DB_USER,
    password=DB_PASS,
    port=DB_PORT
  )
  cursor = conn.cursor()
except Exception as e:
  print('Error connecting to database:', e)

@app.route('/register', methods=['POST'])
def register():
  global conn, cursor
  if not conn or not cursor:
    return jsonify({'error': 'Database connection not established'}), 500
  
  data = request.json
  username = data.get('username')
  email = data.get('email')
  password = data.get('password')  #reminder to hash passwords and sensitive info

  try:
    #check if username exists
    cursor.execute('SELECT * FROM accounts WHERE username =%s', (username,))
    if cursor.fetchone():
      return jsonify({'error': 'Username already exists'}), 409
    
    #insert new account
    cursor.execute(
        'INSERT INTO accounts (username, password) VALUES (%s, %s, %s)',
        (username, email, password)
    )
    conn.commit()
    return jsonify({'message': 'User registered successfully'}), 201
  except Exception as e:
      conn.rollback()
      return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
  app.run(debug=True)
