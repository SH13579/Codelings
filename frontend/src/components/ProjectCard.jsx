import React, { useState, useRef, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { handleNavigating } from "./Content";
import { UserContext, likeUnlike, UIContext, handleLikePost } from "../utils";
import Tags from "./Tags";
import KebabMenu from "./KebabMenu";

//each individual project component
export default function ProjectCard(props) {
  const [deleted, setDeleted] = useState(false);
  const [liked, setLiked] = useState(props.liked);
  const [likeCount, setLikeCount] = useState(props.upvotes);
  const { token } = useContext(UserContext);
  const { currentUser, setShowLogin } = useContext(UserContext);
  const { setShowPopup } = useContext(UIContext);
  const navigate = useNavigate();

  useEffect(() => {
    setLiked(props.liked);
  }, [props.liked]);

  const handlePropagation = (e) => {
    e.stopPropagation();
    e.preventDefault();
  };

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
          <source src={`/media/videos/${props.video}`} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  };

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
                    props.video
                  )
                }
              />
            )}
        </div>
        <h3 className="post-title">{props.title}</h3>
        <div className="post-desc">{props.description}</div>
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
              src="/media/images/thumbs-up.svg"
            />
            <div className="upvote-count">{likeCount}</div>
          </span>
          <span className="comments">
            <img className="comments-icon" src="/media/images/comments.svg" />
            <div className="comment-count">{props.comments_count}</div>
          </span>
        </div>
      </div>
    </Link>
  ) : (
    <div className="post-deleted">Post deleted</div>
  );
}
