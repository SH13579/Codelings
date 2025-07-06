import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { handleNavigating } from "./Content";
import { likeUnlike, UserContext, UIContext, handleLikePost } from "../utils";

export default function AskAnswerCard(props) {
  const [deleted, setDeleted] = useState(false);
  const [liked, setLiked] = useState(props.liked);
  const [likeCount, setLikeCount] = useState(null);
  const navigate = useNavigate();
  const { currentUser, setShowLogin } = useContext(UserContext);
  const { setShowPopup } = useContext(UIContext);

  useEffect(() => {
    setLikeCount(props.upvotes);
  }, [props.upvotes]);

  return !deleted ? (
    <Link to={`/post/${props.id}`} className="ask-ans-wrapper">
      <div className="ask-and-ans">
        <div className="project-first-row">
          {props.location !== "profile" && (
            <div
              onClick={(e) => handleNavigating(e, navigate, props.name)}
              className="user-info"
            >
              <img className="pfp" src={`../media/images/${props.pfp}`} />
              <span className="user-name">{props.name}</span>
            </div>
          )}
          <div className="post-date">
            <span className="post-date-dot">&#8226;</span>
            {props.date}
          </div>
        </div>
        <h3 className="post-title">{props.title}</h3>
        <div className="upvotes-comments-wrapper">
          <span className="upvotes">
            <img
              onClick={(e) =>
                handleLikePost(e, currentUser, setShowLogin, () =>
                  likeUnlike(props.id, "posts", liked, setLiked, setLikeCount)
                )
              }
              className={liked ? "upvote-icon-liked" : "upvote-icon"}
              src="../media/images/thumbs-up.svg"
            />
            <div className="upvote-count">{likeCount}</div>
          </span>
          <span className="comments">
            <img className="comments-icon" src="../media/images/comments.svg" />
            <div className="comment-count">{props.comments_count}</div>
          </span>
          {props.location === "profile" &&
            currentUser &&
            currentUser.username === props.user && (
              <span
                onClick={(e) => {
                  props.showDeletePopup(e, props.id, setDeleted, setShowPopup);
                }}
                className="delete"
              >
                <img
                  className="delete-icon"
                  src="../media/images/delete-icon.svg"
                />
              </span>
            )}
        </div>
      </div>
    </Link>
  ) : (
    <div className="post-deleted">Post deleted</div>
  );
}
