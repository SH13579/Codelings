import React, { useEffect, useState, useRef, useContext } from "react";
import Account from "./Account";
import CreatePost from "./CreatePost";
import "../styles/header.css";
import {
  useExitListener,
  UserContext,
  UIContext,
  ErrorContext,
} from "../utils";
import { Link, useNavigate } from "react-router-dom";

export default function Header() {
  const { currentUser, setCurrentUser, showLogin, setShowLogin, token } =
    useContext(UserContext);
  const [isScrolled, setIsScrolled] = useState(false);
  const [clickCreatePost, setClickCreatePost] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const cachedUser = sessionStorage.getItem("currentUser");
  const { error500Msg, setError500Msg, error500Page, setError500Page, error503, setError503 } = useContext(ErrorContext);
  
  // useEffect(() => {
  //   setError500Msg(true);
  // }, []);

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

  //Fetch profile picture and username of current user
  useEffect(() => {
    if (!token) {
      return;
    }
    const controller = new AbortController();
    const signal = controller.signal;

    const getCurrentUser = async () => {
      try {
        const res = await fetch("http://localhost:5000/fetch_user_profile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: signal,
        });

        const data = await res.json();

        if (res.ok) {
          //if user is already cached, just set the state to the cached value
          if (cachedUser) {
            return;
          } else {
            setCurrentUser(data);
            sessionStorage.setItem("currentUser", JSON.stringify(data));
          }
        } else {
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("currentUser");
          setCurrentUser(null);
          if (res.status === 503) {
            setError503(true);
          }
          else if (res.status === 500) {
            setError500Page(true);
          }
          console.error(data.error);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("currentUser");
          setCurrentUser(null);
          
        }
        console.error("Error: " + err.message);
        //reminder: this causes issues (probably just ignore and remove)
        // setError503(true);
      }
    };

    getCurrentUser();

    return () => controller.abort();
  }, [token, cachedUser]);

  useExitListener(setShowProfileDropdown, dropdownRef);

  //Only allow the user to create a post if they're logged in
  function checkLoggedIn() {
    token ? setClickCreatePost(true) : setShowLogin(true);
  }

  const ProfileDropdown = () => {
    return (
      currentUser && (
        <div
          onClick={() => setShowProfileDropdown(false)}
          className="profile-dropdown"
        >
          <Link
            to={`/profile/${currentUser.username}`}
            className="dropdown-profile"
          >
            <div className="dropdown-icons">
              <img className="header-pfp" src={currentUser.pfp} />
            </div>
            <div>
              <div className="view-profile">View Profile</div>
              <div className="dropdown-user">{currentUser.username}</div>
            </div>
          </Link>
          <a onClick={() => signOut(navigate)} className="dropdown-signout">
            <div className="dropdown-icons">
              <img className="sign-out-svg" src="/media/images/sign-out.svg" />
            </div>
            <div className="dropdown-logout">Sign Out</div>
          </a>
        </div>
      )
    );
  };

  function showOrHideDropdown() {
    showProfileDropdown
      ? setShowProfileDropdown(false)
      : setShowProfileDropdown(true);
  }

  function signOut(navigate) {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("currentUser");
    setCurrentUser(null);
    setShowProfileDropdown(false);
    navigate("/");
  }

  return (
    <section className={`header ${isScrolled ? "scrolled" : ""}`}>
      <nav className="header-info">
        <Link
          to="/"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="site-info"
        >
          <img className="site-logo" src="/media/images/site-logo.svg" />
          <h2 className="site-name">Codelings</h2>
        </Link>
        {error500Msg && (
          <div className="error-500-msg">
            Something went wrong. Please try again.
            <div className="exit-button" onClick={() => setError500Msg(false)}>
              &times;
            </div>
          </div>
        )}
        <div className="header-buttons-wrapper">
          <a className="header-create-post-button" onClick={checkLoggedIn}>
            Create Post
          </a>
          <div ref={dropdownRef} className="login-or-profile">
            {token ? (
              <img
                onClick={showOrHideDropdown}
                className="header-pfp"
                src={currentUser && currentUser.pfp}
              />
            ) : (
              <button
                className="header-login-button"
                onClick={() => setShowLogin(true)}
              >
                Sign In
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
