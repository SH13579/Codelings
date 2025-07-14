import React, { useEffect } from "react";

export default function SectionsNavbar(props) {
  const all_sections = props.sections.map((item) => {
    //render any subsections such as tags associated with the main section
    const subsections =
      item.subsections &&
      item.subsections.map((item) => {
        return (
          <div
            onClick={() => props.setCurrentSection(item)}
            className={
              props.currentSection === item ? "highlight-sub" : "sub-section"
            }
          >
            {item}
          </div>
        );
      });
    //render the actual main section
    const renderSection = (
      <div className="navbar-section">
        <div
          onClick={() => props.setCurrentSection(item.sectionDbName)}
          className={
            props.currentSection === item.sectionDbName
              ? "highlight"
              : "navbar-label"
          }
        >
          <img className="projects-logo" src={item.imagePath} />
          <span>{item.sectionName}</span>
        </div>
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
