import React, { useEffect } from "react";
import { EmptyContainer } from "../utils";
import { showDeletePopup } from "./Profile";
import ProjectCard from "./ProjectCard";

export default function Projects(props) {
  //display the initial batch of 10 posts every time the user changes the filter or section
  useEffect(() => {
    props.setHasMoreProject(true);
    props.displaySectionPosts();
  }, [props.projectFilter, props.currentSection, props.searchTerm]);

  //map through all the projects
  const all_projects = props.projects.map((item) => {
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
        {props.projectFilter && (
          <div className="filter-wrapper">
            <div className="current-filter">
              {props.projectFilter}
              <img
                className="dropdown-arrow"
                src="../media/images/dropdown-arrow.svg"
              ></img>
            </div>
            <div className="filter-dropdown">
              {props.projectFilter !== "Best" && (
                <div
                  onClick={() => props.setProjectFilter("Best")}
                  className="filter"
                >
                  Best
                </div>
              )}
              {props.projectFilter !== "New" && (
                <div
                  onClick={() => props.setProjectFilter("New")}
                  className="filter"
                >
                  New
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {props.projects.length > 0 ? all_projects : <EmptyContainer />}
      {props.hasMoreProject && (
        <button onClick={props.fetchMorePosts}>View More</button>
      )}
    </div>
  );
}
