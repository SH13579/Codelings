import React, { useRef, useCallback, useState, useEffect } from 'react';
import { Link } from 'react-router-dom'
import '../styles/content.css';
import Profile from './Profile';
import projects from '../data/projects';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Post from './Post';
import { v4 as uuidv4 } from 'uuid';

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

  //cannot do state={props} because ProjectCard takes in props that also include functions: onProfileClick={onProfileClick} & onPostClick={onPostClick}
  //Link from React Router reuires the state to be serializable (int, float, str, bool, list, dict, tuple, set, etc.) ***Functions are NOT serializable
  //Serializable: data types that can be converted into a format suitable for storage or transmission (JSON, XML, binary format), and then reconstructed later
  return (
    <Link to="/post" className="project-wrapper"
    state={{
    id: props.id,
    name: props.name,
    pfp: props.pfp,
    title: props.title,
    description: props.description,
    video: props.video,
    comments_count: props.comments_count,
    upvotes: props.upvotes,
    }}>
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

const PostProject = ({ currentUser }) => {
  const [projectPost, setProjectPost] = useState({
    post_title: "",
    post_date: "",
    post_description: "",
    video_file_name: "",
    user_name: currentUser
  });
  const [msg, setMsg] = useState("");

  const handleChange = (e) => {
    setProjectPost(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handlePost = async(e) => {
    e.preventDefault();
    const currentDate = new Date();
    setProjectPost(prev => ({
      ...prev,
      post_date: currentDate
    }));
    
    if(!projectPost.post_title){
      setMsg("Title cannot be empty");
    }
    else if(projectPost.post_title.length > 50){
      setMsg("Title cannot be over 50 characters"); 
    }
    else if(projectPost.post_description.length > 3000){
      setMsg("Description cannot be over 3000 characters");
    }
    else{
      setMsg("Post submitted");
    }
  };

  return (
    <form onSubmit={handlePost} className="post-project">
      <h2 className="create-post">Create Post</h2>
      <div className="post-error">{msg}</div>
      <label>Title<span className="required">*</span></label>
      <input value={projectPost.post_title} onChange={handleChange} className="post-title" type="text" name="post_title"/>
      <label>Description</label>
      <textarea value={projectPost.description} onChange={handleChange} className="post-description" type="text" name="post_description"/>
      <div className="post-project-last">
        <div className="">
          <label>Demo(mp4 only): </label>
          <input onChange={handleChange} type="file" accept=".mp4" name="video_file_name"/>
          <div>OR</div>
          <div>Link: 
            
          </div>
        </div>
        <button className="project-submit">Post</button>
      </div>
    </form>
  )
}

export default function Content({ currentUser }){ 
  const [activeProfile, setActiveProfile] = useState(null);
  //remove ability to scroll any content outside of the profile component
  useEffect(() => {
      document.body.style.overflow = activeProfile ? 'hidden' : 'auto';
  }, [activeProfile])

  const all_projects = projects.map(item => {
    const onProfileClick = useCallback(() => {
      setActiveProfile(item);
    }, [item]);

    return (
      <ProjectCard 
        key={item.id}
        {...item}
        onProfileClick={onProfileClick}
      />
    )
  })
  return (
    <section className="content-wrapper">
      {/* {currentUser && <PostProject currentUser={currentUser}/>} */}
      <PostProject currentUser={currentUser}/>
      <div className="projects">
        {all_projects}
      </div>
      {activeProfile && <Profile name={activeProfile.name} setActiveProfile={setActiveProfile}/>}
    </section>
  )
}