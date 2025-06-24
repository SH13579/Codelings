import React, { useEffect, useState, useRef, useContext } from "react";
import Account from "./Account";
import CreatePost from "./CreatePost";
import "../styles/header.css";
import { UserContext } from "../utils";
import { useExitListener } from "../utils";
import { Link } from "react-router-dom";

export default function Header() {
  const { currentUser, isLoggedIn, setCurrentUser, setIsLoggedIn } =
    useContext(UserContext);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [clickCreatePost, setClickCreatePost] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef(null);

  console.log("Rendering Header");
  //remove ability to scroll any content outside of the account component
  useEffect(() => {
    document.body.style.overflow =
      showLogin || clickCreatePost ? "hidden" : "auto";
  }, [showLogin, clickCreatePost]);

  // turn the header's border to visible when the page is being scrolled
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useExitListener(setShowProfileDropdown, dropdownRef);

  function checkLoggedIn() {
    isLoggedIn ? setClickCreatePost(true) : setShowLogin(true);
  }

  const ProfileDropdown = () => {
    return (
      <div
        onClick={() => setShowProfileDropdown(false)}
        className="profile-dropdown"
      >
        <Link
          to={`/profile/${currentUser.username}`}
          className="dropdown-profile"
        >
          <div className="dropdown-icons">
            <img
              className="header-pfp"
              src={currentUser ? currentUser.pfp : "../media/images/doggy.png"}
            />
          </div>
          <div>
            <div className="view-profile">View Profile</div>
            <div className="dropdown-user">
              {currentUser && currentUser.username}
            </div>
          </div>
        </Link>
        <a onClick={signOut} className="dropdown-signout">
          <div className="dropdown-icons">
            <img className="sign-out-svg" src="../media/images/sign-out.svg" />
          </div>
          <div className="dropdown-logout">Sign Out</div>
        </a>
      </div>
    );
  };

  function signOut() {
    sessionStorage.removeItem("token");
    setCurrentUser(null);
    setIsLoggedIn(null);
    setShowProfileDropdown(false);
  }

  function showOrHideDropdown() {
    showProfileDropdown
      ? setShowProfileDropdown(false)
      : setShowProfileDropdown(true);
  }

  return (
    <section className={`header ${isScrolled ? "scrolled" : ""}`}>
      <nav className="header-info">
        <Link
          to="/"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="site-info"
        >
          <img className="site-logo" src="../media/images/site-logo.svg" />
          <h2 className="site-name">Codelings</h2>
        </Link>
        <div className="header-buttons-wrapper">
          <a className="header-create-post-button" onClick={checkLoggedIn}>
            Create Post
          </a>
          <div ref={dropdownRef} className="login-or-profile">
            {isLoggedIn ? (
              <img
                onClick={showOrHideDropdown}
                className="header-pfp"
                src={
                  currentUser ? currentUser.pfp : "../media/images/doggy.png"
                }
              />
            ) : (
              <button
                className="header-login-button"
                onClick={() => setShowLogin(true)}
              >
                Log in
              </button>
            )}
            {showProfileDropdown && <ProfileDropdown />}
          </div>
        </div>
      </nav>
      {clickCreatePost && (
        <CreatePost setClickCreatePost={setClickCreatePost} />
      )}
      {showLogin && <Account setShowLogin={setShowLogin} />}
    </section>
  );
}
