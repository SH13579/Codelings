import React, { useState, useEffect } from 'react';
import '../styles/content.css';
import Profile from './Profile';
import projects from '../data/projects';

function ProjectCard(props){
  const [clickProfile, setClickProfile] = useState(false);
  useEffect(() => {
      document.body.style.overflow = clickProfile ? 'hidden' : 'auto';
  }, [clickProfile])
  return (
    <div className="project-wrapper">
      <div className="project">
        <div onClick={() => setClickProfile(true)} className="user-info">
          <img className="pfp" src={`../images/${props.pfp}`}/>
          <span className="user-name">{props.name}</span>  
        </div>
        <h2 className="project-title">{props.title}</h2>
        <div className="project-desc">{props.description}</div>
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
    <section className="content-wrapper">
      <div className="projects">
        {all_projects}
      </div>
    </section>
  )
}