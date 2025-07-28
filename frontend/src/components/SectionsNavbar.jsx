import React, { useEffect } from "react";
import { Link } from "react-router-dom";

export default function SectionsNavbar(props) {
  const all_sections = props.sections.map((item) => {
    const section = item.sectionDbName;
    //render any subsections such as tags associated with the main section
    const subsections =
      item.subsections &&
      item.subsections.map((item) => {
        return (
          <Link key={item} to={`${props.currentRoute}${section}/${item}`}>
            <div
              // onClick={() => props.handleTagChange(section, item)}
              className={
                props.currentTag === item ? "highlight-sub" : "sub-section"
              }
            >
              {item}
            </div>
          </Link>
        );
      });
    //render the actual main section
    const renderSection = (
      <div key={section} className="navbar-section">
        <Link to={`${props.currentRoute}${section}`}>
          <div
            // onClick={() => props.handleSectionChange(section)}
            className={
              props.currentSection === item.sectionDbName && !props.currentTag
                ? "highlight"
                : "navbar-label"
            }
          >
            <img className="projects-logo" src={item.imagePath} />
            <span>{item.sectionName}</span>
          </div>
        </Link>
        {item.subsections && item.subsections.length > 0 && (
          <div className="subsections-wrapper">{subsections}</div>
        )}
      </div>
    );
    //if no condition is specified, just render the section, else render the section only if the condition is satisfied
    return item.condition === undefined
      ? renderSection
      : item.condition && renderSection;
  });
  //different styling for the navbar in the home-page compared to everywhere else
  return (
    <div
      className={
        props.location === "home-page" ? "content-navbar" : "sections-navbar"
      }
    >
      {all_sections}
    </div>
  );
}
