import React from "react";
import "../styles/notfound.css";
import { useNavigate } from "react-router-dom";

export default function NotFound404() {
  const navigate = useNavigate();
  return (
    <section className="notfound-wrapper">
      <h1 className="notfound-header">
        4<img className="notfound-svg" src="/public/images/notfound.svg" />4
      </h1>
      <h2>Page Not Found</h2>
      <button onClick={() => navigate("/")} className="notfound-button">
        Back to Home
      </button>
    </section>
  );
}
