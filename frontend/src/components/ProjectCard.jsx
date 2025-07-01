import React, { useState, useRef, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { handleNavigating } from "./Content";
import { UserContext, likeUnlike } from "../utils";

//each individual project component
export default function ProjectCard(props) {
  const [deleted, setDeleted] = useState(false);
  const [liked, setLiked] = useState(props.liked);
  const [likeCount, setLikeCount] = useState(props.upvotes);
  const handlePropagation = (e) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const { currentUser, setShowPopup } = useContext(UserContext);

  const navigate = useNavigate();

  const ProjectVideo = () => {
    const videoRef = useRef(null);
    const [playVideo, setPlayVideo] = useState(false);

    function playOrPause() {
      if (playVideo) {
        videoRef.current.pause();
        setPlayVideo(false);
      } else {
        videoRef.current.play();
        setPlayVideo(true);
      }
    }

    return (
      <div
        onClick={(e) => {
          handlePropagation(e);
          playOrPause();
        }}
        className="post-video"
      >
        <video ref={videoRef} controls>
          <source src={`../media/videos/${props.video}`} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  };

  const Tags = () => {
    if (props.tags[0] === null) {
      return;
    }
    const all_tags = props.tags.map((item) => {
      return <div className="post-tag">#{item}</div>;
    });
    return <div className="post-tags">{all_tags}</div>;
  };

  useEffect(() => {
    setLikeCount(props.upvotes);
  }, [props.upvotes]);

  useEffect(() => {
    setLiked(props.liked);
  }, [props.liked]);

  return !deleted ? (
    <Link to={`/post/${props.id}`} className="project-wrapper">
      <div className="project">
        <div className="project-first-row">
          {props.location !== "profile" && (
            <div
              onClick={(e) => handleNavigating(e, navigate, props.name)}
              className="user-info"
            >
              <img className="pfp" src={props.pfp} />
              <span className="user-name">{props.name}</span>
            </div>
          )}
          <div className="post-date">
            <span className="post-date-dot">&#8226;</span>
            {props.date}
          </div>
        </div>
        <h3 className="post-title">{props.title}</h3>
        <div className="post-desc">{props.description}</div>
        {props.tags && <Tags />}
        <div className="upvotes-comments-wrapper">
          <span className="upvotes">
            <img
              onClick={(e) =>
                likeUnlike(e, props.id, "posts", liked, setLiked, setLikeCount)
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
              <span className="delete">
                <img
                  onClick={(e) => {
                    props.showDeletePopup(
                      e,
                      props.id,
                      setDeleted,
                      setShowPopup
                    );
                  }}
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
