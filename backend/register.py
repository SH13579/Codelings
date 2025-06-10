from flask import Flask, request, jsonify
import psycopg2
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

DB_HOST = 'ep-noisy-glitter-a54at3s3-pooler.us-east-2.aws.neon.tech'
DB_NAME = 'codelings'
DB_USER = os.getenv('PG_NEON_USER')
DB_PASS = os.getenv('PG_NEON_PASSWORD') #access environment variable PG_PASSWORD
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
  cursor = conn.cursor() #allow SQL to be used
except Exception as e:
  print('Error connecting to database:', e)

#route to handle registtration
@app.route('/register', methods=['POST'])
def register():
  global conn, cursor
  if not conn or not cursor:
    return jsonify({'error': 'Database connection not established'}), 500
  
  data = request.json
  username = data.get('username')
  email = data.get('email')
  password = data.get('password')  #reminder to hash passwords and sensitive info
  confirm_password = data.get('confirm_password')

  try:

    #even though handled in frontend, good practice to handle in backend
    #if fields are empty
    if not username or not email or not password or not confirm_password:
      return jsonify({'error': 'Missing username, email, or password'}), 400
    #if password does not match with confirm_password
    if password != confirm_password:
        return jsonify({'error': 'Passwords do not match'}), 400
    
    #check if username is taken
    cursor.execute('SELECT * FROM users WHERE username =%s', (username,)) #single element tuple. psycopg2 only accepts tuples
    if cursor.fetchone(): #fetch from database and check if username taken
      return jsonify({'error': 'Username is taken'}), 409
    
    #check if email is taken
    cursor.execute('SELECT * FROM users WHERE email =%s', (email,)) #single element tuple. psycopg2 only accepts tuples
    if cursor.fetchone(): #fetch from database and check if email taken
      return jsonify({'error': 'Email is taken'}), 409
    
    #insert new account
    cursor.execute(
        'INSERT INTO users (username, email, password) VALUES (%s, %s, %s)',
        (username, email, password)
    )
    conn.commit()
    return jsonify({'message': 'User registered successfully'}), 201
  except Exception as e:
      conn.rollback()
      return jsonify({'error': str(e)}), 500

#route to handle logging in
@app.route('/login', methods=['POST'])
def login():
  global conn, cursor
  if not conn or not cursor:
    return jsonify({'error': 'Database connection not established'}), 500
  
  data = request.json
  username = data.get('username')
  password = data.get('password')  #reminder to hash passwords and sensitive info

  try:
    cursor.execute('SELECT id, username FROM users WHERE username=%s AND password =%s', (username, password))
    user = cursor.fetchone()  #return whatever is selected in tuple (id, username)
    user_id, username = user
    if user: #check if username and password valid
      return jsonify({'username': username}), 200
    else:
      return jsonify({'error': 'Invalid username or password'}), 401
  except Exception as e:
    return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
  app.run(debug=True)
