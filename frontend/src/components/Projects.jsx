import React, { useState, useRef, useEffect } from "react";
import { handleFilter, displaySectionPosts, EmptyContainer } from "../utils";
import { fetchPostsByCategory } from "./Content";
import { fetchProfilePostsByCategory, showDeletePopup } from "./Profile";
import ProjectCard from "./ProjectCard";

export default function Projects(props) {
  const [projects, setProjects] = useState([]);
  const [startProject, setStartProject] = useState(0);
  const [hasMoreProject, setHasMoreProject] = useState(true);
  const [projectFilter, setProjectFilter] = useState("Best");

  displaySectionPosts(
    props.currentSection,
    props.location === "home-page" //different routes for backend for both sections
      ? fetchPostsByCategory
      : fetchProfilePostsByCategory,
    setProjects,
    startProject,
    setStartProject,
    setHasMoreProject,
    projectFilter,
    props.username //only for profile section
  );

  const all_projects = projects.map((item) => {
    return (
      <ProjectCard
        location={props.location}
        showDeletePopup={showDeletePopup} //only for profile section
        key={item.id}
        user={props.username} //only for profile section
        liked={props.likedPosts.includes(item.id)}
        {...item}
      />
    );
  });

  return (
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
              <div onClick={() => setProjectFilter("Best")} className="filter">
                Best
              </div>
            )}
            {projectFilter !== "New" && (
              <div onClick={() => setProjectFilter("New")} className="filter">
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
              10,
              props.username
            )
          }
        >
          View More
        </button>
      )}
    </div>
  );
}
