import React, { useState, useEffect, useRef, useContext } from "react";
import "../styles/profile.css";
import { useExitListener } from "../utils";
import { UserContext, fetchPosts } from "../utils";
import { useParams } from "react-router-dom";
import { handleNavigating, EmptyContainer, handleFilter } from "./Content";
import ProjectCard from "./ProjectCard";
import AskAnswerCard from "./AskAnswerCard";

export default function Profile({ activeProfile, setActiveProfile }) {
  const token = sessionStorage.getItem("token");
  const [clickChat, setClickChat] = useState(false);
  const { currentUser, setCurrentUser, setShowPopup } = useContext(UserContext);

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

  const { username } = useParams();

  function fetchPostsByCategory(
    postType,
    setPostType,
    start,
    setStart,
    setHasMore,
    filter
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
      )}&category=${category}&start=${start}&limit=5`
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
      projectFilter
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
      qnaFilter
    );
  }, [qnaFilter]);

  const all_projects = projects.map((item) => {
    return (
      <ProjectCard
        location="profile"
        showDeletePopup={showDeletePopup}
        key={item.id}
        {...item}
      />
    );
  });

  const all_askAndAnswers = askAndAnswers.map((item) => {
    return (
      <AskAnswerCard
        location="profile"
        showDeletePopup={showDeletePopup}
        key={item.id}
        {...item}
      />
    );
  });

  function showDeletePopup(e, post_id, setDeleted) {
    e.preventDefault();
    e.stopPropagation();
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
      message: "Are you sure you want to delete this post?",
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
                      projectFilter
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
              {askAndAnswers.length > 0 ? (
                all_askAndAnswers
              ) : (
                <EmptyContainer />
              )}
              {hasMoreQna && (
                <button
                  onClick={() =>
                    fetchPostsByCategory(
                      "qna",
                      setAskAndAnswers,
                      startQna,
                      setStartQna,
                      setHasMoreQna,
                      qnaFilter
                    )
                  }
                >
                  View More
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
