import React from "react";
import "../styles/loader.css";

//loading component that displays "Loading..." followed by a spinner
export const ViewMoreLoading = () => {
  return (
    <div className="view-more-loader-wrapper">
      <span className="view-more-loader"></span>
      <span>Loading...</span>
    </div>
  );
};

//loading component that just displays the spinner
export default function Loading() {
  return (
    <div className="loader-wrapper">
      <span className="loader"></span>
    </div>
  );
}
