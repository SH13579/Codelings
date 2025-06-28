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

DB_HOST = "localhost"
DB_NAME = "codelings"
DB_USER = "postgres"
DB_PASS = os.getenv("PG_PASSWORD")  # access environment variable PG_PASSWORD
DB_PORT = "5432"
SECRET_KEY = "codelings541"

# connect to PostgreSQL database
try:
    conn = psycopg2.connect(
        host=DB_HOST, dbname=DB_NAME, user=DB_USER, password=DB_PASS, port=DB_PORT
    )
except Exception as e:
    print("Error connecting to database:", e)


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("Authorization")
        if not token:
            return jsonify({"error": "Missing token"}), 401
        try:
            token = token.split()[1]
            decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
        return f(decoded, *args, **kwargs)

    return decorated


# route to handle registration
@app.route("/register", methods=["POST"])
def register():
    if not conn:
        return jsonify({"error": "Database connection not established"}), 500

    data = request.json
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")  # reminder to hash passwords and sensitive info
    confirm_password = data.get("confirm_password")

    # codes error type: 400(bad request), 401(invalid credentials), 409(conflict, info already taken), 500(server error)
    try:
        # if fields are empty
        if not username or not email or not password or not confirm_password:
            return jsonify({"error": "Please fill in the blanks!"}), 400
        # if password does not match with confirm_password
        if password != confirm_password:
            return jsonify({"error": "Passwords do not match!"}), 400

        with conn.cursor() as cursor:  # "with" closes cursor automatically at end of block
            # check if username is taken
            cursor.execute(
                "SELECT * FROM users WHERE username =%s", (username,)
            )  # single element tuple. psycopg2 only accepts tuples
            if (
                cursor.fetchone()
            ):  # fetch from database (tuple) and check if username exists
                return jsonify({"error": "Username is taken"}), 409

            # check if email is taken
            cursor.execute(
                "SELECT * FROM users WHERE email =%s", (email,)
            )  # single element tuple. psycopg2 only accepts tuples
            if (
                cursor.fetchone()
            ):  # fetch from database (tuple) and check if email exists
                return jsonify({"error": "Email is taken"}), 409

            # insert new account
            cursor.execute(
                "INSERT INTO users (username, email, password) VALUES (%s, %s, %s)",
                (username, email, password),
            )
        conn.commit()
        return jsonify({"message": "User registered successfully"}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500


# route to handle logging in
@app.route("/login", methods=["POST"])
def login():
    if not conn:
        return jsonify({"error": "Database connection not established"}), 500

    data = request.json
    username = data.get("username")
    password = data.get("password")  # reminder to hash passwords and sensitive info

    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT * FROM users WHERE username=%s AND password =%s",
                (username, password),
            )
            user = cursor.fetchone()
            if user:  # check if username and password valid
                token = jwt.encode(
                    {
                        "user_id": user[0],
                        "username": user[1],
                        "exp": datetime.datetime.now(datetime.timezone.utc)
                        + datetime.timedelta(hours=1),
                    },
                    SECRET_KEY,
                    algorithm="HS256",
                )
                return jsonify({"token": token})
            else:
                return jsonify({"error": "Invalid username or password"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/fetch_user_profile", methods=["GET"])
@token_required
def fetch_profile(decoded):
    if not conn:
        return jsonify({"error": "Database connection is not established"}), 500

    try:
        username = decoded["username"]
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT username, email, profile_picture FROM users WHERE username=%s",
                (username,),
            )
            user = cursor.fetchone()
            return jsonify({"username": user[0], "email": user[1], "pfp": user[2]})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -------------------- routes related to posts below ------------------------


# route to create a post and insert into database
@app.route("/create_post", methods=["POST"])
def post_project():
    if not conn:
        return jsonify({"error": "Database connection is not established"}), 500

    now = datetime.datetime.now()
    data = request.json

    title = data.get("title")
    post_type = data.get("post_type")
    post_date = now.strftime("%Y-%m-%d %H:%M:%S")
    post_description = data.get("post_description")
    post_body = data.get("post_body")
    video_file_path = data.get("video_file_path")
    likes = data.get("likes")
    comments = data.get("comments")
    user_name = data.get("user_name")

    try:
        if not post_type:
            return jsonify({"error": "Post needs a type"}), 400
        elif not title:
            return jsonify({"error": "Post needs a title"}), 400
        elif not post_description:
            return jsonify({"error": "Post needs a short description"}), 400
        elif len(title) > 50:
            return jsonify({"error": "Post title cannot be over 50 characters"}), 400
        elif len(post_description) > 200:
            return (
                jsonify({"error": "Post description cannot be over 200 characters"}),
                400,
            )
        elif len(post_body) > 4000:
            return jsonify({"error": "Post body cannot be over 4000 characters"}), 400
        else:
            with conn.cursor() as cursor:
                cursor.execute("SELECT id from users WHERE username=%s", (user_name,))
                user_id_tuple = cursor.fetchone()  # returns tuple (1,)
                user_id = user_id_tuple[
                    0
                ]  # access the value to correctly insert into posts
                cursor.execute(
                    "INSERT INTO posts (post_date, post_type, user_id, title, post_description, post_body, video_file_path, likes, comments) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id",
                    (
                        post_date,
                        post_type,
                        user_id,
                        title,
                        post_description,
                        post_body,
                        video_file_path,
                        likes,
                        comments,
                    ),
                )
                post_id = cursor.fetchone()[0]

            conn.commit()
            return (
                jsonify(
                    {"success": "Your project has been posted", "post_id": post_id}
                ),
                201,
            )

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500


def get_posts_helper(rows, columns):
    posts = []
    now = datetime.datetime.now()

    # iterate through columns and fill in the dictionary with each row fetched from rows
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
        elif hours <= 24:
            if hours <= 1:
                difference = f"An hour ago"
            else:
                difference = f"{hours} hours ago"
        else:
            if days <= 1:
                difference = f"{days} day ago"
            else:
                difference = f"{days} days ago"

        post_dict = dict(zip(columns, row))
        post_dict["date"] = difference

        posts.append(post_dict)

    return posts


# route to fetch projects from database to display on Content.jsx
@app.route("/get_postsByCategory", methods=["GET"])
def get_posts():
    if not conn:
        return jsonify({"error": "Database connection not established"}), 500

    post_type = request.args.get("post_type")
    start = request.args.get("start")
    limit = request.args.get("limit")
    category = request.args.get("category")

    if not post_type:
        return jsonify({"error": "Missing post type"}), 400
    if category not in {"post_date", "likes"}:
        return jsonify({"error": "Invalid sort category"}), 400

    try:
        with conn.cursor() as cursor:
            # psycopg2 doesn't interpolate SQL keywords using {} or %s so we need a string to do it, %s only works for column names or table names
            query = f"""
        SELECT 
          posts.id,
          posts.post_date,
          posts.post_type,
          posts.title, 
          posts.post_description, 
          posts.likes,
          posts.comments,
          users.username,
          users.profile_picture
        FROM posts
        JOIN users ON posts.user_id = users.id
        WHERE posts.post_type = %s
        ORDER BY posts.{category} DESC
        LIMIT %s OFFSET %s
      """
            cursor.execute(query, (post_type, limit, start))

            rows = cursor.fetchall()  # returns list of tuples;

        columns = [
            "id",
            "date",
            "type",
            "title",
            "description",
            "upvotes",
            "comments_count",
            "name",
            "pfp",
        ]

        posts = get_posts_helper(rows, columns)
        return jsonify({"posts": posts})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/get_posts_byUserAndCategory", methods=["GET"])
def get_posts_byUser():
    if not conn:
        return jsonify({"error": "Database connection not established"}), 500

    username = request.args.get("username")
    post_type = request.args.get("post_type")
    start = request.args.get("start")
    limit = request.args.get("limit")
    category = request.args.get("category")

    # shouldn't directly inject column names or SQL keywords unless safely controlling what's allowed to prevent SQL injection
    if category not in {"post_date", "likes"}:
        return jsonify({"error": "Invalid sort category"}), 400

    if not username:
        return jsonify({"error": "Missing username"}), 400
    if not post_type:
        return jsonify({"error": "Missing post type"}), 400

    try:
        with conn.cursor() as cursor:
            query = f"""
        SELECT
          posts.id,
          posts.post_date,
          posts.post_type,
          posts.title,
          posts.post_description,
          posts.likes,
          posts.comments,
          users.username,
          users.profile_picture
        FROM posts 
        JOIN users on posts.user_id = users.id
        WHERE users.username = %s AND post_type = %s
        ORDER BY posts.{category} DESC
        LIMIT %s OFFSET %s 
      """
            cursor.execute(query, (username, post_type, limit, start))

            rows = cursor.fetchall()

        columns = [
            "id",
            "date",
            "type",
            "title",
            "description",
            "upvotes",
            "comments_count",
            "name",
            "pfp",
        ]

        posts = get_posts_helper(rows, columns)

        return jsonify({"posts": posts})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# route to delete post
@app.route("/delete_post", methods=["DELETE"])
@token_required
def delete_post(decoded):
    if not conn:
        return jsonify({"error": "Database connection not established"}), 500

    data = request.get_json()
    post_id = data.get("post_id")

    try:
        with conn.cursor() as cursor:
            user_id = decoded["user_id"]
            cursor.execute("SELECT user_id FROM posts WHERE id = %s", (post_id,))
            post_user_id = cursor.fetchone()[0]

            if user_id != post_user_id:
                return jsonify({"error": "403 Forbidden"}), 403

            cursor.execute("DELETE FROM posts WHERE id = %s", (post_id,))
            cursor.execute(
                "DELETE FROM likes WHERE type = 'posts' AND target_id = %s",
                (post_id,),
            )
            conn.commit()
            return jsonify({"success": "Post has been deleted"})

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500


# route to get a specific post (after clicking a post in Content.jsx)
@app.route("/get_specific_post", methods=["GET"])
def get_specific_post():
    if not conn:
        return jsonify({"error": "Database connection not established"}), 500
    post_id = request.args.get("post_id")
    try:
        # post_type???
        with conn.cursor() as cursor:
            cursor.execute(
                """
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
        users.username, 
        users.profile_picture
      FROM posts
      JOIN users ON posts.user_id = users.id
      WHERE posts.id = %s
      """,
                (post_id,),
            )

            row = cursor.fetchone()  # returns 1 row
            if not row:
                return jsonify({"error": "POST NOT FOUND"}), 404
        columns = [
            "id",
            "date",
            "type",
            "title",
            "description",
            "body",
            "video",
            "upvotes",
            "comments_count",
            "name",
            "pfp",
        ]

        posts = get_posts_helper([row], columns)

        return jsonify({"posts": posts})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -------------------- routes related to comments below ------------------------


# route to add comment(s) to a post
@app.route("/post_comment", methods=["POST"])
@token_required
def add_comment(decoded):
    if not conn:
        return jsonify({"error": "Database connection not established"}), 500

    data = request.json
    comment = data.get("comment_text")
    post_id = data.get("post_id")
    parent_comment_id = data.get("parent_comment_id")

    try:
        # if fields are empty
        username = decoded["username"]
        if not comment:
            return jsonify({"error": "Please fill in the blanks!"}), 400

        with conn.cursor() as cursor:
            cursor.execute("SELECT id from users WHERE username=%s", (username,))
            user_id_tuple = cursor.fetchone()  # returns tuple (1,)
            user_id = user_id_tuple[
                0
            ]  # access the value to correctly insert into posts

            # insert new comment into comments table THEN immediately fetch the id(necessary if user deletes code right after adding comment) by SQL code: "RETURNING ID"
            cursor.execute(
                "INSERT INTO comments (comment, parent_comment_id, user_id, post_id, likes_count, comments_count) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
                (comment, parent_comment_id, user_id, post_id, 0, 0),
            )  # returns (comment_id,)
            # RETURNING clause allows to insert and immediately get back specific column from that newly inserted row
            comment_id = cursor.fetchone()[0]
        conn.commit()
        return (
            jsonify(
                {"success": "Your comment has been posted", "commentId": comment_id}
            ),
            201,
        )

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500


# route to delete comment
@app.route("/delete_comment", methods=["DELETE"])
@token_required
def delete_comment(decoded):
    if not conn:
        return jsonify({"error": "Database connection not established"}), 500

    data = request.get_json()
    comment_id = data.get("comment_id")

    try:
        with conn.cursor() as cursor:
            user_id = decoded["user_id"]
            cursor.execute("SELECT user_id FROM comments WHERE id = %s", (comment_id,))
            comment_user_id_row = cursor.fetchone()
            if comment_user_id_row is None:
                return jsonify({"error": "Comment not found"}), 404
            comment_user_id = comment_user_id_row[0]

            # check if commenter is the samee as user logged in
            if comment_user_id != user_id:
                return jsonify({"error": "Cannot delete"})

            cursor.execute("DELETE FROM comments WHERE id = %s", (comment_id,))
            conn.commit()

            return jsonify({"sucess": "Comment deleted successfully"})

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500


# route to get comments from a post
@app.route("/get_comments", methods=["GET"])
def get_comments():
    if not conn:
        return jsonify({"error": "Database connection not established"}), 500

     # REMINDER TO ADD WHEN COMMENT WAS CREATED
     
    try:
        start = int(request.args.get("start", 0))
        limit = int(request.args.get("limit", 5))
        post_id = request.args.get("post_id")

        with conn.cursor() as cursor:
            #get parents comments
            cursor.execute("""
                SELECT comments.id, comments.comment, comments.likes_count, comments.comments_count, users.username
                FROM comments
                JOIN users ON comments.user_id = users.id
                WHERE comments.post_id = %s AND comments.parent_comment_id IS NULL
                ORDER BY comments.id ASC
                LIMIT %s OFFSET %s
            """, (post_id, limit, start))
            parents = cursor.fetchall()
            parent_ids = [row[0] for row in parents]

            #each comment contains info including its children(replies)
            parent_map = {}
            for row in parents:
                comment_id = row[0]
                parent_map[comment_id] = {
                    "comment_id": comment_id,
                    "comment": row[1],
                    "parent_comment_id": None,
                    "upvotes": row[2],
                    "comments_count": row[3],
                    "name": row[4],
                    "replies": [] #list of maps/dictionaries
                }

            #get replies for each parent
            replies = []
            if parent_ids: #if parent comments exist, fetch the replies of each comment
                cursor.execute("""
                    SELECT comments.id, comments.comment, comments.parent_comment_id, comments.likes_count, comments.comments_count, users.username
                    FROM comments
                    JOIN users ON comments.user_id = users.id
                    WHERE comments.parent_comment_id IN %s
                    ORDER BY comments.id ASC
                """, ((tuple(parent_ids),))) #parent_ids is a list, so convert to list. (tuple of tuple)
                replies = cursor.fetchall()

            #each reply contains info
            for row in replies:
                reply_map = {
                    "comment_id": row[0],
                    "comment": row[1],
                    "parent_comment_id": row[2],
                    "upvotes": row[3],
                    "comments_count": row[4],
                    "name": row[5],
                }
                #row[2] = parent_comment_id
                parent_map[row[2]]["replies"].append(reply_map) #find parent comment and append to reply list

            return jsonify({"comments": list(parent_map.values())})

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500


@app.route("/like_unlike", methods=["POST"])
@token_required
def like_unlike_post(decoded):
    if not conn:
        return jsonify({"error": "Database connection not established"}), 500

    data = request.get_json()
    user_id = decoded["user_id"]
    target_id = data.get("target_id")
    type = data.get("type")
    action = ""

    if type not in {"posts", "comments"}:
        return jsonify({"error": "Invalid type"}), 400

    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT id FROM likes WHERE user_id = %s AND target_id = %s AND type = %s",
                (user_id, target_id, type),
            )
            if cursor.fetchone():
                cursor.execute(
                    "DELETE FROM likes WHERE user_id = %s AND target_id = %s AND type = %s",
                    (user_id, target_id, type),
                )
                query = f"""
                UPDATE {type}
                SET likes = likes - 1
                WHERE id = %s
                """
                cursor.execute(query, (target_id,))
                action = "unliked"
            else:
                cursor.execute(
                    "INSERT INTO likes (user_id, type, target_id) VALUES (%s, %s, %s)",
                    (user_id, type, target_id),
                )
                query = f"""
                UPDATE {type}
                SET likes = likes + 1
                WHERE id = %s
                """
                cursor.execute(query, (target_id,))
                action = "liked"

            conn.commit()
            return jsonify({"success": action}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500


@app.route("/fetch_likes", methods=["GET"])
@token_required
def fetch_likes(decoded):
    if not conn:
        return jsonify({"error": "Database connection not established"}), 500

    user_id = decoded["user_id"]
    type = request.args.get("type")

    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT target_id FROM likes WHERE user_id = %s AND type = %s",
                (user_id, type),
            )
            likes = cursor.fetchall()

        likes_arr = []
        for like in likes:
            likes_arr.append(like[0])

        return jsonify({"likes_arr": likes_arr})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/search_posts", methods=["GET"])
def search_posts():
    if not conn:
        return jsonify({"error": "Database connection not established"}), 500

    search_term = request.args.get("search_term")
    limit = request.args.get("limit")
    offset = request.args.get("offset")

    try:
        with conn.cursor() as cursor:
            query = f"""
                    SELECT 
                      posts.id,
                      posts.post_date,
                      posts.post_type,
                      posts.title, 
                      posts.post_description, 
                      posts.likes,
                      posts.comments,
                      users.username,
                      users.profile_picture
                    FROM posts
                    JOIN users ON posts.user_id = users.id
                    WHERE posts.title LIKE %s 
                    LIMIT %s OFFSET %s
                  """
            search_str = f"%{search_term}%"
            cursor.execute(query, (search_str, limit, offset))
            posts = cursor.fetchall()

            columns = [
                "id",
                "date",
                "type",
                "title",
                "description",
                "upvotes",
                "comments_count",
                "name",
                "pfp",
            ]

            posts_arr = get_posts_helper(posts, columns)

        return jsonify({"posts": posts_arr})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/search_profiles", methods=["GET"])
def search_profiles():
    if not conn:
        return jsonify({"error": "Database connection not established"}), 500

    search_term = request.args.get("search_term")
    limit = request.args.get("limit")
    offset = request.args.get("offset")

    try:
        with conn.cursor() as cursor:
            profiles_arr = []
            search_str = f"%{search_term}%"
            cursor.execute(
                "SELECT id, profile_picture, username FROM users WHERE username LIKE %s LIMIT %s OFFSET %s",
                (search_str, limit, offset),
            )

            profiles = cursor.fetchall()

            columns = ["id", "pfp", "name"]
            for profile in profiles:
                profiles_dict = dict(zip(columns, profile))
                profiles_arr.append(profiles_dict)

        print(profiles_arr)

        return jsonify({"profiles": profiles_arr})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
