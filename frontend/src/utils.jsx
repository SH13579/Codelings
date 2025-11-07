import React, { useEffect, createContext } from "react";

export function useExitListener(setCond, ref) {
  useEffect(() => {
    if (!setCond || !ref) {
      return;
    }
    //handles click outside of the box
    function handleClickOutside(event) {
      if (
        event.button === 0 &&
        ref.current &&
        !ref.current.contains(event.target)
      ) {
        setCond(null);
      }
    }
    //detect any click on the page
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      //clean up the event listener
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, setCond]);
}

export function useExitListenerWithAlert(setAlert, ref) {
  useEffect(() => {
    //handles click outside of the box
    function handleClickOutside(event) {
      if (
        event.button === 0 &&
        ref.current &&
        !ref.current.contains(event.target)
      ) {
        setAlert("quit?");
      }
    }
    //detect any click on the page
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      //clean up the event listener
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, setAlert]);
}

//empty container when the database fetched nothing
export const EmptyContainer = () => {
  return (
    <div className="empty-container-wrapper">
      <img className="empty-icon" src="/images/empty.svg" />
      <div>Empty here...</div>
    </div>
  );
};

export async function likeUnlike(
  target_id,
  type,
  liked,
  setLiked,
  setLikeCount
) {
  liked ? setLikeCount((prev) => prev - 1) : setLikeCount((prev) => prev + 1);
  setLiked(!liked);
  const token = sessionStorage.getItem("token");
  try {
    const res = await fetch("https://sh12345.pythonanywhere.com/like_unlike", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ target_id: target_id, type: type }),
    });

    const data = await res.json();

    if (!res.ok) {
      liked
        ? setLikeCount((prev) => prev + 1)
        : setLikeCount((prev) => prev - 1);
      setLiked(!liked);
    }
  } catch (err) {
    alert("Error: " + err.message);
  }
}

export function handleLikePost(e, token, setShowLogin, likeUnlike) {
  e.preventDefault();
  e.stopPropagation();
  if (!token) {
    setShowLogin(true);
    return;
  }
  likeUnlike();
}

export function handleFilter(
  setPostType,
  setFilter,
  setStart,
  setHasMore,
  filterValue
) {
  setPostType([]); // clears posts immediately
  setStart(0); // resets pagination offset
  setHasMore(true); // resets "has more" flag
  setFilter(filterValue); // changes filter, triggers useEffect fetch
}

export const UserContext = createContext(null);
export const UIContext = createContext(null);
export const ErrorContext = createContext(null);
