import React from "react";
import "../styles/notfound.css";

export default function InternalServerError500() {
  return (
    <section className="notfound-wrapper">
      <h1 className="notfound-header">
        5<img className="notfound-svg" src="/images/notfound.svg" />3
      </h1>
      <h1>Service Unavailable</h1>
      <h3>The service is temporarily unavailable. Please try again later.</h3>
    </section>
  );
}
