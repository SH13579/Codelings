import React, { useState, useEffect, useContext } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "../styles/post.css";
import { UserContext, UIContext, handleLikePost, likeUnlike } from "../utils";
import { handleNavigating } from "./Content";
import CommentCard from "./CommentCard";
import Tags from "./Tags";
import Loading from "./Loading";

function Comments({ postId, currentUser, setShowLogin, token }) {
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
  //fetch parent comments once first load in or refresh
  async function fetchComments(reset = false) {
    try {
      const res = await fetch(
        `http://localhost:5000/get_comments?post_id=${postId}&start=${
          reset ? 0 : start
        }&limit=${limit}`,
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
          liked: false,
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
            setShowLogin={setShowLogin}
            navigate={navigate}
            replyCommentId={replyCommentId}
            replyText={replyText}
            setReplyText={setReplyText}
            setReplyCommentId={setReplyCommentId}
            setParentCommentsList={setParentCommentsList}
            setStart={setStart}
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
  const { currentUser, setShowLogin } = useContext(UserContext);
  const { loading, setLoading, displayLiked } = useContext(UIContext);
  const [likeCount, setLikeCount] = useState(null);
  const [liked, setLiked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [edited, setEdited] = useState("");
  const navigate = useNavigate();
  const { postId } = useParams();

  const handlePropagation = (e) => {
    e.stopPropagation();
    e.preventDefault();
  };

  //fetch post's info
  useEffect(() => {
    setLoading(true);
    const fetchPost = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/get_specific_post?post_id=${postId}`,
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
          const post = data.posts[0];
          setPostInfo(post);
          setLikeCount(post.upvotes);
          setLiked(post.liked);
        } else {
          console.log("FAILED TO FETCH: " + data.error);
        }
      } catch (err) {
        alert("Error: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [postId]);

  const handleEdit = async () => {
    try {
      const res = await fetch("http://localhost:5000/edit_post", {
        method: "",
        headers: {},
        body: {},
      });

      const data = await res.json();
      if (res.ok) {
      } else {
      }
    } catch {}
  };
  useEffect(() => {
    console.log(postInfo);
  }, [postInfo]);

  console.log("Rendering Post");

  return loading ? (
    <Loading />
  ) : (
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
          {currentUser && currentUser.username === postInfo.name && (
            <div className="post-kebab-menu-wrapper">
              <div
                className="kebab-menu"
                onClick={() => setMenuOpen((prev) => !prev)}
              >
                &#8942;
              </div>
              {menuOpen && (
                <div className="kebab-menu-dropdown">
                  <div>Edit</div>
                  <div>Delete</div>
                </div>
              )}
            </div>
          )}
        </div>
        <h2 className="post-title">{postInfo.title}</h2>
        <h4 className="post-desc-post">{postInfo.description}</h4>
        <Tags tags={postInfo.tags} />
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
        <div className="post-body"></div>
        <div className="upvotes-comments-wrapper">
          <span className="upvotes">
            <img
              onClick={(e) =>
                handleLikePost(e, currentUser, setShowLogin, () =>
                  likeUnlike(postId, "posts", liked, setLiked, setLikeCount)
                )
              }
              className={liked ? "upvote-icon-liked" : "upvote-icon"}
              src="../media/images/thumbs-up.svg"
            />
            <div className="upvote-count">{likeCount}</div>
          </span>
          <span className="comments">
            <img className="comments-icon" src="../media/images/comments.svg" />
            <div className="comment-count">{postInfo.comments_count}</div>
          </span>
        </div>
        <div className="horizontal-line"></div>
        {
          <Comments
            postId={postId}
            currentUser={currentUser}
            setShowLogin={setShowLogin}
            token={token}
          />
        }
      </div>
    </div>
  );
}
