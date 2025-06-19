from flask import Flask, request, jsonify
import psycopg2
from flask_cors import CORS
import datetime
import os
import jwt
from functools import wraps
import math

app = Flask(__name__)
CORS(app)

# DB_HOST = 'ep-noisy-glitter-a54at3s3-pooler.us-east-2.aws.neon.tech'
# DB_NAME = 'codelings'
# DB_USER = os.getenv('PG_NEON_USER')
# DB_PASS = os.getenv('PG_NEON_PASSWORD') #access environment variable PG_PASSWORD
# DB_PORT = '5432'

DB_HOST = 'localhost'
DB_NAME = 'codelings'
DB_USER = 'postgres'
DB_PASS = os.getenv('PG_PASSWORD') #access environment variable PG_PASSWORD
DB_PORT = '5432'
SECRET_KEY = "codelings541"

#connect to PostgreSQL database
try:
  conn = psycopg2.connect(
    host=DB_HOST,
    dbname=DB_NAME,
    user=DB_USER,
    password=DB_PASS,
    port=DB_PORT
  )
except Exception as e:
  print('Error connecting to database:', e)

def token_required(f):
  @wraps(f)
  def decorated(*args, **kwargs):
    token = request.headers.get('Authorization')
    if not token:
      return jsonify({'error': 'Missing token'}), 401
    try:
      token = token.split()[1] 
      decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
      return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
      return jsonify({'error': 'Invalid token'}), 401
    return f(decoded, *args, **kwargs)
  return decorated

#route to handle registration
@app.route('/register', methods=['POST'])
def register():
  if not conn:
    return jsonify({'error': 'Database connection not established'}), 500
  
  data = request.json
  username = data.get('username')
  email = data.get('email')
  password = data.get('password')  #reminder to hash passwords and sensitive info
  confirm_password = data.get('confirm_password')

  #codes error type: 400(bad request), 401(invalid credentials), 409(conflict, info already taken), 500(server error)
  try:
    #if fields are empty
    if not username or not email or not password or not confirm_password:
      return jsonify({'error': 'Please fill in the blanks!'}), 400
    #if password does not match with confirm_password
    if password != confirm_password:
      return jsonify({'error': 'Passwords do not match!'}), 400
    
    with conn.cursor() as cursor: #"with" closes cursor automatically at end of block
      #check if username is taken
      cursor.execute('SELECT * FROM users WHERE username =%s', (username,)) #single element tuple. psycopg2 only accepts tuples
      if cursor.fetchone(): #fetch from database (tuple) and check if username exists
        return jsonify({'error': 'Username is taken'}), 409
      
      #check if email is taken
      cursor.execute('SELECT * FROM users WHERE email =%s', (email,)) #single element tuple. psycopg2 only accepts tuples
      if cursor.fetchone(): #fetch from database (tuple) and check if email exists
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
  if not conn:
    return jsonify({'error': 'Database connection not established'}), 500
  
  data = request.json
  username = data.get('username')
  password = data.get('password')  #reminder to hash passwords and sensitive info

  try:
    with conn.cursor() as cursor:
      cursor.execute('SELECT * FROM users WHERE username=%s AND password =%s', (username, password))
      user = cursor.fetchone()
      if user: #check if username and password valid
        token = jwt.encode({
          'username': user[1],
          'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1)
        
        }, SECRET_KEY, algorithm="HS256")
        return jsonify({
          'token': token
        })
      else:
        return jsonify({'error': 'Invalid username or password'}), 401
  except Exception as e:
    return jsonify({'error': str(e)}), 500

@app.route('/fetch_profile', methods=['GET'])
@token_required
def fetch_profile(decoded):
  if not conn:
    return jsonify({'error': 'Database connection is not established'}), 500
  
  try:
    username = decoded['username']
    with conn.cursor() as cursor:
      cursor.execute('SELECT username, email, profile_picture FROM users WHERE username=%s', (username,))
      user = cursor.fetchone()
      return jsonify({
        'username': user[0],
        'email': user[1],
        'pfp': user[2]
        })
  except Exception as e:
    return jsonify({'error': str(e)}), 500


#route to create a post and insert into database
@app.route('/post_project', methods=['POST'])
def post_project():
  if not conn:
    return jsonify({'error': 'Database connection is not established'}), 500
  
  now = datetime.datetime.now()
  data = request.json

  title = data.get('title')
  post_type = data.get('post_type')
  post_date = now.strftime('%Y-%m-%d %H:%M:%S')
  post_description = data.get('post_description')
  post_body = data.get('post_body')
  video_file_path = data.get('video_file_path')
  likes = data.get('likes')
  comments = data.get('comments')
  user_name= data.get('user_name')
  
  try:
    if not post_type:
      return jsonify({'error': 'Post needs a type'}), 400
    elif not title:
      return jsonify({'error': 'Post needs a title'}), 400
    elif not post_description:
      return jsonify({'error': 'Post needs a short description'}), 400
    elif len(title) > 50:
      return jsonify({'error': 'Post title cannot be over 50 characters'}), 400
    elif len(post_description) > 200:
      return jsonify({'error': 'Post description cannot be over 200 characters'}), 400
    elif len(post_body) > 4000:
      return jsonify({'error': 'Post body cannot be over 4000 characters'}), 400
    else:
      with conn.cursor() as cursor:
        cursor.execute('SELECT id from users WHERE username=%s', (user_name,))
        user_id_tuple = cursor.fetchone() #returns tuple (1,)
        user_id = user_id_tuple[0] #access the value to correctly insert into posts
        cursor.execute('INSERT INTO posts (post_date, post_type, user_id, title, post_description, post_body, video_file_path, likes, comments) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)', (post_date, post_type, user_id, title, post_description, post_body, video_file_path, likes, comments))
      conn.commit()
      return jsonify({'success': 'Your project has been posted'}), 201
  except Exception as e:
    conn.rollback()
    return jsonify({'error': str(e)}), 500

#route to fetch projects from database to display on Content.jsx
@app.route('/get_projects', methods=['GET'])
def get_projects():
  if not conn:
    return jsonify({'error': 'Database connection not established'}), 500

  try:
    with conn.cursor() as cursor:
      cursor.execute('''
      SELECT 
        posts.id,
        posts.post_date,
        posts.post_type,
        posts.title, 
        posts.post_description,
        posts.post_body, 
        posts.video_file_path,
        posts.likes,
        posts.comments,
        users.username
      FROM posts
      JOIN users ON posts.user_id = users.id
      ORDER BY posts.post_date DESC
      ''')

      rows = cursor.fetchall() #returns list of tuples;
      posts = []
      projects =[]
      ask_and_answers = []
      now = datetime.datetime.now()
        
      # iterate through columns and fill in the dictionary with each row fetched from rows
      columns = ['id', 'date', 'type', 'title', 'description', 'body', 'video', 'upvotes', 'comments_count', 'name']
      for row in rows:
        time_difference = now - row[1]
        seconds = round(time_difference.total_seconds())
        minutes = round(seconds / 60)
        hours = round(seconds / 3600)
        days = time_difference.days
        if minutes < 1:
          difference = "Just now"
        elif hours < 1:
          if minutes <= 1:
            difference = f"A minute ago"
          else:
            difference = f"{minutes} minutes ago"
        elif hours < 24:
          if hours <= 1:
            difference = f"An hour ago"
          else:
            difference = f"{hours} hours ago"
        else:
          if days <= 1:
            difference = f"{days} day ago"
          else:
            difference = f"{days} days ago"

        post_dict = dict(zip(columns,row))
        post_dict['date'] = difference

        posts.append(post_dict)
      
      for post in posts: #can probably put this in for loop above^^^^^
        if post['type'] == 'project':
          projects.append(post)
        elif post['type'] == 'qna':
          ask_and_answers.append(post)
      return jsonify({
          'projects': projects,
          'qna': ask_and_answers
        }), 200
    
  except Exception as e:
    return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
  app.run(debug=True)