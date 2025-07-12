import React, { useState, useEffect, useContext, useRef } from "react";
import "../styles/post.css";
import { UIContext, handleLikePost, likeUnlike } from "../utils";
import { handleNavigating } from "./Content";
import KebabMenu from "./KebabMenu";
import Loading from "./Loading";

function ReplyBox({ onSubmit, replyText, setReplyText, onCancel }) {
  return (
    <form onSubmit={onSubmit}>
      <div className="comment-reply-box">
        <textarea
          className="reply-input"
          value={replyText}
          placeholder="Write your reply here..."
          onChange={(e) => setReplyText(e.target.value)}
        />
        <button className="comment-submit-icon-reply" type="submit">
          <img src="../media/images/enter.svg" />
        </button>
        <button className="cancel-button" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function CommentCard({
  token,
  postId,
  setMsg,
  parentComment,
  currentUser,
  setShowLogin,
  navigate,
  replyCommentId,
  replyText,
  setReplyText,
  setReplyCommentId,
  setParentCommentsList,
  setStart,
  //below are for recursive calls (to update existing repliesList and replyStart)
  parentRepliesList,
  setParentRepliesList,
  existingReplyStart,
  setExistingReplyStart,
}) {
  const isReply = parentComment.parent_comment_id !== null;
  const isCommenter =
    currentUser && currentUser.username === parentComment.name;
  const showReplyBox = replyCommentId === parentComment.comment_id;
  //if <CommentCard /> is parent comment, set repliesList to []
  //if <CommentCard /> is reply, set repliesList to existing repliesList in order for replying to reply to work
  const [repliesList, setRepliesList] = useState(
    isReply ? parentRepliesList || [] : []
  );
  const [replyStart, setReplyStart] = useState(
    isReply ? existingReplyStart : 0
  );
  const [hasMoreReplies, setHasMoreReplies] = useState(
    parentComment.has_replies
  );
  const [likeCount, setLikeCount] = useState(parentComment.upvotes);
  const [liked, setLiked] = useState(parentComment.liked);
  const [isEditing, setIsEditing] = useState(false);
  const [existingComment, setExistingComment] = useState("");
  const limit = 5;
  const { setShowPopup } = useContext(UIContext);
  const [viewMoreRepliesLoading, setViewMoreRepliesLoading] = useState(false);

  useEffect(() => {
    console.log(repliesList);
  }, [repliesList]);

  const handleDeleteComment = async (
    commentId,
    parentCommentId = null,
    repliesCount
  ) => {
    async function deleteComment() {
      try {
        const res = await fetch(`http://localhost:5000/delete_comment`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            comment_id: commentId,
            post_id: postId,
            parent_comment_id: parentCommentId,
            replies_count: repliesCount,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          //if reply, delete reply
          if (isReply) {
            //use setParentRepliesList if deleting reply
            setParentRepliesList((prev) =>
              prev.filter((reply) => reply.comment_id !== commentId)
            );
            setExistingReplyStart((prev) => prev - 1);
          }
          //if parent comment, delete comment along with its replies
          else {
            setParentCommentsList((prev) => {
              return prev.filter((comment) => comment.comment_id !== commentId);
            });
            setStart((prev) => prev - 1);
          }
          setShowPopup(null);
        } else {
          alert(data.error);
        }
      } catch (err) {
        alert("Error: " + err.message);
      }
    }

    const popupMessage = isReply ? (
      <div>
        <h3>Delete Reply?</h3>
        <h4>This action cannot be undone.</h4>
      </div>
    ) : (
      <div>
        <h3>Delete Comment?</h3>
        <h4>This action will delete your comment and all its replies.</h4>
      </div>
    );

    setShowPopup({
      message: popupMessage,
      buttons: [
        {
          label: "Yes",
          action: deleteComment,
        },
        {
          label: "Cancel",
          action: () => setShowPopup(null),
        },
      ],
    });
  };

  const handleEditComment = async () => {
    try {
      const res = await fetch(`http://localhost:5000/edit_comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          comment_id: parentComment.comment_id,
          new_comment: existingComment,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsEditing(false);
        if (isReply) {
          //when replacing
          setParentRepliesList((prev) =>
            //parentComment = {reply}
            prev.map((reply) =>
              reply.comment_id === parentComment.comment_id
                ? { ...reply, comment: existingComment }
                : reply
            )
          );
        } else {
          setParentCommentsList((prev) =>
            prev.map((comment) =>
              comment.comment_id === parentComment.comment_id
                ? { ...comment, comment: existingComment }
                : comment
            )
          );
        }
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleReplySubmit = async (e, parentCommentId) => {
    e.preventDefault();
    try {
      //call the same route, but send different data (include parent_comment_id)
      const res = await fetch("http://localhost:5000/post_comment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          post_id: postId,
          comment_text: replyText,
          parent_comment_id: parentCommentId,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        const newReply = {
          comment_id: data.commentId,
          date: "Just now",
          name: currentUser.username,
          comment: replyText,
          pfp: currentUser.pfp,
          parent_comment_id: parentCommentId,
          upvotes: 0,
          comments_count: 0,
          likes: false,
        };

        //to update frontend immediately after posting reply
        if (!hasMoreReplies) {
          setRepliesList((prev) => [...prev, newReply]);
        }

        setReplyText("");
        setReplyCommentId(null);
        setMsg(data.success);
      } else {
        setMsg("");
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleReplyClick = (commentId, username, isReplyingToReply) => {
    //still a bit confused on parentId
    const parentId = isReplyingToReply
      ? parentComment.parent_comment_id //connect to reply's parent_comment_id
      : parentComment.comment_id; //connect to parent_comment's id
    setReplyCommentId(currentUser ? parentId : null); //if not logged in, do not show textarea
    setReplyText(
      isReplyingToReply && username !== currentUser.username
        ? `@${username} `
        : ""
    ); //if replying to reply, @username. Refer to showReplyBox below
  };

  const fetchReplies = async (reset = false) => {
    try {
      !reset && setViewMoreRepliesLoading(true);
      const start = reset ? 0 : replyStart;
      const res = await fetch(
        `http://localhost:5000/get_replies?parent_comment_id=${parentComment.comment_id}&start=${start}&limit=${limit}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      if (res.ok) {
        const fetchedReplies = data.replies;
        setRepliesList((prev) =>
          reset ? fetchedReplies : [...prev, ...fetchedReplies]
        );
        setHasMoreReplies(
          fetchedReplies.length > 0 && fetchedReplies.length === limit
        );
        setReplyStart((prev) => prev + limit);
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      !reset && setViewMoreRepliesLoading(false);
    }
  };

  return (
    //REMINDER: change to reply if commentcard is reply (unnecessary?)
    <div className={`comment ${isReply ? "reply" : ""}`}>
      <div className="comment-top-row">
        <div
          className="user-info"
          onClick={(e) => handleNavigating(e, navigate, parentComment.name)}
        >
          <img className="pfp" src={`../media/images/${parentComment.pfp}`} />
          <div className="user-name">{parentComment.name}</div>
        </div>
        <div className="post-date">
          <span className="post-date-dot">&#8226;</span>
          {parentComment.date}
        </div>
        {/*Add option to delete if user is the commenter*/}
        {isCommenter && (
          <KebabMenu
            onEdit={() => {
              setIsEditing(true);
              setExistingComment(parentComment.comment);
            }}
            onDelete={() => {
              handleDeleteComment(
                parentComment.comment_id,
                parentComment.parent_comment_id,
                parentComment.comments_count
              );
            }}
          />
        )}
      </div>
      {isEditing ? (
        <div>
          <textarea
            className=""
            value={existingComment}
            onChange={(e) => setExistingComment(e.target.value)}
          />
          <div>
            <button onClick={handleEditComment}>Save</button>
            <button onClick={() => setIsEditing(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="comment-text">{parentComment.comment}</div>
      )}
      <div className="upvotes-comments-wrapper">
        <span className="upvotes">
          <img
            onClick={(e) =>
              handleLikePost(e, token, setShowLogin, () =>
                likeUnlike(
                  parentComment.comment_id,
                  "comments",
                  liked,
                  setLiked,
                  setLikeCount
                )
              )
            }
            className={liked ? "upvote-icon-liked" : "upvote-icon"}
            src="../media/images/thumbs-up.svg"
          />
          <div className="upvote-count">{likeCount}</div>
        </span>
        {!isReply && (
          <span className="comments">
            <img className="comments-icon" src="../media/images/comments.svg" />
            <div className="comment-count">{parentComment.comments_count}</div>
          </span>
        )}
        <div className="comment-buttons">
          <div
            className="comment-reply-button"
            onClick={() =>
              handleReplyClick(
                parentComment.comment_id,
                parentComment.name,
                isReply //check if <CommentCard /> is reply
              )
            }
          >
            Reply
          </div>
        </div>
      </div>
      {/* show reply box when click "Reply" */}
      {showReplyBox && (
        <ReplyBox
          onSubmit={(e) => handleReplySubmit(e, parentComment.comment_id)}
          replyText={replyText}
          setReplyText={setReplyText}
          onCancel={() => {
            setReplyCommentId(null);
            setReplyText("");
          }}
        />
      )}
      {/* map through repliesList and call <CommentCard /> */}
      {!isReply && parentComment.comments_count > 0 && repliesList && (
        <div className="all-replies">
          {/* issue: when doing recursive call, it maps again, leading to infinite loop/recursive calls. add "!isReply" so that it ONLY maps ONCE when <CommentCard /> is a parent comment. avoid going through repliesList when it's a reply */}
          {repliesList.map((reply) => (
            <CommentCard
              key={reply.comment_id}
              token={token}
              postId={postId}
              setMsg={setMsg}
              parentComment={reply} //rename?
              currentUser={currentUser}
              navigate={navigate}
              replyCommentId={replyCommentId}
              replyText={replyText}
              setReplyText={setReplyText}
              setReplyCommentId={setReplyCommentId}
              setRepliesList={setRepliesList}
              setParentCommentsList={setParentCommentsList}
              //when adding or deleting
              parentRepliesList={repliesList}
              setParentRepliesList={setRepliesList}
              existingReplyStart={replyStart}
              setExistingReplyStart={setReplyStart}
            />
          ))}
          {hasMoreReplies && (
            <div
              className="view-more-replies-button"
              onClick={() => fetchReplies()}
            >
              <svg
                className=""
                width="22.5"
                height="22.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
              <div>
                {parentComment.comments_count - repliesList.length}
                {parentComment.comments_count - repliesList.length === 1
                  ? " Reply"
                  : " Replies"}
              </div>
            </div>
          )}
          {viewMoreRepliesLoading && <Loading />}
        </div>
      )}
    </div>
  );
}
