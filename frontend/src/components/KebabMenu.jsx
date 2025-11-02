import React, { useState, useRef } from "react";
import "../styles/post.css";
import { useExitListener } from "../utils";

// kebab menu for a post
export default function KebabMenu({ onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useExitListener(setMenuOpen, menuRef);

  return (
    <div ref={menuRef} className="post-kebab-menu-wrapper">
      <div
        className="kebab-menu"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setMenuOpen((prev) => !prev);
        }}
      >
        &#8942;
      </div>
      {menuOpen && (
        <div className="kebab-menu-dropdown">
          <div
            className="kebab-menu-edit-button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit();
              setMenuOpen(false);
            }}
          >
            <img className="edit-icon" src="/images/edit.svg" />
            Edit
          </div>
          <div
            className="kebab-menu-delete-button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(e);
              setMenuOpen(false);
            }}
          >
            <img className="delete-icon" src="/images/delete-icon.svg" />
            Delete
          </div>
        </div>
      )}
    </div>
  );
}
