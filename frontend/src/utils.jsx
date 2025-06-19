import React, { useState, useEffect, useRef, createContext } from 'react';

export function useExitListener(setCond, ref){
  useEffect(() => {
    //handles click outside of the login/register box
    function handleClickOutside(event){
      if(event.button === 0 && ref.current && !ref.current.contains(event.target)){
        setCond(null);
      }
    }
    //detect any click on the page
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      //clean up the event listener
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref]);
}

export const UserContext = createContext(null)