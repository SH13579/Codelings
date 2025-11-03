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
import { Link, useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

//function to extend the session of the current user, prompting a new token
async function extendSession(token, setToken) {
  try {
    const res = await fetch("http://localhost:5000/extend_session", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.ok) {
      const data = await res.json();
      sessionStorage.setItem("token", data.token);
      console.log("Extended");
      setToken(data.token);
    }
  } catch (err) {
    console.error("Error:" + err.message);
    alert("Something went wrong, please try again later");
  }
}

//popup indiciating the expiration timer and prompting the user to log out or continue
const ExpPopup = ({
  token,
  setToken,
  extendSession,
  setCurrentUser,
  navigate,
  clickCreatePost,
}) => {
  const [expTimer, setExpTimer] = useState(
    token ? jwtDecode(token).exp - Math.floor(Date.now() / 1000) : null
  );

  const [showExpPopup, setShowExpPopup] = useState(
    expTimer && expTimer <= 30 ? true : false
  );
  //set expiration timer to count down every second once user is logged in
  useEffect(() => {
    if (token) {
      setExpTimer(jwtDecode(token).exp - Math.floor(Date.now() / 1000));
      const intervalId = setInterval(() => {
        setExpTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(intervalId);
    }
  }, [token]);

  //if expiration timer reaches 30 seconds left, allow the user to decide whether to continue session or logout
  useEffect(() => {
    if (expTimer === 30) {
      //if user is in the middle of creating a post, automatically extend their session
      if (clickCreatePost) {
        extendSession(token, setToken);
      } else {
        setShowExpPopup(true);
      }
    } else if (expTimer && expTimer <= 0) {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("currentUser");
      setToken(null);
      setCurrentUser(null);
      setShowExpPopup(null);
      navigate("/");
    }
  }, [expTimer]);
  return (
    showExpPopup && (
      <div>
        <div className="blur"></div>
        <div className="popup-wrapper">
          <div className="popup">
            <div className="popup-message">
              <h3>Session will expire in {expTimer} seconds</h3>
              <div>Continue or logout?</div>
            </div>
            <div className="popup-buttons-wrapper">
              <button
                onClick={() => {
                  extendSession(token, setToken);
                  setShowExpPopup(false);
                }}
                className="popup-button"
              >
                Continue
              </button>
              <button
                onClick={() => {
                  sessionStorage.removeItem("token");
                  sessionStorage.removeItem("currentUser");
                  setToken(null);
                  setCurrentUser(null);
                  setShowExpPopup(null);
                  navigate("/");
                }}
                className="popup-button"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );
};

export default function Header() {
  const {
    currentUser,
    setCurrentUser,
    showLogin,
    setShowLogin,
    token,
    setToken,
  } = useContext(UserContext);
  const [isScrolled, setIsScrolled] = useState(false);
  const [clickCreatePost, setClickCreatePost] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const cachedUser = sessionStorage.getItem("currentUser");
  const { error500Msg, setError500Msg, setError500Page, setError503 } =
    useContext(ErrorContext);
  const location = useLocation();
  console.log("Header");

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
          } else if (res.status === 500) {
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
      }
    };

    getCurrentUser();

    return () => controller.abort();
  }, [token]);

  useExitListener(setShowProfileDropdown, dropdownRef);

  //Only allow the user to create a post if they're logged in
  function checkLoggedIn() {
    token ? setClickCreatePost(true) : setShowLogin(true);
  }

  const refreshPage = (e, pageName) => {
    if (location.pathname === pageName) {
      e.preventDefault();
      window.location.reload();
    }
  };

  //dropdown component when the user clicks on their profile icon in the header
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
            onClick={() =>
              refreshPage(e, "/profile/:username/:currentSection?")
            }
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
              <img className="sign-out-svg" src="/images/sign-out.svg" />
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

  //sign out the user from their account
  function signOut(navigate) {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("currentUser");
    setCurrentUser(null);
    setToken(null);
    setShowProfileDropdown(false);
    navigate("/");
  }

  return (
    <section className={`header ${isScrolled ? "scrolled" : ""}`}>
      <ExpPopup
        token={token}
        setToken={setToken}
        extendSession={extendSession}
        setCurrentUser={setCurrentUser}
        navigate={navigate}
        clickCreatePost={clickCreatePost}
      />
      <nav className="header-info">
        <Link
          to="/"
          // onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          onClick={() => refreshPage(e, "/")}
          className="site-info"
        >
          <img className="site-logo" src="/images/site-logo.svg" />
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
      {showLogin && <Account setShowLogin={setShowLogin} setToken={setToken} />}
    </section>
  );
}
