import React from "react";
import "../styles/footer.css";

export default function Footer() {
  return (
    <section className="footer-wrapper">
      <div className="footer">
        <div className="footer-site-name">&copy;2025 Codelings</div>
        <a
          className="github-link"
          href="https://github.com/jpljason/Skill-Exchange/tree/main"
          target="_blank"
        >
          <img className="github-logo" src="../media/images/github-logo.svg" />
        </a>
      </div>
    </section>
  );
}
