import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Content from "./components/Content";
import Post from "./components/Post";
import Footer from "./components/Footer";
import Profile from "./components/Profile";
import Popup from "./components/Popup";
import Search from "./components/Search";
import EditProfile from "./components/EditProfile";
import NotFound404 from "./components/NotFound404";
import { UserContext, UIContext } from "./utils";
import "./styles/App.css";

function App() {
  const token = sessionStorage.getItem("token");
  const [currentUser, setCurrentUser] = useState(null);
  const [showPopup, setShowPopup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewMoreLoading, setViewMoreLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  return (
    <div className="site">
      <UserContext.Provider
        value={{
          token,
          currentUser,
          setCurrentUser,
          showLogin,
          setShowLogin,
        }}
      >
        <UIContext.Provider
          value={{
            showPopup,
            setShowPopup,
            loading,
            setLoading,
            viewMoreLoading,
            setViewMoreLoading,
          }}
        >
          <Header />
          <div className="all-content-wrap">
            <Routes>
              <Route path="/" element={<Content />} />
              <Route path="/profile/:username" element={<Profile />} />
              <Route path="/edit-profile/:username" element={<EditProfile />} />
              <Route path="/post/:postId" element={<Post />} />
              <Route path="/search/:searchTerm" element={<Search />} />
              <Route path="*" element={<NotFound404 />} />
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
