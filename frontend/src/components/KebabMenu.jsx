import React, { useState, useEffect, useContext, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "../styles/post.css";
import { UserContext, UIContext, useExitListener } from "../utils";
import { handleNavigating } from "./Content";

export default function KebabMenu({ onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useExitListener(setMenuOpen, menuRef);

  return (
    <div ref={menuRef} className="post-kebab-menu-wrapper">
      <div className="kebab-menu" onClick={() => setMenuOpen((prev) => !prev)}>
        &#8942;
        {/* use svg instead */}
      </div>
      {menuOpen && (
        <div className="kebab-menu-dropdown">
          <div
            className="kebab-menu-edit-button"
            onClick={() => {
              onEdit();
              setMenuOpen(false);
            }}
          >
            <img className="edit-icon" src="../media/images/edit.svg" />
            Edit
          </div>
          <div
            className="kebab-menu-delete-button"
            onClick={() => {
              onDelete();
              setMenuOpen(false);
            }}
          >
            <img
              className="delete-icon"
              src="../media/images/delete-icon.svg"
            />
            Delete
          </div>
        </div>
      )}
    </div>
  );
}
