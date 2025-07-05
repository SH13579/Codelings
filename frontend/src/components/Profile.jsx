import React, { useState, useContext, useEffect } from "react";
import "../styles/profile.css";
import { UserContext, displayLiked, UIContext } from "../utils";
import { useParams } from "react-router-dom";
import SectionsNavbar from "./SectionsNavbar";
import Posts from "./Posts";

export function showDeletePopup(e, post_id, setDeleted, setShowPopup) {
  e.preventDefault();
  e.stopPropagation();
  const token = sessionStorage.getItem("token");
  async function deletePost() {
    try {
      const res = await fetch("http://localhost:5000/delete_post", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          post_id: post_id,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        // ❗ show the error from Python backend
        alert("Error: " + data.error);
        return;
      }
      if (res.ok) {
        setDeleted(true);
        setShowPopup(null);
      }
    } catch (err) {
      alert("Error" + err.message);
    }
  }
  setShowPopup({
    message: (
      <div>
        <h3>Delete Post?</h3>
        <h4>Action cannot be restored</h4>
      </div>
    ),
    buttons: [
      {
        label: "Yes",
        action: deletePost,
      },
      {
        label: "Cancel",
        action: () => setShowPopup(null),
      },
    ],
  });
}

async function fetchLikedPosts(
  start,
  setStart,
  setPosts,
  setHasMore,
  limit,
  reset = false,
  setLoading,
  token
) {
  setLoading(true);
  try {
    const res = await fetch(
      `http://localhost:5000/fetch_liked_posts?limit=${limit}&offset=${
        reset ? 0 : start
      }`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const data = await res.json();
    if (data.liked_posts.length < limit) {
      setHasMore(false);
    }
    if (reset) {
      setStart(data.liked_posts.length);
      setPosts(data.liked_posts);
    } else {
      setStart((prev) => prev + limit);
      setPosts((prev) => [...prev, ...data.liked_posts]);
    }
  } catch (err) {
    alert("Error: " + err.message);
  } finally {
    setLoading(false);
  }
}

async function fetchPostsProfile(
  postType,
  setPosts,
  start,
  setStart,
  setHasMore,
  filter,
  limit,
  reset = false,
  username,
  setLoading
) {
  const category = filter === "Best" ? "likes" : "post_date";
  setLoading(true);
  try {
    const res = await fetch(
      `http://localhost:5000/get_posts_byUserAndCategory?username=${encodeURIComponent(
        username
      )}&post_type=${encodeURIComponent(postType)}&category=${category}&start=${
        reset ? 0 : start
      }&limit=${limit}`,
      {
        headers: { Accept: "application/json" },
      }
    );
    const data = await res.json();
    //if the number of posts received is lower than the limit, it means there's no more posts left to fetch
    if (data.posts.length < limit) {
      setHasMore(false);
    }
    if (reset) {
      setPosts(data.posts);
      setStart(data.posts.length);
    } else {
      //update all the posts displayed
      setPosts((prev) => [...prev, ...data.posts]);
      //increment the offset to fetch the next batch of 10 posts
      setStart((prev) => prev + limit);
    }
  } catch (err) {
    alert("Error: " + err.message);
  } finally {
    setLoading(false);
  }
}

export default function Profile() {
  const token = sessionStorage.getItem("token");
  const { loading, setLoading } = useContext(UIContext);
  const [likedPosts, setLikedPosts] = useState([]);
  const [currentSection, setCurrentSection] = useState("project");
  const [posts, setPosts] = useState([]);
  const [start, setStart] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [postFilter, setPostFilter] = useState("Best");
  const location = "profile";
  const { username } = useParams();

  const navbar_sections = [
    {
      sectionDbName: "project",
      imagePath: "../media/images/projects-logo.svg",
      sectionName: "Projects",
    },
    {
      sectionDbName: "qna",
      imagePath: "../media/images/askAnswer.svg",
      sectionName: "Ask & Answer",
    },
    {
      sectionDbName: "liked_posts",
      imagePath: "../media/images/liked_section_icon.svg",
      sectionName: "Liked Posts",
    },
  ];

  displayLiked(setLikedPosts, "posts", setLoading);

  // useEffect(() => {
  //   console.log(likedPosts);
  // }, [likedPosts]);

  // useEffect(() => {
  //   console.log(posts);
  // }, [posts]);

  return (
    <div className="profile-wrapper">
      <div className="profile">
        <div className="profile-info">
          <img className="profile-pfp" src="../media/images/doggy.png" />
          <h2 className="profile-name">@{username}</h2>
          <div className="profile-about">
            AboutUsAboutUsAbout UsAboutU sAboutUsAboutUsAboutU AboutUsAboutU
            sAboutUsAbo utUsAboutUsAbout UsAboutUsAboutU sAboutU sAboutU
            sAboutUs AboutUsAb ou tUsAboutUs
          </div>
        </div>
        <div className="horizontal-line"></div>
        <div className="content-grid">
          <SectionsNavbar
            sections={navbar_sections}
            setCurrentSection={setCurrentSection}
            currentSection={currentSection}
          />
          {currentSection === "project" && (
            <Posts
              displaySectionPosts={() =>
                fetchPostsProfile(
                  currentSection,
                  setPosts,
                  start,
                  setStart,
                  setHasMore,
                  postFilter,
                  10,
                  true,
                  username,
                  setLoading
                )
              }
              fetchMorePosts={() =>
                fetchPostsProfile(
                  currentSection,
                  setPosts,
                  start,
                  setStart,
                  setHasMore,
                  postFilter,
                  10,
                  false,
                  username,
                  setLoading
                )
              }
              currentSection={currentSection}
              location={location}
              username={username}
              postLabel="Projects"
              posts={posts}
              likedPosts={likedPosts}
              hasMorePosts={hasMore}
              setHasMorePosts={setHasMore}
              filter={postFilter}
              setFilter={setPostFilter}
            />
          )}
          {currentSection === "qna" && (
            <Posts
              displaySectionPosts={() =>
                fetchPostsProfile(
                  currentSection,
                  setPosts,
                  start,
                  setStart,
                  setHasMore,
                  postFilter,
                  10,
                  true,
                  username,
                  setLoading
                )
              }
              fetchMorePosts={() =>
                fetchPostsProfile(
                  currentSection,
                  setPosts,
                  start,
                  setStart,
                  setHasMore,
                  postFilter,
                  10,
                  false,
                  username,
                  setLoading
                )
              }
              currentSection={currentSection}
              location={location}
              username={username}
              postLabel="Ask & Answers"
              posts={posts}
              likedPosts={likedPosts}
              hasMorePosts={hasMore}
              setHasMorePosts={setHasMore}
              filter={postFilter}
              setFilter={setPostFilter}
            />
          )}
          {currentSection === "liked_posts" && (
            <Posts
              displaySectionPosts={() =>
                fetchLikedPosts(
                  start,
                  setStart,
                  setPosts,
                  setHasMore,
                  10,
                  true,
                  setLoading,
                  token
                )
              }
              fetchMorePosts={() =>
                fetchLikedPosts(
                  start,
                  setStart,
                  setPosts,
                  setHasMore,
                  10,
                  false,
                  setLoading,
                  token
                )
              }
              currentSection={currentSection}
              location={location}
              username={username}
              postLabel="Liked Posts"
              posts={posts}
              likedPosts={likedPosts}
              hasMorePosts={hasMore}
              setHasMorePosts={setHasMore}
            />
          )}
        </div>
      </div>
    </div>
  );
}
