import React, { useRef, useCallback, useState, useEffect } from 'react';
import { Link } from 'react-router-dom'
import '../styles/content.css';
import Profile from './Profile';
import projects from '../data/projects';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Post from './Post';

const ProjectCard = React.memo((props) => {
  const handlePropagation = (e) => {
    e.stopPropagation();
    e.preventDefault();
  }

  const ProjectVideo = () => {
    const videoRef = useRef(null);
    const [playVideo, setPlayVideo] = useState(false);

    function playOrPause(){
      if(playVideo){
        videoRef.current.pause();
        setPlayVideo(false);
      }
      else{
        videoRef.current.play();
        setPlayVideo(true);
      }
    }
    
    return (
      <div onClick={(e) => {
        handlePropagation(e);
        playOrPause();
      }}className="project-video">
        <video ref={videoRef} controls> 
          <source src={`../media/videos/${props.video}`} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    )
  }

  return (
    <Link to="/post" onClick={props.onPostClick}  className="project-wrapper">
      <div className="project">
        <div onClick={(e) => {
          handlePropagation(e);
          props.onProfileClick();
        }} className="user-info">
          <img className="pfp" src={`../media/images/${props.pfp}`}/>
          <span className="user-name">{props.name}</span>  
        </div>
        <h2 className="project-title">{props.title}</h2>
        {props.video ? <ProjectVideo/> : <div className="project-desc">{props.description}</div>}
        <div className="upvotes-comments-wrapper">
          <img className="upvote-icon" src="../media/images/thumbs-up.svg"/>
          <div className="upvote-count">{props.upvotes}</div>
          <img className="comments-icon" src="../media/images/comments.svg"/>
          <div className="comment-count">{props.comments_count}</div>
        </div>
      </div>
      <div className="horizontal-line"></div>
    </Link>
  )
});

const PostProject = () => {
  return (
    <form className="post-project">
      <h2 className="create-post">Create Post</h2>
      <label>Title<span className="required">*</span></label>
      <input className="post-title" type="text" name="post-title"/>
      <label>Description:</label>
      <textarea className="post-description" type="text" name="post-description"/>
      <div className="post-project-last">
        <div>
          <label>Demo: </label>
          <input type="file" accept="video/*" placeholder="Add Video"/>
        </div>
        <button className="project-submit">Post</button>
      </div>
    </form>
  )
}

export default function Projects(){ 
  const [activeProfile, setActiveProfile] = useState(null);
  const [activePost, setActivePost] = useState(null);
  //remove ability to scroll any content outside of the profile component
  useEffect(() => {
      document.body.style.overflow = activeProfile ? 'hidden' : 'auto';
  }, [activeProfile])

  const all_projects = projects.map(item => {
    const onProfileClick = useCallback(() => {
      setActiveProfile(item);
    }, [item]);

    const onPostClick = useCallback(() => {
      setActivePost(item);
    }, [item])

    return (
      <ProjectCard 
        key={item.id}
        {...item}
        onProfileClick={onProfileClick}
        onPostClick={onPostClick}
      />
    )
  })
  return (
    <section className="content-wrapper">
      <PostProject />
      <div className="projects">
        {all_projects}
      </div>
      {activeProfile && <Profile name={activeProfile.name} setActiveProfile={setActiveProfile}/>}
      <Routes>
        <Route path="/post" element={<Post />} />
      </Routes>
    </section>
  )
}