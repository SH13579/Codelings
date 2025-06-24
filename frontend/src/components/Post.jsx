import React, { useCallback, useState, useEffect, useContext } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "../styles/post.css";
import Profile from "./Profile";
import { UserContext } from "../utils";
import { handleNavigating } from "./Content";

function Comments({ postId, currentUser, token }) {
  const [commentText, setCommentText] = useState("");
  const [commentsList, setCommentsList] = useState([]);
  const [msg, setMsg] = useState("");
  const [userCommented, setUserCommented] = useState(false);
  const navigate = useNavigate();

  //fetch comments from a certain post
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/get_comments?post_id=${postId}`,
          {
            method: "GET",
            headers: { Accept: "application/json" },
          }
        );
        const data = await res.json();
        if (res.ok) {
          setCommentsList(data);
          setCommentText("");
        }
        console.log(data);
      } catch (err) {
        alert("Error: " + err.message);
      }
    };
    fetchComments();
  }, []); //put userCommented here???

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
        setCommentsList((prevComments) => [...prevComments, newComment]);
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
        setCommentsList((prevComments) =>
          prevComments.filter((comment) => comment.comment_id !== commentId)
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
      {currentUser === undefined ? null : ( //prevent "Log in to comment" to show up for a bit after refreshing
        <form className="comment-input-wrapper" onSubmit={handleCommentSubmit}>
          {/*cannot add comment if not logged in*/}
          {currentUser ? (
            <textarea
              className="comment-input"
              value={commentText}
              placeholder="Add a comment..."
              onChange={(e) => setCommentText(e.target.value)}
            />
          ) : (
            <div className="comment-login-msg">Log in to comment</div>
          )}
          <button className="comment-submit-icon" type="submit">
            <img src="../media/images/enter.svg" />
          </button>
        </form>
      )}
      <div className="all-comments">
        {/* Fetch from database to display comments of current post*/}
        {commentsList.map((item) => {
          const isCommenter = currentUser && currentUser.username === item.name;
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
              </div>
              <div className="comment-buttons">
                <div className="comment-reply">Reply</div>
                {/*Add option to delete if user is the commenter*/}
                {isCommenter && (
                  <div
                    className="comment-delete"
                    onClick={() => handleDeleteComment(item.comment_id)}
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
          console.log(userCreatedPost);
          setPostInfo(data.posts[0]);
        } else {
          console.log("FAILED TO FETCH: " + data.error);
        }
      } catch (err) {
        alert("Error: ", err);
      }
    };
    fetchPost();
  }, [postId]);

  useEffect(() => {
    console.log(postInfo);
  }, [postInfo]);

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
