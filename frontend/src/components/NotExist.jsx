import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/not-exist.css";

export default function NotExist({ msg }) {
  const navigate = useNavigate();
  return (
    <div className="not-exist-wrapper">
      <img
        className="exclamation-point"
        src="/media/images/exclamation-point.svg"
      />
      <h2 className="not-exist-msg">{msg}</h2>
      <button className="not-exist-button" onClick={() => navigate("/")}>
        Back to Home
      </button>
    </div>
  );
}
