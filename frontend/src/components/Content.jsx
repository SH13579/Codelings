import React, { useState } from "react";
import { Link, useFetcher, useNavigate } from "react-router-dom";
import "../styles/content.css";
import Projects from "./Projects";
import AskAndAnswers from "./AskAndAnswers";
import { fetchPosts, displayLiked } from "../utils";

export const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        navigate(`/search/${searchTerm}`);
      }}
      className="search-wrapper"
    >
      <input
        className="search-bar"
        onChange={(e) => setSearchTerm(e.target.value)}
        type="search"
        placeholder="Looking for something?"
      />
    </form>
  );
};

//short introduction to our website and search bar
const AboutUs = () => {
  return (
    <section className="about-us">
      <div className="about-us-wrapper">
        <h1 className="about-us-title">Share your Coding Projects</h1>
        <h2 className="about-us-description">
          A place for tech students to showcase their work and connect with
          others
        </h2>
        <SearchBar />
      </div>
    </section>
  );
};

export const handleNavigating = (e, navigate, username) => {
  e.stopPropagation();
  e.preventDefault();
  navigate(`/profile/${username}`);
};

//fetches projects and ask & answers based on whether the user filters by best or newest, default is best
export function fetchPostsByCategory(
  postType,
  setPostType,
  start,
  setStart,
  setHasMore,
  filter,
  limit,
  reset = false
) {
  const category = filter === "Best" ? "likes" : "post_date";
  fetchPosts(
    setPostType,
    setStart,
    setHasMore,
    `http://localhost:5000/get_postsByCategory?post_type=${encodeURIComponent(
      postType
    )}&category=${category}&start=${start}&limit=${limit}`,
    limit,
    reset
  );
}

export default function Content() {
  const [likedPosts, setLikedPosts] = useState([]);
  const [currentSection, setCurrentSection] = useState("project");

  console.log("Rendering Content");

  displayLiked(setLikedPosts, "posts");

  return (
    <section className="content-wrapper">
      <AboutUs />
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
            className={currentSection === "qna" ? "highlight" : "navbar-label"}
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
            fetchPostsByCategory={fetchPostsByCategory}
            location="home-page"
            likedPosts={likedPosts}
            currentSection={currentSection}
          />
        )}
        {currentSection === "qna" && (
          <AskAndAnswers
            fetchPostsByCategory={fetchPostsByCategory}
            location="home-page"
            likedPosts={likedPosts}
            currentSection={currentSection}
          />
        )}
      </div>
    </section>
  );
}
