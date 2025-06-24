import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { handleNavigating } from "./Content";

export default function AskAnswerCard(props) {
  const [deleted, setDeleted] = useState(false);
  const navigate = useNavigate();

  return !deleted ? (
    <Link to={`/post/${props.id}`} className="ask-ans-wrapper">
      <div className="ask-and-ans">
        <div className="project-first-row">
          {props.location === "home-page" && (
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
        <h2 className="post-title">{props.title}</h2>
        <div className="upvotes-comments-wrapper">
          <span className="upvotes">
            <img className="upvote-icon" src="../media/images/thumbs-up.svg" />
            <div className="upvote-count">{props.upvotes}</div>
          </span>
          <span className="comments">
            <img className="comments-icon" src="../media/images/comments.svg" />
            <div className="comment-count">{props.comments_count}</div>
          </span>
          {props.location === "profile" && (
            <span
              onClick={(e) => {
                props.showDeletePopup(e, props.id, setDeleted);
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
