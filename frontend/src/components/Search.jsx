import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SearchBar } from "./Content";
import { handleNavigating } from "./Content";
import ContentNavbar from "./ContentNavbar";
import Projects from "./Projects";
import AskAndAnswers from "./AskAndAnswers";
import "../styles/search.css";
import { displayLiked } from "../utils";

const SearchProfileCard = (props) => {
  const navigate = useNavigate();
  return (
    <div className="search-profile">
      <div
        onClick={(e) => handleNavigating(e, navigate, props.name)}
        className="user-info"
      >
        <img className="pfp" src={props.pfp} />
        <span className="user-name">{props.name}</span>
      </div>
    </div>
  );
};

const SearchProfiles = (props) => {
  useEffect(() => {
    props.setHasMore(true);
    props.displayProfiles();
  }, [props.currentSection, props.searchTerm]);
  const profilesReturned = props.profiles.map((item) => {
    return <SearchProfileCard key={item.id} {...item} />;
  });
  return (
    <div className="searched-profiles-wrapper">
      <h2 className="post-label">Profiles</h2>
      <div className="searched-profiles">{profilesReturned}</div>
      {props.hasMore && <button onClick={props.fetchMore}>View More</button>}
    </div>
  );
};

export default function Search() {
  const { searchTerm } = useParams();
  const [currentSection, setCurrentSection] = useState("project");
  const [likedPosts, setLikedPosts] = useState([]);
  const [start, setStart] = useState(0);
  const [posts, setPosts] = useState([]);
  const limit = 10;
  const [hasMore, setHasMore] = useState(true);

  displayLiked(setLikedPosts, "posts");

  const navbar_sections = [
    {
      sectionDbName: "project",
      imagePath: "../media/images/projects-logo.svg",
      sectionName: "Projects",
    },
    {
      sectionDbName: "qna",
      imagePath: "../media/images/askAnswer.svg",
      sectionName: "Ask & Answer",
    },
    {
      sectionDbName: "profile",
      imagePath: "../media/images/profile-icon.svg",
      sectionName: "Profiles",
    },
  ];

  async function search_posts(
    postStart,
    setPostsHasMore,
    setSearchPosts,
    setPostStart,
    reset = false
  ) {
    try {
      const res = await fetch(
        `http://localhost:5000/search_posts?search_term=${searchTerm}&limit=${limit}&offset=${
          reset ? 0 : postStart
        }&post_type=${currentSection}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await res.json();
      if (data.posts.length < limit) {
        setPostsHasMore(false);
      }
      if (reset) {
        setSearchPosts(data.posts);
        setPostStart(data.posts.length);
      } else {
        setSearchPosts((prev) => [...prev, ...data.posts]);
        setPostStart((prev) => prev + limit);
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  }

  async function search_profiles(
    profileStart,
    setProfilesHasMore,
    setSearchProfiles,
    setProfileStart,
    reset = false
  ) {
    try {
      const res = await fetch(
        `http://localhost:5000/search_profiles?search_term=${searchTerm}&limit=${limit}&offset=${
          reset ? 0 : profileStart
        }`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );
      const data = await res.json();
      if (data.profiles.length < limit) {
        setProfilesHasMore(false);
      }
      if (reset) {
        setSearchProfiles(data.profiles);
        setProfileStart(data.profiles.length);
      } else {
        setSearchProfiles((prev) => [...prev, ...data.profiles]);
        setProfileStart((prev) => prev + limit);
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  }

  return (
    <section className="content-wrapper">
      <SearchBar />
      <div className="search-results">
        <ContentNavbar
          sections={navbar_sections}
          setCurrentSection={setCurrentSection}
          currentSection={currentSection}
        />
        {currentSection === "profile" && (
          <SearchProfiles
            displayProfiles={() =>
              search_profiles(start, setHasMore, setPosts, setStart, true)
            }
            fetchMore={() =>
              search_profiles(start, setHasMore, setPosts, setStart, false)
            }
            profiles={posts}
            searchTerm={searchTerm}
            hasMore={hasMore}
            setHasMore={setHasMore}
          />
        )}
        {currentSection === "project" && (
          <Projects
            displaySectionPosts={() =>
              search_posts(start, setHasMore, setPosts, setStart, true)
            }
            fetchMorePosts={() =>
              search_posts(start, setHasMore, setPosts, setStart, false)
            }
            projects={posts}
            location="search-page"
            likedPosts={likedPosts}
            currentSection={currentSection}
            setHasMoreProject={setHasMore}
            hasMoreProject={hasMore}
            searchTerm={searchTerm}
          />
        )}
        {currentSection === "qna" && (
          <AskAndAnswers
            displaySectionPosts={() =>
              search_posts(start, setHasMore, setPosts, setStart, true)
            }
            fetchMorePosts={() =>
              search_posts(start, setHasMore, setPosts, setStart, false)
            }
            askAndAnswers={posts}
            location="search-page"
            likedPosts={likedPosts}
            currentSection={currentSection}
            setHasMoreQna={setHasMore}
            hasMoreQna={hasMore}
            searchTerm={searchTerm}
          />
        )}
      </div>
    </section>
  );
}
