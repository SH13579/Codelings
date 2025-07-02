import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Content from "./components/Content";
import Post from "./components/Post";
import Footer from "./components/Footer";
import Profile from "./components/Profile";
import Popup from "./components/Popup";
import Search from "./components/Search";
import { UserContext, UIContext } from "./utils";
import "./styles/App.css";

function App() {
  const token = sessionStorage.getItem("token");
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(token ? true : false);
  const [showPopup, setShowPopup] = useState(null);
  const [loading, setLoading] = useState(false);

  console.log("Rendering App");

  useEffect(() => {
    if (!isLoggedIn) {
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
          setIsLoggedIn(true);
          setCurrentUser({
            username: data.username,
            email: data.email,
            pfp: data.pfp,
          });
        } else {
          sessionStorage.removeItem("token");
          setCurrentUser(null);
          setIsLoggedIn(false);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          alert("Error: " + err.message);
          sessionStorage.removeItem("token");
          setCurrentUser(null);
          setIsLoggedIn(false);
        }
      }
    };

    getCurrentUser();

    return () => controller.abort();
  }, [isLoggedIn]);

  useEffect(() => {
    console.log(currentUser);
  }, [currentUser]);

  return (
    <div className="site">
      <UserContext.Provider
        value={{
          token,
          currentUser,
          setCurrentUser,
          isLoggedIn,
          setIsLoggedIn,
        }}
      >
        <UIContext.Provider
          value={{
            showPopup,
            setShowPopup,
            loading,
            setLoading,
          }}
        >
          <Header />
          <div className="all-content-wrap">
            <Routes>
              <Route path="/" element={<Content />} />
              <Route path="/profile/:username" element={<Profile />} />
              <Route path="/post/:postId" element={<Post />} />
              <Route path="/search/:searchTerm" element={<Search />} />
            </Routes>
          </div>
          {showPopup && (
            <Popup message={showPopup.message} buttons={showPopup.buttons} />
          )}
        </UIContext.Provider>
      </UserContext.Provider>
      <Footer />
    </div>
  );
}

export default App;
