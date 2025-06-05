import React, { useState }from 'react';
import '../styles/content.css'
import services from '../data/services'

function StarRating({ reviews_stars }){
  let stars = Array.from({length: 5}, (_, i) => {
    console.log(reviews_stars);
    return (
      <span 
      key={i} 
      className="review-star"
      style={{color: i < reviews_stars ? "#ffc107" : "#e4e5e9"}}
      >
        ★
      </span>
    )
  });

  return stars;
}

function ServiceCard(props){
  return (
    <div className="service-wrapper">
      <div className="service">
        <div className="user-info">
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
      <div class="horizontal-line"></div>
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
      <form action="/search" method="GET" className="search-bar">
        <input type="search" placeholder="Search for a specific topic..."/>
        <button type="submit">Search</button>
      </form>
      <div className="services">
        {all_services}
      </div>
    </section>
  )
}