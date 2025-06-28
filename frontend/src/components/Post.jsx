import React, {
  useCallback,
  useState,
  useEffect,
  useContext,
  useRef,
} from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "../styles/post.css";
import Profile from "./Profile";
import { UserContext } from "../utils";
import { handleNavigating } from "./Content";

function Comments({ postId, currentUser, token }) {
  const [commentText, setCommentText] = useState("");
  const [replyText, setReplyText] = useState("");
  const [parentCommentsList, setParentCommentsList] = useState([]);
  // const [commentsList, setCommentsList] = useState([]);
  // const parentComments = commentsList.filter(
  //   (comment) => !comment.parent_comment_id
  // ); //parent comments do not have parents
  // const replies = commentsList.filter((comment) => comment.parent_comment_id); //replies have a parent
  const [replyCommentId, setReplyCommentId] = useState(null);
  const [msg, setMsg] = useState("");
  const [start, setStart] = useState(0);
  const limit = 5;
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const navigate = useNavigate();
  const commentsRef = useRef(null);

  //cant put useEffect around this because fetchComments() is called when user clicks "view more"
  async function fetchComments() {
    try {
      const res = await fetch(
        `http://localhost:5000/get_comments?post_id=${postId}&start=${start}&limit=${limit}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
        }
      );
      const data = await res.json();
      if (res.ok) {
        if (data.comments.length < limit) {
          setHasMoreComments(false);
        }
        setParentCommentsList((prev) => [...prev, ...data.comments]);
        setStart((prev) => prev + limit);
      }
      console.log(data);
    } catch (err) {
      alert("Error: " + err.message);
    }
  }

  useEffect(() => {
    if (commentsRef.current === true) {
      return;
    }
    commentsRef.current = true;
    fetchComments();
  }, []);

  //post comment
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/post_comment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          post_id: postId,
          comment_text: commentText,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        const newComment = {
          comment_id: data.commentId, //fetch comment_id from database table(necessary to delete comment immediately)
          name: currentUser.username,
          comment: commentText, //data.commentText unnecessary
          pfp: currentUser.pfp,
          upvotes: 0,
          comments_count: 0,
        };
        //show newly created comment immediately on frontend
        setParentCommentsList((prev) => [...prev, { ...newComment, replies: [] }]);
        setCommentText(""); //empty input after adding comment
        setMsg(data.success);
      } else {
        setMsg("");
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const res = await fetch(
        `http://localhost:5000/delete_comment?comment_id=${commentId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ comment_id: commentId }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        setParentCommentsList((prevComments) =>
          prevComments.filter((comment) => comment.comment_id !== commentId)
        );

        setParentCommentsList((prev) => 
          prev.map((comment) =>
            comment.comment_id === commentId ? null //if deleting parent comment, delete entire comment (including replies)
            : { //if deleting reply
                ...comment,
                replies: comment.replies?.filter( //go through each reply and keep the ones where commentId do not match (matching id's = delete)
                  (reply) => reply.comment_id !== commentId
                )
              }
          )
          // .filter(Boolean) //remove any null values from the list
        )
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleReplyClick = (commentId, username, isReplyingToReply) => {
    setReplyCommentId(currentUser ? commentId : null); //if not logged in, do not show textarea
    setReplyText(
      isReplyingToReply && username !== currentUser.username
        ? `@${username} `
        : ""
    ); //if replying to reply, @username. Refer to showReplyBox below
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
          name: currentUser.username,
          comment: replyText,
          pfp: currentUser.pfp,
          parent_comment_id: parentCommentId,
          upvotes: 0,
          comments_count: 0,
        };
        setParentCommentsList((prev) =>
          prev.map((comment) => //go through each parent comment
            comment.comment_id === parentCommentId //find reply's parent comment and update the parent comment's replies list
              ? {
                  ...comment,
                  replies: [...(comment.replies || []), newReply],
                }
              : comment //if parent comment is not parent of reply, leave it unchanged
          )
        );

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

  return (
    <div className="comments-wrapper">
      <h2>Comments</h2>
      {currentUser === undefined ? null : currentUser ? (
        <form className="comment-input-wrapper" onSubmit={handleCommentSubmit}>
          {/*cannot add comment if not logged in*/}
          <textarea
            className="comment-input"
            value={commentText}
            placeholder="Add a comment..."
            onChange={(e) => setCommentText(e.target.value)}
          />
          <button className="comment-submit-icon" type="submit">
            <img src="../media/images/enter.svg" />
          </button>
        </form>
      ) : (
        <div className="comment-login-msg">Log in to comment</div>
      )}

      <div className="all-comments">
        {/* Fetch from database to display comments of current post*/}
        {parentCommentsList.map((item) => {
          //item = parent
          const repliesList = item.replies || []; //get all replies of current Comment
          const isCommenter = currentUser && currentUser.username === item.name;
          const showReplyBox = replyCommentId === item.comment_id; //
          return (
            <div className="comment" key={item.comment_id}>
              <div
                className="user-info"
                onClick={(e) => handleNavigating(e, navigate, item.name)}
              >
                <img className="pfp" src={`../media/images/${item.pfp}`} />
                <div className="user-name">{item.name}</div>
              </div>
              <div className="comment-text">{item.comment}</div>
              <div className="upvotes-comments-wrapper">
                <span className="upvotes">
                  <img
                    className="upvote-icon"
                    src="../media/images/thumbs-up.svg"
                  />
                  <div className="upvote-count">{item.upvotes}</div>
                </span>
                <span className="comments">
                  <img
                    className="comments-icon"
                    src="../media/images/comments.svg"
                  />
                  <div className="comment-count">{item.comments_count}</div>
                </span>
                <div className="comment-buttons">
                  <div
                    className="comment-reply-button"
                    onClick={() =>
                      handleReplyClick(item.comment_id, item.name, false)
                    }
                  >
                    Reply
                  </div>
                  {/*Add option to delete if user is the commenter*/}
                  {isCommenter && (
                    <div
                      className="comment-delete-button"
                      onClick={() => handleDeleteComment(item.comment_id)}
                    >
                      Delete
                    </div>
                  )}
                </div>
              </div>
              {/* <div className="comment-buttons"></div> */}
              {/*Show reply box only for specific comment*/}
              {showReplyBox && (
                <form onSubmit={(e) => handleReplySubmit(e, item.comment_id)}>
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
                    <button
                      className="cancel-button"
                      type="button"
                      onClick={() => {
                        setReplyCommentId(null);
                        setReplyText("");
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
              {/* Comment's child replies */}
              {/* repliesLIst && ???? */}
              <div className="all-replies">
                {repliesList.map((reply) => {
                  //similar code to commentsList.map. replace "item" with "reply"
                  const isReplier =
                    currentUser && currentUser.username === reply.name;
                  return (
                    <div key={reply.comment_id} className="comment">
                      <div
                        className="user-info"
                        onClick={(e) =>
                          handleNavigating(e, navigate, reply.name)
                        }
                      >
                        <img
                          className="pfp"
                          src={`../media/images/${reply.pfp}`}
                        />
                        <div className="user-name">{reply.name}</div>
                      </div>
                      <div className="comment-text">{reply.comment}</div>

                      <div className="reply-buttons">
                        <div
                          className="reply-reply-button"
                          onClick={() =>
                            handleReplyClick(item.comment_id, reply.name, true)
                          }
                        >
                          Reply
                        </div>
                        {/*Add option to delete if user is the replier*/}
                        {isReplier && (
                          <div
                            className="reply-delete-button"
                            onClick={() =>
                              handleDeleteComment(reply.comment_id)
                            }
                          >
                            Delete
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {hasMoreComments && (
        <button className="view-more-button" onClick={fetchComments}>
          View More
        </button>
      )}
    </div>
  );
}

export default function Post() {
  const token = sessionStorage.getItem("token");
  // const { state: post } = useLocation(); //useLocation gives access to the current route's location object (including any state/props passed via <Link>)
  const [postInfo, setPostInfo] = useState({});
  const { currentUser } = useContext(UserContext);
  const navigate = useNavigate();
  const { postId } = useParams();

  const handlePropagation = (e) => {
    e.stopPropagation();
    e.preventDefault();
  };

  //fetch post's info
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/get_specific_post?post_id=${postId}`,
          {
            method: "GET",
            headers: { Accept: "application/json" },
          }
        );
        const data = await res.json();
        if (res.ok) {
          // console.log(userCreatedPost);
          setPostInfo(data.posts[0]);
        } else {
          console.log("FAILED TO FETCH: " + data.error);
        }
      } catch (err) {
        alert("Error: " + err.message);
      }
    };
    fetchPost();
  }, [postId]);

  console.log("Rendering Post");

  return (
    <div className="content-wrapper no-hover">
      <div className="post-wrapper">
        <div className="project-first-row">
          <div
            onClick={(e) => {
              handlePropagation(e);
              handleNavigating(e, navigate, postInfo.name);
            }}
            className="user-info"
          >
            <img className="pfp" src={`../media/images/${postInfo.pfp}`} />
            <span className="user-name">{postInfo.name}</span>
          </div>
          <div className="post-date">
            <span className="post-date-dot">&#8226;</span>
            {postInfo.date}
          </div>
        </div>
        <h2 className="post-title">{postInfo.title}</h2>
        <h4 className="post-desc-post">{postInfo.description}</h4>
        <div className="post-video">
          {/* reminder to remove video for ask & answer section */}
          <video controls>
            <source
              src={`../media/videos/${postInfo.video}`}
              type="video/mp4"
            />
            Your browser does not support the video tag.
          </video>
        </div>
        <div className="post-body">{postInfo.body}</div>
        <div className="upvotes-comments-wrapper">
          <span className="upvotes">
            <img className="upvote-icon" src="../media/images/thumbs-up.svg" />
            <div className="upvote-count">{postInfo.upvotes}</div>
          </span>
          <span className="comments">
            <img className="comments-icon" src="../media/images/comments.svg" />
            <div className="comment-count">{postInfo.comments_count}</div>
          </span>
        </div>
        <div className="horizontal-line"></div>
        {<Comments postId={postId} currentUser={currentUser} token={token} />}
      </div>
    </div>
  );
}
