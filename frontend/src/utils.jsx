import React, { useState, useEffect, useRef, createContext } from 'react';

export function StarRating({ reviews_stars }){
  //Create a new array of size 5 and for each undefined element in the array, fill it by using it's index (i) as a reference
  let stars = Array.from({length: 5}, (_, i) => {
    return (
      <span 
      key={i} 
      className="review-star"
      style={{color: i+1 <= reviews_stars ? "#ffc107" : "#e4e5e9"}}  //keep filling each star as yellow until its index+1 is more than the stars the user has
      >
        ★
      </span>
    )
  });
  return stars;
}

export function useExitListener(setCond, ref){
  useEffect(() => {
    //handles click outside of the login/register box
    function handleClickOutside(event){
      if(ref.current && !ref.current.contains(event.target)){
        setCond(null);
      }
    }
    //detect any click on the page
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      //clean up the event listener
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setCond, ref]);
}

export const UserContext = createContext(null)