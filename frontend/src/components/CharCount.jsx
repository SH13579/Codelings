import React, { useState, useEffect, useRef, useContext } from "react";

export default function CharCount({ currentLength, maxLength }) {
  return (
    <div className="char-count">
      {currentLength} / {maxLength}
    </div>
  );
}
