import React, { useState, useRef, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { handleNavigating } from "./Content";
import {
  UserContext,
  likeUnlike,
  UIContext,
  handleLikePost,
  ErrorContext,
} from "../utils";
import Tags from "./Tags";
import KebabMenu from "./KebabMenu";

//each individual project component
export default function PostCard(props) {
  const [deleted, setDeleted] = useState(false);
  const [liked, setLiked] = useState(props.liked);
  const [likeCount, setLikeCount] = useState(props.upvotes);
  const { token } = useContext(UserContext);
  const { currentUser, setShowLogin } = useContext(UserContext);
  const { setShowPopup } = useContext(UIContext);
  const navigate = useNavigate();
  const { setError500Msg, setError503 } = useContext(ErrorContext);

  //display whether the post is liked by the user
  useEffect(() => {
    setLiked(props.liked);
  }, [props.liked]);

  const handleEdit = () => {
    navigate(`/post/${props.id}?edit=true`);
  };

  return !deleted ? (
    <Link to={`/post/${props.id}`} className="project-wrapper">
      <div className="project">
        <div className="project-first-row">
          <div
            onClick={(e) => handleNavigating(e, navigate, props.name)}
            className="user-info"
          >
            <img className="pfp" src={props.pfp} />
            <span className="user-name">{props.name}</span>
          </div>
          <div className="post-date">
            <span className="post-date-dot">&#8226;</span>
            {props.date}
          </div>
          {props.location === "profile" &&
            currentUser &&
            currentUser.username === props.name && (
              <KebabMenu
                onEdit={() => {
                  handleEdit(); //navigates to Post
                }}
                onDelete={(e) =>
                  props.showDeletePopup(
                    e,
                    props.id,
                    setDeleted,
                    setShowPopup,
                    props.video,
                    setError500Msg,
                    setError503
                  )
                }
              />
            )}
        </div>
        <h3 className="post-title">{props.title}</h3>
        <Tags tags={props.tags} />
        <div className="upvotes-comments-wrapper">
          <span className="upvotes">
            <img
              onClick={(e) =>
                handleLikePost(e, token, setShowLogin, () =>
                  likeUnlike(props.id, "posts", liked, setLiked, setLikeCount)
                )
              }
              className={liked ? "upvote-icon-liked" : "upvote-icon"}
              src="/images/thumbs-up.svg"
            />
            <div className="upvote-count">{likeCount}</div>
          </span>
          <span className="comments">
            <img className="comments-icon" src="/images/comments.svg" />
            <div className="comment-count">{props.comments_count}</div>
          </span>
        </div>
      </div>
    </Link>
  ) : (
    <div className="post-deleted">Post deleted</div>
  );
}
