import React, { useContext, useEffect } from "react";
import { UIContext } from "../utils";
import Loading, { ViewMoreLoading } from "./Loading";
import { EmptyContainer } from "../utils";
import { showDeletePopup } from "./Profile";
import ProjectCard from "./ProjectCard";
import AskAnswerCard from "./AskAnswerCard";

export default function Posts(props) {
  const { loading, viewMoreLoading } = useContext(UIContext);

  useEffect(() => {
    props.displaySectionPosts();
  }, [props.filter, props.currentSection, props.searchTerm, props.token]);

  //map through all the projects, default state of posts is null so we only map when posts are finished being fetched from the backend
  const all_posts = props.posts
    ? props.posts.map((item) => {
        const PostCard = item.type === "project" ? ProjectCard : AskAnswerCard;
        return (
          <PostCard
            location={props.location}
            showDeletePopup={showDeletePopup} //only for profile section
            key={item.id}
            user={props.username} //only for profile section
            {...item}
          />
        );
      })
    : [];

  return loading ? (
    <Loading />
  ) : (
    <div className="projects">
      <div className="post-header">
        <h2 className="post-label">{props.postLabel}</h2>
        {props.filter && (
          <div className="filter-wrapper">
            <div className="current-filter">
              {props.filter}
              <img
                className="dropdown-arrow"
                src="../media/images/dropdown-arrow.svg"
              ></img>
            </div>
            <div className="filter-dropdown">
              {props.filter !== "Best" && (
                <div onClick={() => props.setFilter("Best")} className="filter">
                  Best
                </div>
              )}
              {props.filter !== "New" && (
                <div onClick={() => props.setFilter("New")} className="filter">
                  New
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {props.posts && !props.posts.length > 0 ? <EmptyContainer /> : all_posts}
      {props.hasMorePosts && (
        <button className="view-more-button" onClick={props.fetchMorePosts}>
          {viewMoreLoading ? <ViewMoreLoading /> : "View More"}
        </button>
      )}
    </div>
  );
}
