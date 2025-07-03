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
import { UserContext, UIContext } from "../utils";
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
  setParentCommentsList,

  //2 below are for recursive calls
  //necesary for replying to reply to update existing repliesList
  parentRepliesList,
  setParentRepliesList,
}) {
  const isReply = parentComment.parent_comment_id !== null;
  const isCommenter =
    currentUser && currentUser.username === parentComment.name;
  const showReplyBox = replyCommentId === parentComment.comment_id; //
  //if <CommentCard /> is parent comment, set repliesList to []
  //if <CommentCard /> is reply, set repliesList to existing repliesList in order for replying to reply to work
  // const [repliesList, setRepliesList] = useState([]); //parent comment
  const [repliesList, setRepliesList] = useState(
    isReply ? parentRepliesList || [] : []
  );
  const [replyStart, setReplyStart] = useState(0);
  const [hasMoreReplies, setHasMoreReplies] = useState(
    parentComment.has_replies
  );
  const limit = 5;
  const { setShowPopup } = useContext(UIContext);

  const handleDeleteComment = async (commentId, parentCommentId = null) => {
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
          }
          //if parent comment, delete comment along with its replies
          else {
            setParentCommentsList((prev) => {
              return prev.filter((comment) => comment.comment_id !== commentId);
            });
          }
          setShowPopup(null)

        } else {
          alert(data.error);
        }
      } catch (err) {
        alert("Error: " + err.message);
      }
    }

    const popupMessage = isReply ?(
      <div>
        <h3>Delete Reply?</h3>
        <h4>This action cannot be undone.</h4>
      </div>
    ) : (
      <div>
        <h3>Delete Comment?</h3>
        <h4>This action will delete your comment and all its replies.</h4>
      </div>
    )

    setShowPopup({
      message: popupMessage,
      buttons: [
        {
          label: "Yes",
          action: deleteComment,
        },
        {
          label: "Cancel",
          action: () => setShowPopup(null)
        }
      ]
    })
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
    //REMINDER: change to reply if commentcard is reply (unnecessary?)
    <div className={`comment ${isReply ? "reply" : ""}`}>
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
          {/*Add option to delete if user is the commenter*/}
          {isCommenter && (
            <div
              className="comment-delete-button"
              onClick={() => handleDeleteComment(parentComment.comment_id, parentComment.parent_comment_id)}
            >
              <img
                  className="delete-icon"
                  src="../media/images/delete-icon.svg"
                />
            </div>
          )}
        </div>
      </div>
      {/* show reply box when click "Reply" */}
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
      {/* map through repliesList and call <CommentCard /> */}
      {!isReply && repliesList && (
        <div className="all-replies">
          {/* issue: when doing recursive call, it maps again, leading to infinite loop. add "!isReply" so that it ONLY maps ONCE when <CommentCard /> is a parent comment  */}
          {repliesList.map((reply) => (
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

              //create variable and function to keep track of the existing and correct repliesList in order to append reply and deleting that reply immediately
              parentRepliesList={repliesList} 
              setParentRepliesList={setRepliesList}
            />
          ))}
          {hasMoreReplies && (
            <button onClick={() => fetchReplies()}>View More Replies</button>
          )}
        </div>
      )}
    </div>
  );
}

function Comments({ postId, currentUser, token }) {
  const [commentText, setCommentText] = useState("");
  const [replyText, setReplyText] = useState("");
  const [parentCommentsList, setParentCommentsList] = useState([]); //contains parent comments and child replies
  const [replyCommentId, setReplyCommentId] = useState(null);
  const [msg, setMsg] = useState("");
  const [start, setStart] = useState(0); //for fetchComments()
  const limit = 5;
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const navigate = useNavigate();

  //cant put useEffect around this because fetchComments() is called when user clicks "view more"
  //fetch parent comments once first load in or refresh
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
          parent_comment_id: null,
          upvotes: 0,
          comments_count: 0,
        };
        //only show newly created comment imemdiately on frontend if there are less than 5 comments OR no more comments left (view more button gone)
        //to update frontend immediately after submitting a comment
        if (!hasMoreComments) {
          setParentCommentsList((prev) => [...prev, newComment]);
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
        <div className="comment-login-msg">Sign in to comment</div>
      )}

      <div className="all-comments">
        {/* Fetch from database to display parent comments of current post*/}
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
            setParentCommentsList={setParentCommentsList}
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
