from flask import Blueprint, request, jsonify
import datetime

from app import (
    conn,
    token_required,
    token_optional,
    get_posts_helper,
)

comments_bp = Blueprint("comments", __name__)


# route to add comment(s) to a post
@comments_bp.route("/post_comment", methods=["POST"])
@token_required
def post_comment(decoded):
    if not conn:
        return jsonify({"error": "Database connection not established"}), 503

    now = datetime.datetime.now()
    comment_date = now.strftime("%Y-%m-%d %H:%M:%S")

    data = request.json
    comment = data.get("comment_text")
    post_id = data.get("post_id")
    parent_comment_id = data.get("parent_comment_id")

    try:
        # if fields are empty
        user_id = decoded["user_id"]
        if not comment:
            return jsonify({"error": "Please fill in the blanks!"}), 400

        cooldown_seconds = 10

        with conn.cursor() as cursor:

            cursor.execute(
                "SELECT comment_date FROM comments WHERE user_id = %s ORDER BY comment_date DESC LIMIT 1",
                (user_id,),
            )
            last_comment = cursor.fetchone()
            if last_comment:
                last_comment_time = last_comment[0]
                diff = (now - last_comment_time).total_seconds()
                if diff < cooldown_seconds:
                    return jsonify({"error": "You are commenting too quickly!"}), 429

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
@comments_bp.route("/delete_comment", methods=["DELETE"])
@token_required
def delete_comment(decoded):
    if not conn:
        return jsonify({"error": "Database connection not established"}), 503

    data = request.get_json()
    comment_id = data.get("comment_id")
    post_id = data.get("post_id")
    parent_comment_id = data.get("parent_comment_id")
    replies_count = int(data.get("replies_count"))
    decrement = 1

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
            cursor.execute(
                "DELETE FROM likes WHERE type = 'comments' AND target_id = %s",
                (comment_id,),
            )

            # if deleting parent comment, include replies_count and update posts table
            if parent_comment_id is None:
                decrement = replies_count + 1
                cursor.execute(
                    "UPDATE posts SET comments = comments - %s WHERE id = %s",
                    (decrement, post_id),
                )

            # if deleting reply, update comments and posts table
            elif parent_comment_id:
                cursor.execute(
                    "UPDATE comments SET comments_count = comments_count - 1 WHERE id = %s",
                    (parent_comment_id,),
                )

                cursor.execute(
                    "UPDATE posts SET comments = comments - 1 WHERE id = %s",
                    (post_id,),
                )
            conn.commit()

            return jsonify({"success": "Comment deleted successfully"})

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500


# route to get comments from a post
@comments_bp.route("/get_comments", methods=["GET"])
@token_optional
def get_comments(decoded):
    if not conn:
        return jsonify({"error": "Database connection not established"}), 503

    start = int(request.args.get("start"))
    limit = int(request.args.get("limit"))
    post_id = request.args.get("post_id")
    category = request.args.get("category")
    user_id = decoded["user_id"] if decoded else None

    if category not in {"comment_date", "likes_count"}:
        return jsonify({"error": "Invalid sort category"}), 400

    try:
        with conn.cursor() as cursor:
            # get parents comments, if like count is equal, secondary condition is just return in order of date
            cursor.execute(
                f"""
                SELECT comments.id, comments.comment_date, comments.comment, comments.parent_comment_id, comments.likes_count, comments.comments_count, users.username, users.profile_picture,
                %s IS NOT NULL AND EXISTS (
                    SELECT 1 FROM likes WHERE user_id = %s AND target_id = comments.id AND type = 'comments'
                ) AS user_liked_comment
                FROM comments
                JOIN users ON comments.user_id = users.id
                WHERE comments.post_id = %s AND comments.parent_comment_id IS NULL
                ORDER BY comments.{category} DESC {",comments.comment_date DESC" if category == "likes_count" else ""}
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
                "pfp",
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
@comments_bp.route("/get_replies", methods=["GET"])
@token_optional
def get_replies(decoded):
    if not conn:
        return jsonify({"error": "Database connection not established"}), 503

    start = int(request.args.get("start"))
    limit = int(request.args.get("limit"))
    parent_comment_id = request.args.get("parent_comment_id")
    user_id = decoded["user_id"] if decoded else None

    try:

        with conn.cursor() as cursor:
            # get parents comments
            cursor.execute(
                """
                SELECT comments.id, comments.comment_date, comments.comment, comments.parent_comment_id, comments.likes_count, comments.comments_count, users.username, users.profile_picture,
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
                "pfp",
                "liked",
            ]
            replies_list = get_posts_helper(replies, columns)

            return jsonify({"replies": replies_list})

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500


# route to edit a comment
@comments_bp.route("/edit_comment", methods=["POST"])
@token_optional
def edit_comment(decoded):
    if not conn:
        return jsonify({"error": "Database connection not established"}), 503

    data = request.get_json()
    comment_id = data.get("comment_id")
    new_comment = data.get("new_comment")
    # post_id = request.args.get("post_id")
    user_id = decoded["user_id"] if decoded else None

    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                UPDATE comments
                SET comment = %s
                WHERE id = %s AND user_id = %s
                """,
                (new_comment, comment_id, user_id),
            )

            conn.commit()
            return jsonify({"success": "Comment edited!"})

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
