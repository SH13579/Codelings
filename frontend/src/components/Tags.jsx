import React from "react";

export default function Tags({ tags }) {
  if (!tags || tags[0] === null) {
    return null;
  }
  const all_tags = tags.map((item) => {
    return (
      <div key={item} className="post-tag">
        #{item}
      </div>
    );
  });
  return <div className="post-tags">{all_tags}</div>;
}
