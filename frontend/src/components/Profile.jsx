import React, { useState, useContext, useEffect } from "react";
import "../styles/profile.css";
import { UserContext, displayLiked } from "../utils";
import { useParams } from "react-router-dom";
import Projects from "./Projects";
import AskAndAnswers from "./AskAndAnswers";
import ContentNavbar from "./ContentNavbar";

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
        console.log(data.success);
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

async function fetchPostsProfile(
  postType,
  setPostType,
  start,
  setStart,
  setHasMore,
  filter,
  limit,
  reset = false,
  username
) {
  const category = filter === "Best" ? "likes" : "post_date";
  try {
    const res = await fetch(
      `http://localhost:5000/get_posts_byUserAndCategory?username=${encodeURIComponent(
        username
      )}&post_type=${encodeURIComponent(postType)}&category=${category}&start=${
        reset ? 0 : start
      }&limit=${limit}`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
      }
    );
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

export default function Profile() {
  const token = sessionStorage.getItem("token");
  const [clickChat, setClickChat] = useState(false);
  const { currentUser, setCurrentUser } = useContext(UserContext);
  const [likedPosts, setLikedPosts] = useState([]);
  const [currentSection, setCurrentSection] = useState("project");
  const [posts, setPosts] = useState([]);
  const [start, setStart] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [postFilter, setPostFilter] = useState("Best");
  const [tags, setTags] = useState([]);
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
  ];

  console.log("Rendering Profile");

  displayLiked(setLikedPosts, "posts");

  useEffect(() => {
    console.log(posts);
  }, [posts]);

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
          <ContentNavbar
            sections={navbar_sections}
            setCurrentSection={setCurrentSection}
            currentSection={currentSection}
          />
          {currentSection === "project" && (
            <Projects
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
                  username
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
                  username
                )
              }
              projects={posts}
              setProjectFilter={setPostFilter}
              username={username}
              location="profile"
              likedPosts={likedPosts}
              currentSection={currentSection}
              setHasMoreProject={setHasMore}
              hasMoreProject={hasMore}
              projectFilter={postFilter}
            />
          )}
          {currentSection === "qna" && (
            <AskAndAnswers
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
                  username
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
                  username
                )
              }
              askAndAnswers={posts}
              setQnaFilter={setPostFilter}
              username={username}
              location="profile"
              likedPosts={likedPosts}
              currentSection={currentSection}
              setHasMoreQna={setHasMore}
              hasMoreQna={hasMore}
              qnaFilter={postFilter}
            />
          )}
        </div>
      </div>
    </div>
  );
}
