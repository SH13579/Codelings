import React, { useState, useContext } from "react";
import "../styles/profile.css";
import {
  UserContext,
  fetchPosts,
  EmptyContainer,
  handleFilter,
  displayLiked,
  displaySectionPosts,
} from "../utils";
import { useParams } from "react-router-dom";
import Projects from "./Projects";
import AskAndAnswers from "./AskAndAnswers";

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

export function fetchProfilePostsByCategory(
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
  fetchPosts(
    setPostType,
    setStart,
    setHasMore,
    `http://localhost:5000/get_posts_byUserAndCategory?username=${encodeURIComponent(
      username
    )}&post_type=${encodeURIComponent(
      postType
    )}&category=${category}&start=${start}&limit=${limit}`,
    limit,
    reset
  );
}

export default function Profile() {
  const token = sessionStorage.getItem("token");
  const [clickChat, setClickChat] = useState(false);
  const { currentUser, setCurrentUser } = useContext(UserContext);
  const [likedPosts, setLikedPosts] = useState([]);
  const [currentSection, setCurrentSection] = useState("project");

  const { username } = useParams();

  console.log("Rendering Profile");

  displayLiked(setLikedPosts, "posts");

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
        <div className="profile-posts">
          <div className="content-grid">
            <div className="content-navbar">
              <div
                onClick={() => setCurrentSection("project")}
                className={
                  currentSection === "project" ? "highlight" : "navbar-label"
                }
              >
                <img
                  className="projects-logo"
                  src="../media/images/projects-logo.svg"
                />
                <span>Projects</span>
              </div>
              <div
                onClick={() => setCurrentSection("qna")}
                className={
                  currentSection === "qna" ? "highlight" : "navbar-label"
                }
              >
                <img
                  className="ask-answer-logo"
                  src="../media/images/askAnswer.svg"
                />
                <span>Ask & Answer</span>
              </div>
            </div>
            {currentSection === "project" && (
              <Projects
                username={username}
                location="profile"
                likedPosts={likedPosts}
                currentSection={currentSection}
              />
            )}
            {currentSection === "qna" && (
              <AskAndAnswers
                username={username}
                location="profile"
                likedPosts={likedPosts}
                currentSection={currentSection}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
