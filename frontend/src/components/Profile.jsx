import React, { useState, useEffect, useRef } from 'react';
import '../styles/profile.css'
import { useExitListener, StarRating } from '../utils';

export default function Profile({ setClickProfile, name, reviews_stars, reviews_count }){
  const profileRef = useRef(null);
  const [clickChat, setClickChat] = useState(false);
  
  useExitListener(setClickProfile, profileRef);

  return (
    <div className="profile-wrapper">
      <div className="blur"></div>
      <div ref={profileRef} className="profile">
        <button className="exit-button" onClick={() => setClickProfile(false)}>&times;</button>
        <div className="profile-info">
          <img className="profile-pfp" src="../images/doggy.png"/>
          <h2 className="profile-name">{name}</h2>
          <button onClick={() => {
            setClickChat(true);
          }}>Chat</button>
        </div>
      </div>
    </div>
  )
};
