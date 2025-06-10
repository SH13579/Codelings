import React, { useCallback, useState, useEffect } from 'react';
import '../styles/content.css';
import Profile from './Profile';
import projects from '../data/projects';

const ProjectCard = React.memo(function ProjectCard(props) {
  //video component of each project, if the user chooses the add one
  function ProjectVideo(){
    return (
      <div className="project-video">
        <video autoPlay muted controls>
          <source src={`../media/videos/${props.video}`} type="video/mp4" />
          Your browser does not support the video tag.
        </video >
      </div>
    )
  }

  return (
    <div className="project-wrapper">
      <div className="project">
        <div onClick={props.onProfileClick} className="user-info">
          <img className="pfp" src={`../media/images/${props.pfp}`}/>
          <span className="user-name">{props.name}</span>  
        </div>
        <h2 className="project-title">{props.title}</h2>
        {props.video ? <ProjectVideo /> : <div className="project-desc">{props.description}</div>}
        <div className="upvotes-comments-wrapper">
          <img className="upvote-icon" src="../media/images/thumbs-up.svg"/>
          <div className="upvote-count">{props.upvotes}</div>
          <img className="comments-icon" src="../media/images/comments.svg"/>
          <div className="comment-count">{props.comments_count}</div>
        </div>
      </div>
      <div className="horizontal-line"></div>
    </div>
  )
});

export default function Projects(){ 
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
      <div className="projects">
        {all_projects}
      </div>
      {activeProfile && <Profile name={activeProfile.name} setActiveProfile={setActiveProfile}/>}
    </section>
  )
}