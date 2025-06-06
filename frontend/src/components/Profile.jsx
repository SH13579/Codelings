import React, { useEffect, useRef } from 'react';
import '../styles/profile.css'
import { useExitListener, StarRating } from '../utils';

export default function Profile({ setClickProfile, name, reviews_stars, reviews_count }){
  const profileRef = useRef(null);
  
  useExitListener(setClickProfile, profileRef);

  return (
    <div className="profile-wrapper">
      <div className="blur"></div>
      <div ref={profileRef} className="profile">
        <button className="exit-button" onClick={() => setClickProfile(false)}>&times;</button>
        <div className="profile-info">
          <img className="profile-pfp" src="../images/doggy.png"/>
          <h2 className="profile-name">{name}</h2>
          <div className="reviews-wrapper">
            <span className="reviews-stars">
              <StarRating reviews_stars={reviews_stars}/>
            </span>
            <span className="reviews-count">{`(${reviews_count})`}</span>
          </div>
          <span></span>
        </div>
      </div>
    </div>
  )
};
