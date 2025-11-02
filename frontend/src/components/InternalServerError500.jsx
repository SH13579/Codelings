import React from "react";
import "../styles/notfound.css";

export default function InternalServerError500() {
  return (
    <section className="notfound-wrapper">
      <h1 className="notfound-header">
        5<img className="notfound-svg" src="/images/notfound.svg" />0
      </h1>
      <h1>Internal Server Error</h1>
      {/* error 500: unexpected error from a request */}
      <h3>Something went wrong on our side. Please try again later.</h3>
    </section>
  );
}
