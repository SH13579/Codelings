import React, { useState, useEffect, useContext, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "../styles/post.css";
import {
  UserContext,
  UIContext,
  ErrorContext,
  handleLikePost,
  likeUnlike,
} from "../utils";
import { handleNavigating } from "./Content";
import CommentCard from "./CommentCard";
import Tags from "./Tags";
import Loading, { ViewMoreLoading } from "./Loading";
import KebabMenu from "./KebabMenu";
import CharCount from "./CharCount";
import NotExist from "./NotExist";
import InternalServerError500 from "./InternalServerError500";
import ServiceUnavailableError503 from "./ServiceUnavailableError503";
import { showDeletePopup } from "./Profile";

function Comments({
  postId,
  currentUser,
  setShowLogin,
  token,
  setError500Msg,
  setError500Page,
  setError503,
}) {
  const [viewMoreLoading, setViewMoreLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [replyText, setReplyText] = useState("");
  const [parentCommentsList, setParentCommentsList] = useState([]);
  const [replyCommentId, setReplyCommentId] = useState(null);
  const [msg, setMsg] = useState("");
  const [showCommentButtons, setShowCommentButtons] = useState(false);
  const [start, setStart] = useState(0); //for fetchComments()
  const limit = 5;
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [filter, setFilter] = useState("Best");
  const navigate = useNavigate();
  const limitedCharComment = 1000;
  const textareaRef = useRef(null);

  //fetch parent comments once first load in or refresh
  async function fetchComments(reset = false) {
    reset ? setCommentsLoading(true) : setViewMoreLoading(true);
    const category = filter === "Best" ? "likes_count" : "comment_date";
    try {
      const res = await fetch(
        `https://sh12345.pythonanywhere.com/get_comments?post_id=${postId}&category=${category}&start=${
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
        if (reset) {
          setParentCommentsList(data.comments);
          setStart(data.comments.length);
          setHasMoreComments(true);
        } else {
          setParentCommentsList((prev) => [...prev, ...data.comments]);
          setStart((prev) => prev + limit);
        }
        if (data.comments.length < limit) {
          setHasMoreComments(false);
        }
      } else {
        if (res.status === 500) {
          setError500Page(true);
        } else if (res.status === 503) {
          setError503(true);
        }
        console.error(data.error);
      }
    } catch (err) {
      console.error("Error: " + err.message);
      setError503(true);
    } finally {
      reset ? setCommentsLoading(false) : setViewMoreLoading(false);
    }
  }

  //initial batch of 5 comments
  useEffect(() => {
    fetchComments(true);
  }, [filter]);

  //post comment
  const handleCommentSubmit = async (e) => {
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
            comment_text: commentText,
          }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        const newComment = {
          comment_id: data.commentId,
          date: "Just now",
          name: currentUser.username,
          comment: commentText,
          pfp: currentUser.pfp,
          parent_comment_id: null,
          upvotes: 0,
          comments_count: 0,
          liked: false,
        };
        setParentCommentsList((prev) => [newComment, ...prev]);
        setStart((prev) => prev + 1);
        setCommentText("");
        setShowCommentButtons(false);
        setMsg(data.success);
      } else {
        if (res.status === 500) {
          setError500Msg(true);
        } else if (res.status === 503) {
          setError503(true);
        }
        console.error(data.error);
      }
    } catch (err) {
      setError503(true);
      console.error("Error: " + err.message);
    }
  };

  return (
    <div className="comments-wrapper">
      <div className="comments-header">
        <h2>Comments</h2>
        <div className="filter-wrapper">
          <div className="current-filter">
            {filter}
            <img
              className="dropdown-arrow"
              src="/images/dropdown-arrow.svg"
              alt="Dropdown"
            />
          </div>
          <div className="filter-dropdown">
            {filter !== "Best" && (
              <div
                onClick={() => {
                  setFilter("Best");
                }}
                className="filter"
              >
                Best
              </div>
            )}
            {filter !== "New" && (
              <div onClick={() => setFilter("New")} className="filter">
                New
              </div>
            )}
          </div>
        </div>
      </div>

      {/* comment input box */}
      {token ? (
        <form className="comment-input-wrapper" onSubmit={handleCommentSubmit}>
          <textarea
            className="comment-input"
            value={commentText}
            placeholder="Add a comment..."
            ref={textareaRef}
            onFocus={() => setShowCommentButtons(true)}
            onChange={(e) => {
              setCommentText(e.target.value);
              if (e.target.value.length > 0) {
                setShowCommentButtons(true);
              }
            }}
            maxLength={limitedCharComment}
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
          />
          {showCommentButtons && (
            <div className="bottom-row">
              <div className="bottom-row-buttons">
                <button type="submit" disabled={commentText.trim() === ""}>
                  Submit
                </button>
                <button
                  onClick={() => {
                    setShowCommentButtons(false);
                    setCommentText("");
                    if (textareaRef.current) {
                      textareaRef.current.style.height = "auto";
                    }
                  }}
                >
                  Cancel
                </button>
              </div>
              <CharCount
                currentLength={commentText.length}
                maxLength={limitedCharComment}
              />
            </div>
          )}
        </form>
      ) : (
        <div className="comment-login-msg">Sign in to comment</div>
      )}

      {/* Fetch from database to display 5 parent comments of current post*/}
      {commentsLoading ? (
        <Loading />
      ) : (
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
              setError500Msg={setError500Msg}
              setError503={setError503}
            />
          ))}
          {hasMoreComments && (
            <button
              className="view-more-button"
              onClick={() => fetchComments()}
            >
              {viewMoreLoading ? <ViewMoreLoading /> : "View More"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function Post() {
  const [postInfo, setPostInfo] = useState({});
  const { currentUser, setShowLogin, token } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const [likeCount, setLikeCount] = useState(null);
  const [liked, setLiked] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [existingBody, setExistingBody] = useState("");
  const [deleted, setDeleted] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const { postId } = useParams();
  const { setShowPopup } = useContext(UIContext);
  const {
    setError500Msg,
    error500Page,
    setError500Page,
    error503,
    setError503,
  } = useContext(ErrorContext);
  const limitedCharBody = 4000;

  const handlePropagation = (e) => {
    e.stopPropagation();
    e.preventDefault();
  };

  //fetch post's info
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(
          `https://sh12345.pythonanywhere.com/get_specific_post?post_id=${postId}`,
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
          if (res.status === 500) {
            setError500Page(true);
          } else if (res.status === 503) {
            setError503(true);
          }
          setPostInfo(null);
          console.error(data.error);
        }
      } catch (err) {
        //backend down; no internet
        setError503(true);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [postId]);

  //to handle clicking "Edit" in Profile
  useEffect(() => {
    if (query.get("edit") === "true" && postInfo.body) {
      setIsEditing(true);
      setExistingBody(postInfo.body);
      navigate(location.pathname, { replace: true }); //remove "edit=true" from URL
    }
  }, [postInfo]);

  //edit post
  const handleEdit = async () => {
    try {
      const res = await fetch(
        `https://sh12345.pythonanywhere.com/edit_post?post_id=${postId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ new_post_body: existingBody }),
        }
      );

      const data = await res.json();
      if (res.ok) {
        setPostInfo((prev) => ({
          ...prev,
          body: existingBody,
        }));
        setIsEditing(false);
      } else {
        if (res.status === 500) {
          setError500Msg(true);
        }
        console.error(data.error);
        setMsg("");
      }
    } catch (err) {
      setError503(true);
    }
  };

  return error503 ? (
    <ServiceUnavailableError503 />
  ) : error500Page ? (
    <InternalServerError500 />
  ) : loading ? (
    <Loading />
  ) : deleted ? (
    <h2 className="post-deleted-msg">Post has been deleted</h2>
  ) : postInfo === null ? (
    <NotExist msg={"Post does not exist or may have been deleted"} />
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
            <img className="pfp" src={`${postInfo.pfp}`} />
            <span className="user-name">{postInfo.name}</span>
          </div>
          <div className="post-date">
            <span className="post-date-dot">&#8226;</span>
            {postInfo.date}
          </div>
          {/* kebab-menu */}
          {currentUser && currentUser.username === postInfo.name && (
            <KebabMenu
              onEdit={() => {
                setIsEditing(true);
                setExistingBody(postInfo.body);
              }}
              onDelete={(e) => {
                showDeletePopup(
                  e,
                  postId,
                  setDeleted,
                  setShowPopup,
                  postInfo.video,
                  setError500Msg,
                  setError503
                );
              }}
            />
          )}
        </div>
        <h2 className="post-title">{postInfo.title}</h2>
        <div className="post-desc-post">{postInfo.description}</div>
        <Tags tags={postInfo.tags} />
        {postInfo.video && (
          <div className="post-video">
            <video controls>
              <source src={postInfo.video} type="video/mp4" />
            </video>
          </div>
        )}
        <div className="post-body">
          {/* if editing, replace body of post with textarea */}
          {isEditing ? (
            <div className="post-edit-wrapper">
              <textarea
                name="post-edit"
                className="post-edit-box"
                value={existingBody}
                onChange={(e) => setExistingBody(e.target.value)}
                maxLength={limitedCharBody}
              />
              <div className="bottom-row">
                <div className="post-edit-buttons">
                  <button onClick={handleEdit}>Save</button>
                  <button onClick={() => setIsEditing(false)}>Cancel</button>
                </div>
                <CharCount
                  currentLength={existingBody.length}
                  maxLength={limitedCharBody}
                />
              </div>
            </div>
          ) : (
            postInfo.body
          )}
        </div>
        <div className="upvotes-comments-wrapper">
          <span className="upvotes">
            <img
              onClick={(e) =>
                handleLikePost(e, token, setShowLogin, () =>
                  likeUnlike(postId, "posts", liked, setLiked, setLikeCount)
                )
              }
              className={liked ? "upvote-icon-liked" : "upvote-icon"}
              src="/images/thumbs-up.svg"
            />
            <div className="upvote-count">{likeCount}</div>
          </span>
          <span className="comments">
            <img className="comments-icon" src="/images/comments.svg" />
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
            setError500Msg={setError500Msg}
            setError500Page={setError500Page}
            setError503={setError503}
          />
        }
      </div>
    </div>
  );
}
