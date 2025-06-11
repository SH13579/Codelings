import React, { useCallback, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/content.css';
import Profile from './Profile'
import projects from '../data/projects';

export default function Post(props) {
  const location = useLocation(); //useLocation gives access to the current URL's location object (including any state/props passed with a <Link>)
  const project = location.state?.project;  //? indicates whether or not there is a state/prop passed
  //replace "item" and "props" with project

  // const [activeProfile, setActiveProfile] = useState(null);
  // //remove ability to scroll any content outside of the profile component
  // useEffect(() => {
  //     document.body.style.overflow = activeProfile ? 'hidden' : 'auto';
  // }, [activeProfile])

  // const onProfileClick = useCallback(() => {
  //     setActiveProfile(props);
  //   }, [props]);

  return (
    <div>
      <h1>YO</h1>
    </div>
    // <div className="project-wrapper">
    //   <div className="project">
    //     <div onClick={(e) => {
    //       handlePropagation(e);
    //       onProfileClick();
    //     }} className="user-info">
    //       <img className="pfp" src={`../media/images/${props.pfp}`}/>
    //       <span className="user-name">{props.name}</span>  
    //     </div>
    //   </div>
    //   <div>Title: {props.title}</div>
    //   <div>Description: {props.description}</div>

    //   {activeProfile && <Profile name={activeProfile.name} setActiveProfile={setActiveProfile}/>}
    // </div>
  )
}