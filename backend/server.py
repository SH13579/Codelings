from flask import Flask, request, jsonify
import psycopg2
from flask_cors import CORS
import datetime
import os
import jwt
from functools import wraps
import math
from werkzeug.security import generate_password_hash, check_password_hash

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
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split()[1]

        if not token:
            return jsonify({"error": "Missing token"}), 401

        try:
            decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
        return f(decoded, *args, **kwargs)

    return decorated


def token_optional(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        decoded = None
        auth_header = request.headers.get("Authorization")
        token = None

        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split()[1]
        else:
            return

        if token:
            try:
                decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            except jwt.ExpiredSignatureError:
                pass
            except jwt.InvalidTokenError:
                pass

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
    password = data.get("password")
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
            # hash the password to pass into database
            hashed_password = generate_password_hash(password)
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
                (username, email, hashed_password),
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
                "SELECT id, username, password FROM users WHERE username=%s",
                (username,),
            )
            user = cursor.fetchone()
            if user and check_password_hash(
                user[2], password
            ):  # check if username and hashed password is same as password inserted
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
@token_required
def post_project(decoded):
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
    tags = data.get("tags")

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
                user_id = decoded["user_id"]
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
                # fetch all the ids for the tag names
                cursor.execute("SELECT id FROM tags WHERE tag_name = ANY(%s)", (tags,))
                tag_ids = cursor.fetchall()
                post_tags_arr = []
                # append it into array of tuple values (post_id, tag_id)
                for tag_id in tag_ids:
                    post_tags_arr.append((post_id, tag_id))
                # executemany executes the same statement for all the values in the array
                cursor.executemany(
                    "INSERT INTO post_tags (post_id, tag_id) VALUES (%s, %s)",
                    post_tags_arr,
                )

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


# changes the date from each row to the difference between date posted and today's date
def get_post_date(row):
    now = datetime.datetime.now()
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
    return difference


# turn each row into a object with corresponding dictionary values
def get_posts_helper(rows, columns):
    posts = []
    now = datetime.datetime.now()

    # iterate through columns and fill in the dictionary with each row fetched from rows
    for row in rows:
        difference = get_post_date(row)
        post_dict = dict(zip(columns, row))
        post_dict["date"] = difference

        posts.append(post_dict)

    return posts


# route to fetch projects from database to display on Content.jsx
@app.route("/get_postsByCategory", methods=["GET"])
@token_optional
def get_posts(decoded):
    if not conn:
        return jsonify({"error": "Database connection not established"}), 500

    post_type = request.args.get("post_type")
    start = request.args.get("start")
    limit = request.args.get("limit")
    category = request.args.get("category")
    user_id = decoded["user_id"] if decoded else None

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
          users.profile_picture,
          array_agg(tags.tag_name) AS tag_name,
          %s IS NOT NULL AND EXISTS (
            SELECT 1 FROM likes WHERE user_id = %s AND target_id = posts.id AND type = 'posts'
          ) AS user_liked_post
        FROM posts
        JOIN users ON posts.user_id = users.id
        LEFT JOIN post_tags ON posts.id = post_tags.post_id
        LEFT JOIN tags ON post_tags.tag_id = tags.id
        WHERE posts.post_type = %s
        GROUP BY posts.id, posts.post_date, posts.post_type, posts.title,
        posts.post_description, posts.likes, posts.comments, users.username, users.profile_picture
        ORDER BY posts.{category} DESC
        LIMIT %s OFFSET %s
      """
            cursor.execute(query, (user_id, user_id, post_type, limit, start))

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
            "tags",
            "liked",
        ]

        posts = get_posts_helper(rows, columns)
        return jsonify({"posts": posts})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# used to fetch the posts for a specific user on a profile
@app.route("/get_posts_byUserAndCategory", methods=["GET"])
@token_optional
def get_posts_byUser(decoded):
    if not conn:
        return jsonify({"error": "Database connection not established"}), 500

    username = request.args.get("username")
    post_type = request.args.get("post_type")
    start = request.args.get("start")
    limit = request.args.get("limit")
    category = request.args.get("category")
    user_id = decoded["user_id"] if decoded else None

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
          users.profile_picture,
          array_agg(tags.tag_name) AS tag_name,
          %s IS NOT NULL AND EXISTS (
            SELECT 1 FROM likes WHERE user_id = %s AND target_id = posts.id AND type = 'posts'
        ) AS user_liked_post
        FROM posts 
        JOIN users on posts.user_id = users.id
        LEFT JOIN post_tags ON posts.id = post_tags.post_id
        LEFT JOIN tags ON post_tags.tag_id = tags.id
        WHERE users.username = %s AND posts.post_type = %s
        GROUP BY posts.id, posts.post_date, posts.post_type, posts.title,
        posts.post_description, posts.likes, posts.comments, users.username, users.profile_picture
        ORDER BY posts.{category} DESC
        LIMIT %s OFFSET %s 
      """
            cursor.execute(query, (user_id, user_id, username, post_type, limit, start))

            rows = cursor.fetchall()
            print(rows)

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
            "tags",
            "liked",
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
@token_optional
def get_specific_post(decoded):
    if not conn:
        return jsonify({"error": "Database connection not established"}), 500

    post_id = request.args.get("post_id")
    user_id = decoded["user_id"] if decoded else None

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
        users.profile_picture,
        array_agg(tags.tag_name) AS tag_name,
        %s IS NOT NULL AND EXISTS (
            SELECT 1 FROM likes WHERE user_id = %s AND target_id = %s AND type = 'posts'
        ) AS user_liked_post
      FROM posts
      JOIN users ON posts.user_id = users.id
      LEFT JOIN post_tags ON post_tags.post_id = posts.id
      LEFT JOIN tags ON post_tags.tag_id = tags.id
      WHERE posts.id = %s
      GROUP BY posts.id, posts.post_date, posts.post_type, posts.title, posts.post_description, posts.post_body, posts.video_file_path,
      posts.likes, posts.comments, users.username, users.profile_picture
      """,
                (user_id, user_id, post_id, post_id),
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
            "tags",
            "liked",
        ]

        posts = get_posts_helper([row], columns)

        return jsonify({"posts": posts})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

#route to edit the body of a post
@app.route("/edit_post", methods=["POST"])
@token_optional
def edit_post(decoded):
    if not conn:
        return jsonify({"error": "Database connection not established"}), 500
    
    data = request.get_json()
    new_post_body = data.get("new_post_body")
    post_id = request.args.get("post_id")
    user_id = decoded["user_id"] if decoded else None

    try:
        if len(new_post_body) > 4000:
            return jsonify({"error": "Post body cannot be over 4000 characters"}), 400
        
        with conn.cursor() as cursor:
            cursor.execute(
                '''
                UPDATE posts 
                SET post_body = %s 
                WHERE id = %s AND user_id = %s
                ''',
                (new_post_body, post_id, user_id)
            )
            
            conn.commit()
            return jsonify({"success": "Post edited!"})
    
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500


# -------------------- routes related to comments below ------------------------


# route to add comment(s) to a post
@app.route("/post_comment", methods=["POST"])
@token_required
def post_comment(decoded):
    if not conn:
        return jsonify({"error": "Database connection not established"}), 500

    now = datetime.datetime.now()
    comment_date = now.strftime("%Y-%m-%d %H:%M:%S")

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

            # insert new comment into comments table THEN immediately fetch the id(necessary if user deletes comment right after adding comment) by SQL code: "RETURNING ID"
            cursor.execute(
                "INSERT INTO comments (comment, comment_date, parent_comment_id, user_id, post_id, likes_count, comments_count) VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id",
                (comment, comment_date, parent_comment_id, user_id, post_id, 0, 0),
            )
            new_comment_id = cursor.fetchone()[0]

            # update number of counts in posts table
            cursor.execute(
                "UPDATE posts SET comments = comments + 1 WHERE id = %s ", (post_id,)
            )

            # update number of counts in comments table
            if parent_comment_id:  # if deleting reply
                cursor.execute(
                    "UPDATE comments SET comments_count = comments_count + 1 WHERE id = %s",
                    (parent_comment_id,),
                )

            conn.commit()

        return (
            jsonify(
                {"success": "Your comment has been posted", "commentId": new_comment_id}
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
    post_id = data.get("post_id")
    parent_comment_id = data.get("parent_comment_id")

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

            # update number of comments in posts table
            cursor.execute(
                "UPDATE posts SET comments = comments - 1 WHERE id = %s", (post_id,)
            )

            # update number of comments in comments table
            if parent_comment_id:
                cursor.execute(
                    "UPDATE comments SET comments_count = comments_count - 1 WHERE id = %s",
                    (parent_comment_id,),
                )
            conn.commit()

            return jsonify({"success": "Comment deleted successfully"})

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500


# route to get comments from a post
@app.route("/get_comments", methods=["GET"])
@token_optional
def get_comments(decoded):
    if not conn:
        return jsonify({"error": "Database connection not established"}), 500

    start = int(request.args.get("start"))
    limit = int(request.args.get("limit"))
    post_id = request.args.get("post_id")
    user_id = decoded["user_id"] if decoded else None

    try:
        with conn.cursor() as cursor:
            # get parents comments
            cursor.execute(
                """
                SELECT comments.id, comments.comment_date, comments.comment, comments.parent_comment_id, comments.likes_count, comments.comments_count, users.username,
                %s IS NOT NULL AND EXISTS (
                    SELECT 1 FROM likes WHERE user_id = %s AND target_id = comments.id AND type = 'comments'
                ) AS user_liked_comment
                FROM comments
                JOIN users ON comments.user_id = users.id
                WHERE comments.post_id = %s AND comments.parent_comment_id IS NULL
                ORDER BY comments.id ASC
                LIMIT %s OFFSET %s
            """,
                (user_id, user_id, post_id, limit, start),
            )
            parents = cursor.fetchall()
            columns = [
                "comment_id",
                "date",
                "comment",
                "parent_comment_id",
                "upvotes",
                "comments_count",
                "name",
                "liked",
            ]
            parents_list = get_posts_helper(parents, columns)
            for parent in parents_list:
                parent["has_replies"] = int(parent["comments_count"]) > 0

            return jsonify({"comments": parents_list})

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500


# route to get replies from a comment
@app.route("/get_replies", methods=["GET"])
@token_optional
def get_replies(decoded):
    if not conn:
        return jsonify({"error": "Database connection not established"}), 500

    start = int(request.args.get("start"))
    limit = int(request.args.get("limit"))
    parent_comment_id = request.args.get("parent_comment_id")
    user_id = decoded["user_id"] if decoded else None

    try:

        with conn.cursor() as cursor:
            # get parents comments
            cursor.execute(
                """
                SELECT comments.id, comments.comment_date, comments.comment, comments.parent_comment_id, comments.likes_count, comments.comments_count, users.username,
                %s IS NOT NULL AND EXISTS (
                    SELECT 1 FROM likes WHERE user_id = %s AND target_id = comments.id AND type = 'comments'
                ) AS user_liked_reply
                FROM comments
                JOIN users ON comments.user_id = users.id
                WHERE comments.parent_comment_id = %s
                ORDER BY comments.id ASC
                LIMIT %s OFFSET %s
            """,
                (user_id, user_id, parent_comment_id, limit, start),
            )
            replies = cursor.fetchall()
            columns = [
                "comment_id",
                "date",
                "comment",
                "parent_comment_id",
                "upvotes",
                "comments_count",
                "name",
                "liked",
            ]
            replies_list = get_posts_helper(replies, columns)

            return jsonify({"replies": replies_list})

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500


# allows the user to like and unlike a post
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
                likes_column = "likes" if type == "posts" else "likes_count"
                query = f"""
                UPDATE {type}
                SET {likes_column} = {likes_column} - 1
                WHERE id = %s
                """
                cursor.execute(query, (target_id,))
                action = "unliked"
            else:
                cursor.execute(
                    "INSERT INTO likes (user_id, type, target_id) VALUES (%s, %s, %s)",
                    (user_id, type, target_id),
                )
                likes_column = "likes" if type == "posts" else "likes_count"
                query = f"""
                UPDATE {type}
                SET {likes_column} = {likes_column} + 1
                WHERE id = %s
                """
                cursor.execute(query, (target_id,))
                action = "liked"

            conn.commit()
            return jsonify({"success": action}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500


# fetch all the posts the user liked
@app.route("/fetch_liked_posts", methods=["GET"])
@token_required
def fetch_liked_posts(decoded):

    limit = request.args.get("limit")
    offset = request.args.get("offset")
    user_id = decoded["user_id"]
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
                    users.profile_picture,
                    array_agg(tags.tag_name) AS tag_name
                FROM posts
                JOIN users ON posts.user_id = users.id
                JOIN likes ON posts.id = likes.target_id
                LEFT JOIN post_tags ON posts.id = post_tags.post_id
                LEFT JOIN tags ON post_tags.tag_id = tags.id
                WHERE likes.user_id = %s AND likes.type = 'posts'
                GROUP BY posts.id, posts.post_date, posts.post_type, posts.user_id, posts.title, posts.post_description, posts.likes, posts.comments, users.username, users.profile_picture
                LIMIT %s OFFSET %s
            """
            cursor.execute(query, (user_id, limit, offset))
            liked_posts = cursor.fetchall()

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
            "tags",
        ]

        liked_posts_arr = get_posts_helper(liked_posts, columns)

        return jsonify({"liked_posts": liked_posts_arr})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# fetches the posts that contains the keyword the user entered
@app.route("/search_posts", methods=["GET"])
@token_optional
def search_posts(decoded):
    if not conn:
        return jsonify({"error": "Database connection not established"}), 500

    search_term = request.args.get("search_term")
    limit = request.args.get("limit")
    offset = request.args.get("offset")
    post_type = request.args.get("post_type")
    user_id = decoded["user_id"] if decoded else None

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
                      users.profile_picture,
                      array_agg(tags.tag_name) AS tag_name,
                      %s IS NOT NULL AND EXISTS (
                        SELECT 1 FROM likes WHERE user_id = %s AND target_id = posts.id AND type = 'posts'
                    ) AS user_liked_post
                    FROM posts
                    JOIN users ON posts.user_id = users.id
                    LEFT JOIN post_tags ON post_tags.post_id = posts.id
                    LEFT JOIN tags ON post_tags.tag_id = tags.id
                    WHERE posts.title LIKE %s AND posts.post_type = %s
                    GROUP BY posts.id, posts.post_date, posts.post_type, posts.title, posts.post_description, posts.likes, posts.comments, users.username, users.profile_picture
                    LIMIT %s OFFSET %s
                  """
            search_str = f"%{search_term}%"
            cursor.execute(
                query, (user_id, user_id, search_str, post_type, limit, offset)
            )
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
            "tags",
            "liked",
        ]

        posts_arr = get_posts_helper(posts, columns)

        return jsonify({"posts": posts_arr})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# fetches the profiles that has contains the keyword the user entered
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


# fetch all the tags on the website
@app.route("/fetch_tags", methods=["GET"])
def fetch_tags():
    if not conn:
        return jsonify({"error": "Database connection not established"}), 500

    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT tag_name, post_type FROM tags")
            tags = cursor.fetchall()
        all_tags = []
        for tag in tags:
            all_tags.append({"tag_name": tag[0], "post_type": tag[1]})

        return jsonify({"tags": all_tags})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# fetch all the posts for a specific tag
@app.route("/fetch_specific_tag", methods=["GET"])
@token_optional
def fetch_specific_tag(decoded):
    if not conn:
        return jsonify({"error": "Database connection not established"}), 500

    target_tag = request.args.get("target_tag")
    post_type = request.args.get("post_type")
    start = request.args.get("start")
    limit = request.args.get("limit")
    user_id = decoded["user_id"] if decoded else None
    category = request.args.get("category")
    categories = ["likes", "post_date"]
    if category not in categories:
        return jsonify({"Error: ": "Invalid filter type"})

    try:
        with conn.cursor() as cursor:
            query = f"""SELECT 
                        posts.id,
                        posts.post_date,
                        posts.post_type,
                        posts.title, 
                        posts.post_description, 
                        posts.likes,
                        posts.comments,
                        users.username,
                        users.profile_picture,
                        array_agg(tags.tag_name) AS tag_name,
                        %s IS NOT NULL AND EXISTS (
                            SELECT 1 FROM likes WHERE user_id = %s AND target_id = posts.id AND type = 'posts'
                        ) AS user_liked_post
                        FROM posts
                        JOIN users ON posts.user_id = users.id
                        LEFT JOIN post_tags ON posts.id = post_tags.post_id
                        LEFT JOIN tags ON post_tags.tag_id = tags.id
                        WHERE tags.post_type = %s
                        GROUP BY posts.id, posts.post_date, posts.post_type, posts.title, 
                        posts.post_description, posts.likes, posts.comments,
                        users.username, users.profile_picture
                        HAVING %s = ANY(array_agg(tags.tag_name))
                        ORDER BY posts.{category} DESC
                        LIMIT %s OFFSET %s"""
            cursor.execute(
                query,
                (user_id, user_id, post_type, target_tag, limit, start),
            )
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
                "tags",
                "liked",
            ]
            posts_arr = get_posts_helper(posts, columns)
            return jsonify({"posts": posts_arr})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
