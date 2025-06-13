import React, { useCallback, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/post.css'
import Profile from './Profile'
import projects from '../data/projects';
import comments from '../data/comments';

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

  const Comments = () => {
    return (
      <div className="comments-wrapper">
        <h3>Comments</h3>
        <div>
          {/* 
            Fetch from database to display comments of current post
            Add input for user to post a comment
          */}
          {comments.map(item => {
            return (
              <div className="comment">
                <div className="user-info">
                  <img className="pfp" src={`../media/images/${item.pfp}`}/>
                  <div>{item.name}</div>
                </div>
                <div>{item.comment}</div>
              </div>
            )
          })}
          <label></label>
          <input type="text" name="username" placeholder="Add a comment"/>
        </div>
      </div>
    )
  }
  
  
  return (
    <div className="content-wrapper no-hover">
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
          <div className="project-desc-post">{post.description}</div>
          <div className="upvotes-comments-wrapper">
            <img className="upvote-icon" src="../media/images/thumbs-up.svg"/>
            <div className="upvote-count">{post.upvotes}</div>
            <img className="comments-icon" src="../media/images/comments.svg"/>
            <div className="comment-count">{post.comments_count}</div>
          </div>
          {<Comments />}
        </div>
        
        {activeProfile && <Profile className="profile" name={activeProfile.name} setActiveProfile={setActiveProfile}/>}
      </div>
    </div>
  )
}