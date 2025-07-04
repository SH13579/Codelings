import React from "react";

export default function SectionsNavbar(props) {
  const all_sections = props.sections.map((item) => {
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
    return (
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
        {item.subsections &&
          (props.currentSection === item.sectionDbName ||
            item.subsections.includes(props.currentSection)) && (
            <div className="subsections-wrapper">{subsections}</div>
          )}
      </div>
    );
  });
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
