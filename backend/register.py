from flask import Flask, request
import psycopg2
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
DB_HOST = 'localhost'
DB_NAME = 'IGNORE THIS'
DB_USER = 'postgres'
DB_PASS = 'IGNORE THIS'
DB_PORT = '5432'

try:
  conn = psycopg2.connect(
    host=DB_HOST,
    dbname=DB_NAME,
    user=DB_USER,
    password=DB_PASS,
    port=DB_PORT
  )
  cursor = conn.cursor() #allow SQL
except Exception as e:
  print('Error connecting to database:', e)

def register():
  data = request.json
  username = data.get('username')
  password = data.get('password')

  try:
    cursor.execute(
      'INSERT INTO users (username, password) VALUES (%s, %s)',
      (username, password)
    )
    conn.commit()
  
  except Exception as e:
    print('Error registering:', e)

if __name__ == '__main__':
  app.run(debug=True)