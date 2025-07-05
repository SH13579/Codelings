import React, { useContext, useEffect } from "react";
import { UIContext } from "../utils";
import Loading from "./Loading";
import { EmptyContainer } from "../utils";
import { showDeletePopup } from "./Profile";
import ProjectCard from "./ProjectCard";
import AskAnswerCard from "./AskAnswerCard";

export default function Posts(props) {
  const { loading } = useContext(UIContext);

  useEffect(() => {
    props.setHasMorePosts(true);
    props.displaySectionPosts();
  }, [props.filter, props.currentSection, props.searchTerm]);

  //map through all the projects
  const all_posts = props.posts.map((item) => {
    const PostCard = item.type === "project" ? ProjectCard : AskAnswerCard;
    return (
      <PostCard
        location={props.location}
        showDeletePopup={showDeletePopup} //only for profile section
        key={item.id}
        user={props.username} //only for profile section
        liked={props.likedPosts.includes(item.id)}
        {...item}
      />
    );
  });

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
      {!loading && props.posts.length > 0 ? all_posts : <EmptyContainer />}
      {props.hasMorePosts && (
        <button onClick={props.fetchMorePosts}>View More</button>
      )}
    </div>
  );
}
