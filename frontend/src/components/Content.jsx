import React, { useState, useEffect } from 'react';
import '../styles/content.css';
import Profile from './Profile';
import services from '../data/services';
import { StarRating } from '../utils';

function ServiceCard(props){
  const [clickProfile, setClickProfile] = useState(false);
  useEffect(() => {
      document.body.style.overflow = clickProfile ? 'hidden' : 'auto';
  }, [clickProfile])
  return (
    <div className="service-wrapper">
      <div className="service">
        <div onClick={() => setClickProfile(true)} className="user-info">
          <img className="pfp" src={`../images/${props.pfp}`}/>
          <div className="user-name-review-wrapper">
            <span className="user-name">{props.name}</span>
            <div className="reviews-wrapper">
              <span className="reviews-stars">
                <StarRating reviews_stars={props.reviews_stars}/>
              </span>
              <span className="reviews-count">{`(${props.reviews_count})`}</span>
            </div>
          </div>
        </div>
        <h2 className="service-title">
          <span className="language">{props.user_language}</span> for <span className="language">{props.target_language}</span></h2>
        <div className="service-desc">{props.description}</div>
      </div>
      <div className="horizontal-line"></div>
      {clickProfile ? <Profile name={props.name} reviews_count={props.reviews_count} reviews_stars={props.reviews_stars} setClickProfile={setClickProfile}/> : null}
    </div>
  )
}

export default function Services(){ 
  const all_services = services.map(item => {
    return (
      <ServiceCard 
        key={item.id}
        {...item}
      />
    )
  }

  )
  return (
    <section className="content-wrapper">
      <div className="services">
        {all_services}
      </div>
    </section>
  )
}