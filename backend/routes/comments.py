from flask import Blueprint, request, jsonify
import datetime
from app import (
    supabase,
    token_required,
    token_optional,
    get_posts_helper,
)

comments_bp = Blueprint("comments", __name__)


# route to add comment(s) to a post
@comments_bp.route("/post_comment", methods=["POST"])
@token_required
def post_comment(decoded):
    now = datetime.datetime.now()
    comment_date = now.strftime("%Y-%m-%d %H:%M:%S")

    data = request.json
    comment = data.get("comment_text")
    post_id = data.get("post_id")
    parent_comment_id = data.get("parent_comment_id")

    try:
        user_id = decoded["user_id"]
        if not comment:
            return jsonify({"error": "Please fill in the blanks!"}), 400

        # Check cooldown
        cooldown_seconds = 10
        last_comment = (
            supabase.table("comments")
            .select("comment_date")
            .eq("user_id", user_id)
            .order("comment_date", desc=True)
            .limit(1)
            .execute()
        )

        if last_comment.data:
            last_comment_time = datetime.datetime.fromisoformat(
                last_comment.data[0]["comment_date"].replace("Z", "")
            )
            diff = (now - last_comment_time).total_seconds()
            if diff < cooldown_seconds:
                return jsonify({"error": "You are commenting too quickly!"}), 429

        # Insert comment
        insert_result = (
            supabase.table("comments")
            .insert(
                {
                    "comment": comment,
                    "comment_date": comment_date,
                    "parent_comment_id": parent_comment_id,
                    "user_id": user_id,
                    "post_id": post_id,
                    "likes_count": 0,
                    "comments_count": 0,
                }
            )
            .execute()
        )

        if not insert_result.data:
            return jsonify({"error": "Failed to add comment"}), 500

        new_comment_id = insert_result.data[0]["id"]

        # Increment post comment count
        post = (
            supabase.table("posts")
            .select("comments")
            .eq("id", post_id)
            .single()
            .execute()
        )
        if post.data:
            new_count = (post.data["comments"] or 0) + 1
            supabase.table("posts").update({"comments": new_count}).eq(
                "id", post_id
            ).execute()

        # Increment parent comment count if reply
        if parent_comment_id:
            parent = (
                supabase.table("comments")
                .select("comments_count")
                .eq("id", parent_comment_id)
                .single()
                .execute()
            )
            if parent.data:
                new_parent_count = (parent.data["comments_count"] or 0) + 1
                supabase.table("comments").update(
                    {"comments_count": new_parent_count}
                ).eq("id", parent_comment_id).execute()

        # # Increment post comment count
        # supabase.table("posts").update({"comments": supabase.func.increment(1)}).eq(
        #     "id", post_id
        # ).execute()

        # # Increment parent comment count if reply
        # if parent_comment_id:
        #     supabase.table("comments").update(
        #         {"comments_count": supabase.func.increment(1)}
        #     ).eq("id", parent_comment_id).execute()

        return (
            jsonify(
                {"success": "Your comment has been posted", "commentId": new_comment_id}
            ),
            201,
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# route to delete comment
@comments_bp.route("/delete_comment", methods=["DELETE"])
@token_required
def delete_comment(decoded):
    data = request.get_json()
    comment_id = data.get("comment_id")
    post_id = data.get("post_id")
    parent_comment_id = data.get("parent_comment_id")
    replies_count = int(data.get("replies_count") or 0)

    try:
        user_id = decoded["user_id"]

        # Check ownership
        comment = (
            supabase.table("comments").select("user_id").eq("id", comment_id).execute()
        )
        if not comment.data:
            return jsonify({"error": "Comment not found"}), 404

        if comment.data[0]["user_id"] != user_id:
            return jsonify({"error": "Cannot delete"}), 403

        # Delete comment + associated likes
        supabase.table("comments").delete().eq("id", comment_id).execute()
        supabase.table("likes").delete().eq("target_id", comment_id).eq(
            "type", "comments"
        ).execute()

        # Decrement post comment count
        post = (
            supabase.table("posts")
            .select("comments")
            .eq("id", post_id)
            .single()
            .execute()
        )
        if post.data:
            # if deleting parent comment, include replies_count and update posts table
            if parent_comment_id is None:
                decrement = replies_count + 1
            else:
                decrement = 1
            new_count = max((post.data["comments"] or 0) - decrement, 0)
            supabase.table("posts").update({"comments": new_count}).eq(
                "id", post_id
            ).execute()

        # Decrement parent comment count if reply
        if parent_comment_id:
            parent = (
                supabase.table("comments")
                .select("comments_count")
                .eq("id", parent_comment_id)
                .single()
                .execute()
            )
            if parent.data:
                new_parent_count = max((parent.data["comments_count"] or 0) - 1, 0)
                supabase.table("comments").update(
                    {"comments_count": new_parent_count}
                ).eq("id", parent_comment_id).execute()

        return jsonify({"success": "Comment deleted successfully"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# route to get comments from a post
@comments_bp.route("/get_comments", methods=["GET"])
@token_optional
def get_comments(decoded):
    start = int(request.args.get("start"))
    limit = int(request.args.get("limit"))
    post_id = request.args.get("post_id")
    category = request.args.get("category")
    user_id = decoded["user_id"] if decoded else None

    if category not in {"comment_date", "likes_count"}:
        return jsonify({"error": "Invalid sort category"}), 400

    try:
        query = (
            supabase.table("comments")
            .select(
                "id, comment_date, comment, parent_comment_id, likes_count, comments_count, users(username, profile_picture)"
            )
            .eq("post_id", post_id)
            .is_("parent_comment_id", None)
            .order(category, desc=True)
            .range(start, start + limit - 1)
        )
        parents = query.execute().data

        # add liked status
        if user_id:
            liked_comments = (
                supabase.table("likes")
                .select("target_id")
                .eq("user_id", user_id)
                .eq("type", "comments")
                .execute()
            )
            liked_ids = {item["target_id"] for item in liked_comments.data}
            for parent in parents:
                parent["liked"] = parent["id"] in liked_ids
        else:
            for parent in parents:
                parent["liked"] = False

        rows = [
            {
                "comment_id": p["id"],
                "date": datetime.datetime.fromisoformat(
                    p["comment_date"].replace("Z", "")
                ),
                "comment": p["comment"],
                "parent_comment_id": p["parent_comment_id"],
                "upvotes": p["likes_count"],
                "comments_count": p["comments_count"],
                "name": p["users"]["username"] if p.get("users") else None,
                "pfp": p["users"]["profile_picture"] if p.get("users") else None,
                "liked": p["liked"],
            }
            for p in parents
        ]

        parents_list = get_posts_helper(rows)
        for parent in parents_list:
            parent["has_replies"] = int(parent["comments_count"]) > 0

        return jsonify({"comments": parents_list})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# route to get replies from a comment
@comments_bp.route("/get_replies", methods=["GET"])
@token_optional
def get_replies(decoded):
    start = int(request.args.get("start"))
    limit = int(request.args.get("limit"))
    parent_comment_id = request.args.get("parent_comment_id")
    user_id = decoded["user_id"] if decoded else None

    try:
        replies = (
            supabase.table("comments")
            .select(
                "id, comment_date, comment, parent_comment_id, likes_count, comments_count, users(username, profile_picture)"
            )
            .eq("parent_comment_id", parent_comment_id)
            .order("id", desc=False)
            .range(start, start + limit - 1)
            .execute()
            .data
        )

        # liked replies
        liked_ids = set()
        if user_id:
            liked = (
                supabase.table("likes")
                .select("target_id")
                .eq("user_id", user_id)
                .eq("type", "comments")
                .execute()
                .data
            )
            liked_ids = {x["target_id"] for x in liked}

        rows = [
            {
                "comment_id": r["id"],
                "date": datetime.datetime.fromisoformat(
                    r["comment_date"].replace("Z", "")
                ),
                "comment": r["comment"],
                "parent_comment_id": r["parent_comment_id"],
                "upvotes": r["likes_count"],
                "comments_count": r["comments_count"],
                "name": r["users"]["username"],
                "pfp": r["users"]["profile_picture"],
                "liked": r["id"] in liked_ids,
            }
            for r in replies
        ]
        replies_list = get_posts_helper(rows)
        return jsonify({"replies": replies_list})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# route to edit a comment
@comments_bp.route("/edit_comment", methods=["POST"])
@token_required
def edit_comment(decoded):
    data = request.get_json()
    comment_id = data.get("comment_id")
    new_comment = data.get("new_comment")
    user_id = decoded["user_id"]

    try:
        result = (
            supabase.table("comments")
            .update({"comment": new_comment})
            .eq("id", comment_id)
            .eq("user_id", user_id)
            .execute()
        )

        if not result.data:
            return jsonify({"error": "Comment not found or unauthorized"}), 404

        return jsonify({"success": "Comment edited!"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500
