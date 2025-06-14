import React, { useRef, useCallback, useState, useEffect } from 'react';
import { Link } from 'react-router-dom'
import '../styles/content.css';
import Profile from './Profile';
import projects from '../data/projects';
import Post from './Post';

const AboutUs = () => {
  return (
    <section className="about-us">
      <div className="about-us-wrapper">
        <h1 className="about-us-title">Share your Coding Projects</h1>
        <h2 className="about-us-description">A place for tech students to showcase their work and connect with others</h2>
        <form className="search-wrapper" action="/search" method="GET">
          <input className="search-bar" type="search" placeholder="Looking for something?"/>
        </form>
      </div>
    </section>
  )
}

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
        {/* {props.video ? <ProjectVideo/> : <div className="project-desc">{props.description}</div>} */}
        <div className="project-desc">{props.description}</div>
        <div className="upvotes-comments-wrapper">
          <span className="upvotes">
            <img className="upvote-icon" src="../media/images/thumbs-up.svg"/>
            <div className="upvote-count">{props.upvotes}</div>
          </span>
          <span className="comments">
            <img className="comments-icon" src="../media/images/comments.svg"/>
            <div className="comment-count">{props.comments_count}</div>
          </span>
        </div>
      </div>
    </Link>
  )
});

export default function Content(){ 
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
      <AboutUs/>
      <div className="projects">
        {all_projects}
      </div>
      {activeProfile && <Profile name={activeProfile.name} setActiveProfile={setActiveProfile}/>}
    </section>
  )
}