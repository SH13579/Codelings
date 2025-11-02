import React from "react";

// display the character length for required body of text
export default function CharCount({ currentLength, maxLength }) {
  return (
    <div className="char-count">
      {currentLength} / {maxLength}
    </div>
  );
}
