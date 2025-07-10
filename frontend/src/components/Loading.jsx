import React from "react";
import "../styles/loader.css";

export const ViewMoreLoading = () => {
  return (
    <div className="view-more-loader-wrapper">
      <span class="view-more-loader"></span>
      <span>Loading...</span>
    </div>
  );
};

export default function Loading() {
  return (
    <div className="loader-wrapper">
      <span className="loader"></span>
    </div>
  );
}
