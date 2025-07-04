import React, { useState, useRef, useEffect, useContext } from "react";
import { displaySectionPosts, EmptyContainer, UIContext } from "../utils";
import { showDeletePopup } from "./Profile";
import AskAnswerCard from "./AskAnswerCard";
import Loading from "./Loading";

export default function AskAndAnswers(props) {
  const { loading, setLoading } = useContext(UIContext);
  //display the initial batch of 10 posts every time the user changes the filter or section
  useEffect(() => {
    props.setHasMoreQna(true);
    props.displaySectionPosts();
  }, [props.qnaFilter, props.currentSection, props.searchTerm]);

  //map through all the qnas
  const all_askAndAnswers = props.askAndAnswers.map((item) => {
    return (
      <AskAnswerCard
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
    <div className="ask-and-answers">
      <div className="post-header">
        <h2 className="post-label">Ask & Answer</h2>
        {props.qnaFilter && (
          <div className="filter-wrapper">
            <div className="current-filter">
              {props.qnaFilter}
              <img
                className="dropdown-arrow"
                src="../media/images/dropdown-arrow.svg"
              ></img>
            </div>
            <div className="filter-dropdown">
              {props.qnaFilter !== "Best" && (
                <div
                  onClick={() => props.setQnaFilter("Best")}
                  className="filter"
                >
                  Best
                </div>
              )}
              {props.qnaFilter !== "New" && (
                <div
                  onClick={() => props.setQnaFilter("New")}
                  className="filter"
                >
                  New
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {props.askAndAnswers.length > 0 ? all_askAndAnswers : <EmptyContainer />}
      {props.hasMoreQna && (
        <button onClick={props.fetchMorePosts}>View More</button>
      )}
    </div>
  );
}
