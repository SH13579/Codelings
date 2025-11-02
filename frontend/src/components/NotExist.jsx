import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/not-exist.css";

//component indicating a post/user does not exist
export default function NotExist({ msg }) {
  const navigate = useNavigate();
  return (
    <div className="not-exist-wrapper">
      <img className="exclamation-point" src="/images/exclamation-point.svg" />
      <h2 className="not-exist-msg">{msg}</h2>
      <button className="not-exist-button" onClick={() => navigate("/")}>
        Back to Home
      </button>
    </div>
  );
}
