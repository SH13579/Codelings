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

function CommentCard({
  token,
  postId,
  setMsg,
  parentComment,
  currentUser,
  navigate,
  replyCommentId,
  replyText,
  setReplyText,
  setReplyCommentId,
  // handleReplySubmit,
  // handleReplyClick,
  handleDeleteComment,
  // fetchReplies,
}) {
  // const repliesList = parentComment.replies || []; //get all replies of current Comment
  const isCommenter =
    currentUser && currentUser.username === parentComment.name;
  const showReplyBox = replyCommentId === parentComment.comment_id; //
  const [repliesList, setRepliesList] = useState(parentComment.replies || []);
  const [replyStart, setReplyStart] = useState(0);
  const [hasMoreReplies, setHasMoreReplies] = useState(
    parentComment.has_replies
  );
  const limit = 5;

  //useEffect to see if there are any replies
  // useEffect(() => {
  //   const checkReplies = async () => {
  //     try {
  //       const res = await fetch(
  //         `http://localhost:5000/get_replies?parent_comment_id=${parentComment.comment_id}&start=0&limit=1`
  //       ); //limit=1 just to check if there is 1 reply

  //       const data = await res.json();
  //       if (res.ok) {
  //         setHasMoreReplies(data.replies.length === 0 ? false : true);
  //       } else {
  //         console.log(data.error);
  //       }
  //     } catch (err) {
  //       alert("Error: " + err.message);
  //     }
  //   };
  //   checkReplies();
  // }, [parentComment.comment_id]);

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
        };
        // setParentCommentsList((prev) =>
        //   prev.map(
        //     (
        //       comment //go through each parent comment
        //     ) =>
        //       comment.comment_id === parentCommentId //find reply's parent comment and update the parent comment's replies list
        //         ? {
        //             ...comment,
        //             replies: [...(comment.replies || []), newReply],
        //           }
        //         : comment //if parent comment is not parent of reply, leave it unchanged
        //   )
        // );
        setRepliesList((prev) => [...prev, newReply]);

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
    setReplyCommentId(currentUser ? commentId : null); //if not logged in, do not show textarea
    setReplyText(
      isReplyingToReply && username !== currentUser.username
        ? `@${username} `
        : ""
    ); //if replying to reply, @username. Refer to showReplyBox below
  };

  const fetchReplies = async (reset = false) => {
    try {
      const start = reset ? 0 : replyStart;
      const res = await fetch(
        `http://localhost:5000/get_replies?parent_comment_id=${parentComment.comment_id}&start=${start}&limit=${limit}`
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
    }
  };

  return (
    <div className="comment" key={parentComment.comment_id}>
      <div
        className="user-info"
        onClick={(e) => handleNavigating(e, navigate, parentComment.name)}
      >
        <img className="pfp" src={`../media/images/${parentComment.pfp}`} />
        <div className="user-name">{parentComment.name}</div>
        <div className="post-date">
          <span className="post-date-dot">&#8226;</span>
          {parentComment.date}
        </div>
      </div>
      <div className="comment-text">{parentComment.comment}</div>
      <div className="upvotes-comments-wrapper">
        <span className="upvotes">
          <img className="upvote-icon" src="../media/images/thumbs-up.svg" />
          <div className="upvote-count">{parentComment.upvotes}</div>
        </span>
        <span className="comments">
          <img className="comments-icon" src="../media/images/comments.svg" />
          <div className="comment-count">{parentComment.comments_count}</div>
        </span>
        <div className="comment-buttons">
          <div
            className="comment-reply-button"
            onClick={() =>
              handleReplyClick(
                parentComment.comment_id,
                parentComment.name,
                false
              )
            }
          >
            Reply
          </div>
          {/*Add option to delete if user is the commenter*/}
          {isCommenter && (
            <div
              className="comment-delete-button"
              onClick={() => handleDeleteComment(parentComment.comment_id)}
            >
              Delete
            </div>
          )}
        </div>
      </div>
      {/* <div className="comment-buttons"></div> */}
      {/*Show reply box only for specific comment*/}
      {showReplyBox && (
        <form onSubmit={(e) => handleReplySubmit(e, parentComment.comment_id)}>
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
          const isReplier = currentUser && currentUser.username === reply.name;
          return (
            <div key={reply.comment_id} className="comment">
              <div
                className="user-info"
                onClick={(e) => handleNavigating(e, navigate, reply.name)}
              >
                <img className="pfp" src={`../media/images/${reply.pfp}`} />
                <div className="user-name">{reply.name}</div>
                <div className="post-date">
                  <span className="post-date-dot">&#8226;</span>
                  {reply.date}
                </div>
              </div>
              <div className="comment-text">{reply.comment}</div>
              <div className="upvotes-comments-wrapper">
                <span className="upvotes">
                  <img
                    className="upvote-icon"
                    src="../media/images/thumbs-up.svg"
                  />
                  <div className="upvote-count">{reply.upvotes}</div>
                </span>
                {/* <span className="comments">
                          <img
                            className="comments-icon"
                            src="../media/images/comments.svg"
                          />
                          <div className="comment-count">
                            {reply.comments_count}
                          </div>
                        </span> */}
              </div>
              <div className="reply-buttons">
                <div
                  className="reply-reply-button"
                  onClick={() =>
                    handleReplyClick(parentComment.comment_id, reply.name, true)
                  }
                >
                  Reply
                </div>
                {/*Add option to delete if user is the replier*/}
                {isReplier && (
                  <div
                    className="reply-delete-button"
                    onClick={() =>
                      handleDeleteComment(
                        reply.comment_id,
                        reply.parent_comment_id
                      )
                    }
                  >
                    Delete
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {hasMoreReplies && (
          <button onClick={() => fetchReplies()}>View More Replies</button>
        )}
      </div>
    </div>
  );
}

function Comments({ postId, currentUser, token }) {
  const [commentText, setCommentText] = useState("");
  const [replyText, setReplyText] = useState("");
  const [parentCommentsList, setParentCommentsList] = useState([]);
  const [replyCommentId, setReplyCommentId] = useState(null);
  const [msg, setMsg] = useState("");
  const [start, setStart] = useState(0); //for fetchComments()
  const limit = 5;
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const navigate = useNavigate();

  //cant put useEffect around this because fetchComments() is called when user clicks "view more"
  async function fetchComments(reset = false) {
    try {
      const res = await fetch(
        `http://localhost:5000/get_comments?post_id=${postId}&start=${
          reset ? 0 : start
        }&limit=${limit}`,
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
        if (reset) {
          setParentCommentsList(data.comments);
          setStart(limit);
        } else {
          setParentCommentsList((prev) => [...prev, ...data.comments]);
          setStart((prev) => prev + limit);
        }
      } else {
        alert(data.error);
      }
      console.log(data);
    } catch (err) {
      alert("Error: " + err.message);
    }
  }

  useEffect(() => {
    fetchComments(true);
  }, []);

  //
  // async function fetchReplies(parentId, reset = false) {
  //   try {
  //     const currentComment = parentCommentsList.find(
  //       (comment) => comment.comment_id === parentId
  //     );
  //     const currentStart = reset ? 0 : currentComment?.replyStart || 0;
  //     const res = await fetch(
  //       `http://localhost:5000/get_replies?parent_comment_id=${parentId}&start=${
  //         reset ? 0 : currentStart
  //       }&limit=${limit}`,
  //       {
  //         method: "GET",
  //         headers: { Accept: "application/json" },
  //       }
  //     );
  //     const data = await res.json();
  //     //keep track of start and hasMoreReplies for each parent comment
  //     if (res.ok) {
  //       const replies = data.replies;
  //       setParentCommentsList((prev) =>
  //         //go through every parent comment
  //         prev.map((comment) =>
  //           comment.comment_id === parentId
  //             ? {
  //                 ...comment,
  //                 replies: reset
  //                   ? replies
  //                   : [...(comment.replies || []), ...replies],
  //                 // replyStart: currentStart + replies.length, //why not + limit?
  //                 // hasMoreReplies: replies.length === limit,
  //               }
  //             : comment
  //         )
  //       );
  //     } else {
  //       alert(data.error);
  //       console.log(data.error);
  //     }
  //     console.log(data);
  //   } catch (err) {
  //     alert("Error: " + err.message);
  //   }
  // }

  useEffect(() => {
    console.log(start);
  }, [start]);

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
          date: "Just now",
          name: currentUser.username,
          comment: commentText, //data.commentText unnecessary
          pfp: currentUser.pfp,
          upvotes: 0,
          comments_count: 0,
        };
        //only show newly created comment imemdiately on frontend if there are less than 5 comments OR no more comments left (view more button gone)
        setParentCommentsList((prev) =>
          !hasMoreComments || prev.length < limit
            ? [...prev, { ...newComment, replies: [] }]
            : prev
        );
        if (parentCommentsList.length < limit) {
          setStart((prev) => prev + 1); //increase offset by 1 to prevent duplicates
        }
        setCommentText(""); //empty input after adding comment
        setMsg(data.success);
      } else {
        alert(data.error);
        setMsg("");
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleDeleteComment = async (commentId, parentCommentId = null) => {
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
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setParentCommentsList((prevComments) =>
          prevComments.filter((comment) => comment.comment_id !== commentId)
        );

        setParentCommentsList(
          (prev) =>
            prev.map((comment) =>
              comment.comment_id === commentId
                ? null //if deleting parent comment, delete entire comment (including replies)
                : {
                    //if deleting reply
                    ...comment,
                    replies: comment.replies?.filter(
                      //go through each reply and keep the ones where commentId do not match (matching id's = delete)
                      (reply) => reply.comment_id !== commentId
                    ),
                  }
            )
          // .filter(Boolean) //remove any null values from the list
        );
      } else {
        alert(data.error);
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
        {parentCommentsList.map((parentComment) => (
          <CommentCard
            key={parentComment.comment_id}
            token={token}
            postId={postId}
            setMsg={setMsg}
            parentComment={parentComment}
            currentUser={currentUser}
            navigate={navigate}
            replyCommentId={replyCommentId}
            replyText={replyText}
            setReplyText={setReplyText}
            setReplyCommentId={setReplyCommentId}
            // handleReplySubmit={handleReplySubmit}
            // handleReplyClick={handleReplyClick}
            handleDeleteComment={handleDeleteComment}
            // fetchReplies={fetchReplies}
          />
        ))}
      </div>
      {hasMoreComments && (
        <button className="view-more-button" onClick={() => fetchComments()}>
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
