import React from "react";
import "../styles/notfound.css";
import { useNavigate } from "react-router-dom";

export default function InternalServerError500() {
  const navigate = useNavigate();
  return (
    <section className="notfound-wrapper">
      <h1 className="notfound-header">
        5<img className="notfound-svg" src="/media/images/notfound.svg" />0
      </h1>
      <h1>Internal Server Error</h1>
      <h3>
        Server encountered an unexpected error. Please try refreshing the page
        or come back later
      </h3>
      {/* <button onClick={() => navigate("/")} className="notfound-button">
        Back to Home
      </button> */}
    </section>
  );
}
