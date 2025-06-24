import React, { useState, useRef, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { handleNavigating } from "./Content";
import { UserContext } from "../utils";

//each individual project component
export default function ProjectCard(props) {
  const [deleted, setDeleted] = useState(false);
  const handlePropagation = (e) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const { currentUser } = useContext(UserContext);

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

  //cannot do state={props} because ProjectCard takes in props that also include functions: onProfileClick={onProfileClick} & onPostClick={onPostClick}
  //Link from React Router reuires the state to be serializable (int, float, str, bool, list, dict, tuple, set, etc.) ***Functions are NOT serializable
  //Serializable: data types that can be converted into a format suitable for storage or transmission (JSON, XML, binary format), and then reconstructed later
  return !deleted ? (
    <Link to={`/post/${props.id}`} className="project-wrapper">
      <div className="project">
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
        <div className="post-desc">{props.description}</div>
        <div className="upvotes-comments-wrapper">
          <span className="upvotes">
            <img className="upvote-icon" src="../media/images/thumbs-up.svg" />
            <div className="upvote-count">{props.upvotes}</div>
          </span>
          <span className="comments">
            <img className="comments-icon" src="../media/images/comments.svg" />
            <div className="comment-count">{props.comments_count}</div>
          </span>
          {props.location === "profile" && currentUser && (
            <span className="delete">
              <img
                onClick={(e) => {
                  props.showDeletePopup(e, props.id, setDeleted);
                }}
                className="delete-icon"
                src="../media/images/delete-icon.svg"
              />
            </span>
          )}
        </div>
      </div>
    </Link>
  ) : null;
}
