import React, { useEffect, createContext } from "react";

export function useExitListener(setCond, ref) {
  useEffect(() => {
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

//function to fetch 10 posts at a time
export async function fetchPosts(
  setPostType,
  setStart,
  setHasMore,
  route,
  limit
) {
  try {
    const res = await fetch(route, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    const data = await res.json();
    //if the number of posts received is lower than the limit, it means there's no more posts left to fetch
    if (data.posts.length < limit) {
      setHasMore(false);
    }
    //update all the posts displayed
    setPostType((prev) => [...prev, ...data.posts]);
    //increment the offset to fetch the next batch of 10 posts
    setStart((prev) => prev + limit);
  } catch (err) {
    alert("Error: " + err.message);
  }
}

//empty container when the database fetched nothing
export const EmptyContainer = () => {
  return (
    <div className="empty-container-wrapper">
      <img className="empty-icon" src="../media/images/empty.svg" />
      <div>Empty here...</div>
    </div>
  );
};

//when changing the filter, we want to make we change the states back to it's initial value so that it start at 5 posts again
export function handleFilter(
  setPostType,
  setFilter,
  setStart,
  setHasMore,
  filterValue
) {
  setPostType([]);
  setStart(0);
  setHasMore(true);
  setFilter(filterValue);
}

export const UserContext = createContext(null);
