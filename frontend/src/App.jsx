import { useState, useEffect } from "react";
import { Routes, Route, useParams } from "react-router-dom";
import Header from "./components/Header";
import Content from "./components/Content";
import Post from "./components/Post";
import Footer from "./components/Footer";
import Profile from "./components/Profile";
import Popup from "./components/Popup";
import Search from "./components/Search";
import EditProfile from "./components/EditProfile";
import NotFound404 from "./components/NotFound404";
import { UserContext, UIContext, ErrorContext } from "./utils";
import "./styles/App.css";

function App() {
  const token = sessionStorage.getItem("token");
  const cachedUser = sessionStorage.getItem("currentUser");
  const [currentUser, setCurrentUser] = useState(JSON.parse(cachedUser));
  const [showPopup, setShowPopup] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [error500Msg, setError500Msg] = useState(false);
  const [error500Page, setError500Page] = useState(false);
  const [error503, setError503] = useState(false);
  const tags = [
    { tag_name: "web-app", post_type: "project" },
    { tag_name: "mobile-app", post_type: "project" },
    { tag_name: "api", post_type: "project" },
    { tag_name: "portfolio", post_type: "project" },
    { tag_name: "automation", post_type: "project" },
    { tag_name: "cli-tool", post_type: "project" },
    { tag_name: "data-analysis", post_type: "project" },
    { tag_name: "machine-learning", post_type: "project" },
    { tag_name: "chat-app", post_type: "project" },
    { tag_name: "ecommerce", post_type: "project" },
    { tag_name: "web-scraper", post_type: "project" },
    { tag_name: "game-dev", post_type: "project" },
    { tag_name: "visualization", post_type: "project" },
    { tag_name: "cms", post_type: "project" },
    { tag_name: "forum", post_type: "project" },
    { tag_name: "desktop-app", post_type: "project" },
    { tag_name: "extension", post_type: "project" },
    { tag_name: "plugin", post_type: "project" },
    { tag_name: "library", post_type: "project" },
    { tag_name: "framework", post_type: "project" },
    { tag_name: "blog-engine", post_type: "project" },
    { tag_name: "dashboard", post_type: "project" },
    { tag_name: "auth-system", post_type: "project" },
    { tag_name: "dev-tool", post_type: "project" },
    { tag_name: "crud-app", post_type: "project" },
    { tag_name: "notetaking-app", post_type: "project" },
    { tag_name: "finance-app", post_type: "project" },
    { tag_name: "scheduler", post_type: "project" },
    { tag_name: "image-processor", post_type: "project" },
    { tag_name: "music-app", post_type: "project" },
    { tag_name: "general", post_type: "qna" },
    { tag_name: "discussion", post_type: "qna" },
    { tag_name: "debugging", post_type: "qna" },
    { tag_name: "career-advice", post_type: "qna" },
    { tag_name: "coding-help", post_type: "qna" },
    { tag_name: "code-review", post_type: "qna" },
    { tag_name: "best-practices", post_type: "qna" },
    { tag_name: "performance", post_type: "qna" },
    { tag_name: "how-to", post_type: "qna" },
    { tag_name: "security", post_type: "qna" },
  ];

  return (
    <div className="site">
      <ErrorContext.Provider
        value={{ error500Msg, setError500Msg, error500Page, setError500Page, error503, setError503 }}
      >
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
              tags,
            }}
          >
            <Header />
            <div className="all-content-wrap">
              <Routes>
                <Route path="/" element={<Content />} />
                <Route
                  path="/:currentSection?/:currentTag?"
                  element={<Content />}
                />
                <Route
                  path="/profile/:username/:currentSection?"
                  element={<Profile />}
                />
                <Route path="/edit-profile" element={<EditProfile />} />
                <Route path="/post/:postId" element={<Post />} />
                <Route
                  path="/search/:searchTerm/:currentSection?"
                  element={<Search />}
                />
                <Route path="/" element={<NotFound404 />} />
                <Route path="*" element={<NotFound404 />} />
              </Routes>
            </div>
            {showPopup && (
              <Popup message={showPopup.message} buttons={showPopup.buttons} />
            )}
          </UIContext.Provider>
        </UserContext.Provider>
      </ErrorContext.Provider>
      <Footer />
    </div>
  );
}

export default App;
