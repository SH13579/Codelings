import React, { useState, useEffect } from 'react';
import '../styles/content.css';
import Profile from './Profile';
import projects from '../data/projects';

function ProjectCard(props){
  const [clickProfile, setClickProfile] = useState(false);
  //remove ability to scroll any content outside of the profile component
  useEffect(() => {
      document.body.style.overflow = clickProfile ? 'hidden' : 'auto';
  }, [clickProfile])

  //video component of each project, if the user chooses the add one
  function ProjectVideo(){
    return (
      <div className="project-video">
        <video controls>
          <source src={`../media/videos/${props.video}`} type="video/mp4" />
          Your browser does not support the video tag.
        </video >
      </div>
    )
  }

  return (
    <div className="project-wrapper">
      <div className="project">
        <div onClick={() => setClickProfile(true)} className="user-info">
          <img className="pfp" src={`../media/images/${props.pfp}`}/>
          <span className="user-name">{props.name}</span>  
        </div>
        <h2 className="project-title">{props.title}</h2>
        {props.video !== null ? <ProjectVideo /> : null}
        {props.video == null ? <div className="project-desc">{props.description}</div> : null}
        <div className="upvotes-comments-wrapper">
          <img className="upvote-icon" src="../media/images/thumbs-up.svg"/>
          <div className="upvote-count">{props.upvotes}</div>
          <img className="comments-icon" src="../media/images/comments.svg"/>
          <div className="comment-count">{props.comments_count}</div>
        </div>
      </div>
      <div className="horizontal-line"></div>
      {clickProfile ? <Profile name={props.name} reviews_count={props.reviews_count} reviews_stars={props.reviews_stars} setClickProfile={setClickProfile}/> : null}
    </div>
  )
}

export default function Projects(){ 
  const all_projects = projects.map(item => {
    return (
      <ProjectCard 
        key={item.id}
        {...item}
      />
    )
  }

  )
  return (
    <section className="content-wrapper" id="content-wrapper">
      <div className="projects">
        {all_projects}
      </div>
    </section>
  )
}