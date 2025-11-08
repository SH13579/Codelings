import React, { useState, useEffect, useContext, useRef } from "react";
import "../styles/post.css";
import {
  UIContext,
  handleLikePost,
  likeUnlike,
  makeLinksClickable,
} from "../utils";
import { handleNavigating } from "./Content";
import KebabMenu from "./KebabMenu";
import Loading from "./Loading";
import CharCount from "./CharCount";

function ReplyBox({
  onSubmit,
  replyText,
  setReplyText,
  onCancel,
  replyInputRef,
}) {
  const limitedChar = 1000;
  return (
    <form onSubmit={onSubmit}>
      <div className="comment-reply-box">
        <textarea
          className="reply-input"
          value={replyText}
          placeholder="Write your reply here..."
          ref={replyInputRef}
          onChange={(e) => setReplyText(e.target.value)}
          maxLength={limitedChar}
          onInput={(e) => {
            e.target.style.height = "auto";
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
        />
        <div className="bottom-row">
          <div className="bottom-row-buttons">
            <button
              type="submit"
              disabled={
                replyText.trim() === "" || /^@\w+\s*$/.test(replyText.trim())
              }
            >
              Submit
            </button>
            <button className="cancel-button" type="button" onClick={onCancel}>
              Cancel
            </button>
          </div>
          <CharCount currentLength={replyText.length} maxLength={limitedChar} />
        </div>
      </div>
    </form>
  );
}

export default function CommentCard({
  token,
  postId,
  setMsg,
  parentComment, //parentComment refers to parent comment or reply depending on <CommnentCard /> call
  currentUser,
  setShowLogin,
  navigate,
  replyCommentId,
  replyText,
  setReplyText,
  setReplyCommentId,
  setParentCommentsList,
  setStart,
  parentRepliesList,
  setParentRepliesList,
  existingReplyStart,
  setExistingReplyStart,

  setError500Msg,
  setError503,
}) {
  const isReply = parentComment.parent_comment_id !== null;
  const isCommenter =
    currentUser && currentUser.username === parentComment.name;
  const showReplyBox = replyCommentId === parentComment.comment_id;
  const [repliesList, setRepliesList] = useState(
    isReply ? parentRepliesList : []
  );
  const [replyStart, setReplyStart] = useState(
    isReply ? existingReplyStart : 0
  );
  const [hasMoreReplies, setHasMoreReplies] = useState(
    parentComment.has_replies
  );
  const [targetParentId, setTargetParentId] = useState(null); //to get parent comment's id when replying to comment or replying to reply
  const [likeCount, setLikeCount] = useState(parentComment.upvotes);
  const [liked, setLiked] = useState(parentComment.liked);
  const [isEditing, setIsEditing] = useState(false);
  const [existingComment, setExistingComment] = useState("");
  const limit = 5;
  const { setShowPopup } = useContext(UIContext);
  const [viewMoreRepliesLoading, setViewMoreRepliesLoading] = useState(false);
  const limitedChar = 1000;
  const replyInputRef = useRef(null);

  useEffect(() => {
    if (showReplyBox && replyInputRef.current) {
      replyInputRef.current.focus();
    }
  }, [showReplyBox]);

  //delete comment/reply
  const handleDeleteComment = async (
    commentId,
    parentCommentId = null,
    repliesCount
  ) => {
    async function deleteComment() {
      try {
        const res = await fetch(
          `https://sh12345.pythonanywhere.com/delete_comment`,
          {
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
          }
        );
        const data = await res.json();
        if (res.ok) {
          if (isReply) {
            setParentRepliesList((prev) =>
              prev.filter((reply) => reply.comment_id !== commentId)
            );
            setExistingReplyStart((prev) => prev - 1);
          } else {
            setParentCommentsList((prev) => {
              return prev.filter((comment) => comment.comment_id !== commentId);
            });
            setStart((prev) => prev - 1);
          }
          setShowPopup(null);
        } else {
          if (res.status === 500) {
            setError500Msg(true);
          }
          console.error(data.error);
        }
      } catch (err) {
        console.error("Error: " + err.message);
        setError503(true);
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

  //edit comment/reply
  const handleEditComment = async () => {
    try {
      const res = await fetch(
        `https://sh12345.pythonanywhere.com/edit_comment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            comment_id: parentComment.comment_id,
            new_comment: existingComment,
          }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        setIsEditing(false);
        if (isReply) {
          setParentRepliesList((prev) =>
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
        if (res.status === 500) {
          setError500Msg(true);
        }
        console.error(data.error);
      }
    } catch (err) {
      console.error("Error: " + err.message);
      setError503(true);
    }
  };

  //submit reply
  const handleReplySubmit = async (e, parentCommentId) => {
    e.preventDefault();
    try {
      const res = await fetch(
        "https://sh12345.pythonanywhere.com/post_comment",
        {
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
        }
      );

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
          if (isReply) {
            setParentRepliesList((prev) => [newReply, ...prev]);
          } else {
            setRepliesList((prev) => [newReply, ...prev]);
          }
        }

        setReplyText("");
        setReplyCommentId(null);
        setMsg(data.success);
      } else {
        if (res.status === 500) {
          setError500Msg(true);
        }
        console.error(data.error);
      }
    } catch (err) {
      console.error("Error: " + err.message);
      setError503(true);
    }
  };

  //show input box after clicking "reply"
  const handleReplyClick = (commentId, username, isReplyingToReply) => {
    //commentId refers to parent comment's id or reply's id depending on which <CommentCard /> is called
    const parentId = isReplyingToReply
      ? parentComment.parent_comment_id
      : parentComment.comment_id;

    setTargetParentId(parentId);
    setReplyCommentId(currentUser ? commentId : null); //if not logged in, do not show textarea
    setReplyText(
      isReplyingToReply && username !== currentUser.username
        ? `@${username} `
        : ""
    );
  };

  //fetch replies after clicking "view more"
  const fetchReplies = async () => {
    try {
      setViewMoreRepliesLoading(true);
      const res = await fetch(
        `https://sh12345.pythonanywhere.com/get_replies?parent_comment_id=${parentComment.comment_id}&start=${replyStart}&limit=${limit}`,
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
        setRepliesList((prev) => [...prev, ...fetchedReplies]);
        setReplyStart((prev) => prev + fetchedReplies.length);
        setHasMoreReplies(fetchedReplies.length === limit);
      } else {
        if (res.status === 500) {
          setError500Msg(true);
        }
        console.error(data.error);
      }
    } catch (err) {
      console.error("Error: " + err.message);
      setError503(true);
    } finally {
      setViewMoreRepliesLoading(false);
    }
  };

  const all_replies = repliesList.map((reply) => (
    <CommentCard
      key={reply.comment_id}
      token={token}
      postId={postId}
      setMsg={setMsg}
      parentComment={reply}
      currentUser={currentUser}
      navigate={navigate}
      replyCommentId={replyCommentId}
      replyText={replyText}
      setReplyText={setReplyText}
      setReplyCommentId={setReplyCommentId}
      setRepliesList={setRepliesList}
      setParentCommentsList={setParentCommentsList}
      parentRepliesList={repliesList}
      setParentRepliesList={setRepliesList}
      existingReplyStart={replyStart}
      setExistingReplyStart={setReplyStart}
      setError500Msg={setError500Msg}
      setError503={setError503}
    />
  ));

  return (
    <div className="comment">
      <div className="comment-top-row">
        <div
          className="user-info"
          onClick={(e) => handleNavigating(e, navigate, parentComment.name)}
        >
          <img className="pfp" src={`${parentComment.pfp}`} />
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
        <div className="post-edit-wrapper">
          <textarea
            name="post-edit"
            className="post-edit-box"
            value={existingComment}
            onChange={(e) => setExistingComment(e.target.value)}
          />
          <div className="bottom-row">
            <div className="post-edit-buttons">
              <button onClick={handleEditComment}>Save</button>
              <button onClick={() => setIsEditing(false)}>Cancel</button>
            </div>
            <CharCount
              currentLength={existingComment.length}
              maxLength={limitedChar}
            />
          </div>
        </div>
      ) : (
        <div className="comment-text">
          {makeLinksClickable(parentComment.comment)}
        </div>
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
            src="/images/thumbs-up.svg"
          />
          <div className="upvote-count">{likeCount}</div>
        </span>
        {!isReply && repliesList && (
          <span className="comments">
            <img className="comments-icon" src="/images/comments.svg" />
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
          onSubmit={(e) => handleReplySubmit(e, targetParentId)}
          replyText={replyText}
          setReplyText={setReplyText}
          onCancel={() => {
            setReplyCommentId(null);
            setReplyText("");
          }}
          replyInputRef={replyInputRef}
        />
      )}
      {/* map through repliesList and call <CommentCard /> */}
      {!isReply && (
        <div className="all-replies">
          {all_replies}
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
