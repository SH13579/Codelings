import React, { useCallback, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/content.css';
import Profile from './Profile'
import projects from '../data/projects';

export default function Post() {
  const {state: post } = useLocation(); //useLocation gives access to the current route's location object (including any state/props passed via <Link>)
  const [activeProfile, setActiveProfile] = useState(null);
  const handlePropagation = (e) => {
    e.stopPropagation();
    e.preventDefault();
  }

  //remove ability to scroll any content outside of the profile component
  useEffect(() => {
      document.body.style.overflow = activeProfile ? 'hidden' : 'auto';
  }, [activeProfile])

  const onProfileClick = useCallback(() => {
      setActiveProfile(post);
    }, [post]);

  return (
    <div className="content-wrapper">
      <div className="project-wrapper">
        <div className="project">
          <div onClick={(e) => {
            handlePropagation(e);
            onProfileClick();
          }} className="user-info">
            <img className="pfp" src={`../media/images/${post.pfp}`}/>
            <span className="user-name">{post.name}</span>  
          </div>
          <h2 className="project-title">{post.title}</h2>
          <div className="project-video">
            <video controls> 
              <source src={`../media/videos/${post.video}`} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
          <h2 className="project-desc">Description: {post.description}</h2>
          <div className="upvotes-comments-wrapper">
            <img className="upvote-icon" src="../media/images/thumbs-up.svg"/>
            <div className="upvote-count">{post.upvotes}</div>
            <img className="comments-icon" src="../media/images/comments.svg"/>
            <div className="comment-count">{post.comments_count}</div>
          </div>
        </div>
        
        {activeProfile && <Profile name={activeProfile.name} setActiveProfile={setActiveProfile}/>}
      </div>
    </div>
  )
}