import React, { useRef, useState, useEffect, useContext } from "react";
import { Link, useFetcher, useNavigate } from "react-router-dom";
import "../styles/content.css";
import ProjectCard from "./ProjectCard";
import AskAnswerCard from "./AskAnswerCard";
import {
  UserContext,
  fetchPosts,
  EmptyContainer,
  handleFilter,
} from "../utils";

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
        <form className="search-wrapper" action="/search" method="GET">
          <input
            className="search-bar"
            type="search"
            placeholder="Looking for something?"
          />
        </form>
      </div>
    </section>
  );
};

export const handleNavigating = (e, navigate, username) => {
  e.stopPropagation();
  e.preventDefault();
  navigate(`/profile/${username}`);
};

export default function Content() {
  const [projects, setProjects] = useState([]);
  const [askAndAnswers, setAskAndAnswers] = useState([]);

  const [startProject, setStartProject] = useState(0);
  const [startQna, setStartQna] = useState(0);

  const [hasMoreProject, setHasMoreProject] = useState(true);
  const [hasMoreQna, setHasMoreQna] = useState(true);

  const [projectFilter, setProjectFilter] = useState("Best");
  const [qnaFilter, setQnaFilter] = useState("Best");

  const projectRef = useRef(null);
  const askAndAnswerRef = useRef(null);

  //fetches projects and ask & answers based on whether the user filters by best or newest, default is best
  function fetchPostsByCategory(
    postType,
    setPostType,
    start,
    setStart,
    setHasMore,
    filter,
    limit
  ) {
    const category = filter === "Best" ? "likes" : "post_date";
    fetchPosts(
      setPostType,
      setStart,
      setHasMore,
      `http://localhost:5000/get_postsByCategory?post_type=${encodeURIComponent(
        postType
      )}&category=${category}&start=${start}&limit=${limit}`,
      limit
    );
  }

  useEffect(() => {
    if (!projectRef.current) {
      projectRef.current = true;
      return;
    }
    fetchPostsByCategory(
      "project",
      setProjects,
      startProject,
      setStartProject,
      setHasMoreProject,
      projectFilter,
      10
    );
  }, [projectFilter]);

  useEffect(() => {
    if (!askAndAnswerRef.current) {
      askAndAnswerRef.current = true;
      return;
    }
    fetchPostsByCategory(
      "qna",
      setAskAndAnswers,
      startQna,
      setStartQna,
      setHasMoreQna,
      qnaFilter,
      12
    );
  }, [qnaFilter]);

  // useEffect(() => {
  //   let timeout;
  //   const handleInfiniteScroll = () => {
  //     clearTimeout(timeout);
  //     timeout = setTimeout(() => {
  //       const bottomOfPage =
  //         document.documentElement.scrollHeight - window.innerHeight;
  //       if (window.scrollY + 300 >= bottomOfPage) {
  //         console.log(startProject);
  //         if (hasMoreQna) {
  //           fetchPostsByCategory(
  //             "qna",
  //             setAskAndAnswers,
  //             startQna,
  //             setStartQna,
  //             setHasMoreQna,
  //             qnaFilter,
  //             12
  //           );
  //         }
  //         if (hasMoreProject) {
  //           fetchPostsByCategory(
  //             "project",
  //             setProjects,
  //             startProject,
  //             setStartProject,
  //             setHasMoreProject,
  //             projectFilter,
  //             10
  //           );
  //         }
  //       }
  //     }, 250);
  //   };

  //   window.addEventListener("scroll", handleInfiniteScroll);

  //   return () => {
  //     window.removeEventListener("scroll", handleInfiniteScroll);
  //   };
  // }, [startQna, startProject, hasMoreQna, hasMoreProject]);

  const all_projects = projects.map((item) => {
    return <ProjectCard location="home-page" key={item.id} {...item} />;
  });

  const all_askAndAnswers = askAndAnswers.map((item) => {
    return <AskAnswerCard location="home-page" key={item.id} {...item} />;
  });

  return (
    <section className="content-wrapper">
      <AboutUs />
      <div className="content-grid">
        <div className="projects">
          <div className="post-header">
            <h2 className="post-label">Projects</h2>
            <div className="filter-wrapper">
              <div className="current-filter">
                {projectFilter}
                <img
                  className="dropdown-arrow"
                  src="../media/images/dropdown-arrow.svg"
                ></img>
              </div>
              <div className="filter-dropdown">
                {projectFilter !== "Best" && (
                  <div
                    onClick={() =>
                      handleFilter(
                        setProjects,
                        setProjectFilter,
                        setStartProject,
                        setHasMoreProject,
                        "Best"
                      )
                    }
                    className="filter"
                  >
                    Best
                  </div>
                )}
                {projectFilter !== "New" && (
                  <div
                    onClick={() =>
                      handleFilter(
                        setProjects,
                        setProjectFilter,
                        setStartProject,
                        setHasMoreProject,
                        "New"
                      )
                    }
                    className="filter"
                  >
                    New
                  </div>
                )}
              </div>
            </div>
          </div>
          {projects.length > 0 ? all_projects : <EmptyContainer />}
          {hasMoreProject && (
            <button
              onClick={() =>
                fetchPostsByCategory(
                  "project",
                  setProjects,
                  startProject,
                  setStartProject,
                  setHasMoreProject,
                  projectFilter,
                  10
                )
              }
            >
              View More
            </button>
          )}
        </div>
        <div className="ask-and-answers">
          <div className="post-header">
            <h2 className="post-label">Ask & Answer</h2>
            <div className="filter-wrapper">
              <div className="current-filter">
                {qnaFilter}
                <img
                  className="dropdown-arrow"
                  src="../media/images/dropdown-arrow.svg"
                ></img>
              </div>
              <div className="filter-dropdown">
                {qnaFilter !== "Best" && (
                  <div
                    onClick={() =>
                      handleFilter(
                        setAskAndAnswers,
                        setQnaFilter,
                        setStartQna,
                        setHasMoreQna,
                        "Best"
                      )
                    }
                    className="filter"
                  >
                    Best
                  </div>
                )}
                {qnaFilter !== "New" && (
                  <div
                    onClick={() =>
                      handleFilter(
                        setAskAndAnswers,
                        setQnaFilter,
                        setStartQna,
                        setHasMoreQna,
                        "New"
                      )
                    }
                    className="filter"
                  >
                    New
                  </div>
                )}
              </div>
            </div>
          </div>
          {askAndAnswers.length > 0 ? all_askAndAnswers : <EmptyContainer />}
          {hasMoreQna && (
            <button
              onClick={() =>
                fetchPostsByCategory(
                  "qna",
                  setAskAndAnswers,
                  startQna,
                  setStartQna,
                  setHasMoreQna,
                  qnaFilter,
                  12
                )
              }
            >
              View More
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
