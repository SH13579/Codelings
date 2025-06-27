import React, { useState, useRef, useEffect, useContext } from "react";
import { displaySectionPosts, EmptyContainer } from "../utils";
import { fetchPostsByCategory } from "./Content";
import { fetchProfilePostsByCategory, showDeletePopup } from "./Profile";
import AskAnswerCard from "./AskAnswerCard";

export default function AskAndAnswers(props) {
  const [askAndAnswers, setAskAndAnswers] = useState([]);
  const [startQna, setStartQna] = useState(0);
  const [hasMoreQna, setHasMoreQna] = useState(true);
  const [qnaFilter, setQnaFilter] = useState("Best");

  displaySectionPosts(
    props.currentSection,
    props.location === "home-page" //different routes for backend for both sections
      ? fetchPostsByCategory
      : fetchProfilePostsByCategory,
    setAskAndAnswers,
    startQna,
    setStartQna,
    setHasMoreQna,
    qnaFilter,
    props.username //only for profile section
  );

  const all_askAndAnswers = askAndAnswers.map((item) => {
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
  return (
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
              <div onClick={() => setQnaFilter("Best")} className="filter">
                Best
              </div>
            )}
            {qnaFilter !== "New" && (
              <div onClick={() => setQnaFilter("New")} className="filter">
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
