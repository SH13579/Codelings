import React, { useState, useEffect, useRef } from 'react';
import '../styles/profile.css'
import { useExitListener } from '../utils';

const myProfile = ( currentUser ) => {
  
}

export default function Profile({ currentUser, setActiveProfile, name }){
  const profileRef = useRef(null);
  const [clickChat, setClickChat] = useState(false);
  
  useExitListener(setActiveProfile, profileRef);

  return (
    <div className="profile-wrapper">
      <div className="blur"></div>
      <div ref={profileRef} className="profile">
        <button className="exit-button" onClick={() => setActiveProfile(null)}>&times;</button>
        <div className="profile-info">
          <img className="profile-pfp" src="../media/images/doggy.png"/>
          <h2 className="profile-name">{name}</h2>
          <button onClick={() => {
            setClickChat(true);
          }}>Chat</button>
        </div>
      </div>
    </div>
  )
};
