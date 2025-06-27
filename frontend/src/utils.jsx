import React, { useEffect, createContext, useRef } from "react";

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

//empty container when the database fetched nothing
export const EmptyContainer = () => {
  return (
    <div className="empty-container-wrapper">
      <img className="empty-icon" src="../media/images/empty.svg" />
      <div>Empty here...</div>
    </div>
  );
};

export async function fetchLiked(setLiked, type, token) {
  try {
    const res = await fetch(`http://localhost:5000/fetch_likes?type=${type}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    setLiked(data.likes_arr);
  } catch (err) {
    alert("Error: " + err.message);
  }
}

export function displayLiked(setLiked, type) {
  const token = sessionStorage.getItem("token");
  useEffect(() => {
    if (token) {
      fetchLiked(setLiked, type, token);
    } else {
      setLiked([]);
    }
  }, [token]);
}

export async function likeUnlike(
  e,
  target_id,
  type,
  liked,
  setLiked,
  setLikeCount
) {
  e.preventDefault();
  e.stopPropagation();
  liked ? setLikeCount((prev) => prev - 1) : setLikeCount((prev) => prev + 1);
  setLiked(!liked);
  const token = sessionStorage.getItem("token");
  try {
    const res = await fetch("http://localhost:5000/like_unlike", {
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
        ? setLikeCount((prev) => prev - 1)
        : setLikeCount((prev) => prev + 1);
      setLiked(!liked);
    }
  } catch (err) {
    alert("Error: " + err.message);
  }
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

//function to fetch 10 posts at a time
export async function fetchPosts(
  setPostType,
  setStart,
  setHasMore,
  route,
  limit,
  reset = false
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
    if (reset) {
      setPostType(data.posts);
      setStart(data.posts.length);
    } else {
      //update all the posts displayed
      setPostType((prev) => [...prev, ...data.posts]);
      //increment the offset to fetch the next batch of 10 posts
      setStart((prev) => prev + limit);
    }
  } catch (err) {
    alert("Error: " + err.message);
  }
}

//hook to display the posts of a particular section for homepage and profile
export function displaySectionPosts(
  postType,
  fetchPostsByCategory,
  setPosts,
  startPost,
  setStartPost,
  setHasMorePost,
  postFilter,
  username = null //only for profile section
) {
  const firstRun = useRef(null);

  useEffect(() => {
    // if (!firstRun.current) {
    //   firstRun.current = true;
    //   return;
    // }
    setStartPost(0);
    setHasMorePost(true);
    fetchPostsByCategory(
      postType,
      setPosts,
      0,
      setStartPost,
      setHasMorePost,
      postFilter,
      10,
      true,
      username //only for profile section
    );
  }, [postFilter]);
}

export function infiniteScrolling() {
  useEffect(() => {
    let timeout;
    const handleInfiniteScroll = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const bottomOfPage =
          document.documentElement.scrollHeight - window.innerHeight;
        if (window.scrollY + 300 >= bottomOfPage) {
          console.log(startProject);
          if (hasMoreQna) {
            fetchPostsByCategory(
              "qna",
              setAskAndAnswers,
              startQna,
              setStartQna,
              setHasMoreQna,
              qnaFilter,
              12
            );
          }
          if (hasMoreProject) {
            fetchPostsByCategory(
              "project",
              setProjects,
              startProject,
              setStartProject,
              setHasMoreProject,
              projectFilter,
              10
            );
          }
        }
      }, 250);
    };

    window.addEventListener("scroll", handleInfiniteScroll);

    return () => {
      window.removeEventListener("scroll", handleInfiniteScroll);
    };
  }, [startQna, startProject, hasMoreQna, hasMoreProject]);
}

export const UserContext = createContext(null);
