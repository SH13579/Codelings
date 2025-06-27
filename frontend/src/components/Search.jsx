import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ProjectCard from "./ProjectCard";
import AskAnswerCard from "./AskAnswerCard";
import { SearchBar } from "./Content";
import { handleNavigating } from "./Content";
import "../styles/search.css";

const SearchProfile = (props) => {
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

export default function Search() {
  const { searchTerm } = useParams();
  const [postStart, setPostStart] = useState(0);
  const [profileStart, setProfileStart] = useState(0);
  const [postsHasMore, setPostsHasMore] = useState(true);
  const [profilesHasMore, setProfilesHasMore] = useState(true);
  const [searchPosts, setSearchPosts] = useState([]);
  const [searchProfiles, setSearchProfiles] = useState([]);
  const postsRef = useRef(null);
  const profilesRef = useRef(null);
  const limit = 10;

  async function search_posts(postStart) {
    try {
      const res = await fetch(
        `http://localhost:5000/search_posts?search_term=${searchTerm}&limit=${limit}&offset=${postStart}`,
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
      setSearchPosts((prev) => [...prev, ...data.posts]);
      setPostStart(postStart + limit);
    } catch (err) {
      alert("Error: " + err.message);
    }
  }

  async function search_profiles(profileStart) {
    try {
      const res = await fetch(
        `http://localhost:5000/search_profiles?search_term=${searchTerm}&limit=${limit}&offset=${profileStart}`,
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
      setSearchProfiles((prev) => [...prev, ...data.profiles]);
      setProfileStart(profileStart + limit);
    } catch (err) {
      alert("Error: " + err.message);
    }
  }

  useEffect(() => {
    if (postsRef.current) {
      return;
    }
    postsRef.current = true;
    setPostsHasMore(true);
    setSearchPosts([]);
    setPostStart(0);
    search_posts(0);
  }, [searchTerm]);

  useEffect(() => {
    if (profilesRef.current) {
      return;
    }
    profilesRef.current = true;
    setProfilesHasMore(true);
    setSearchProfiles([]);
    setProfileStart(0);
    search_profiles(0);
  }, [searchTerm]);

  useEffect(() => {
    console.log(searchProfiles);
  }, [searchProfiles]);

  const postsReturned = searchPosts.map((item) => {
    if (item.type === "project") {
      return <ProjectCard location="search-page" key={item.id} {...item} />;
    } else {
      return <AskAnswerCard location="search-page" key={item.id} {...item} />;
    }
  });

  const profilesReturned = searchProfiles.map((item) => {
    return <SearchProfile key={item.id} {...item} />;
  });

  return (
    <section className="content-wrapper">
      <SearchBar />
      <div className="search-results">
        <div className="searched-profiles-wrapper">
          <h2>Profiles</h2>
          <div className="searched-profiles">{profilesReturned}</div>
        </div>
        <div className="searched-posts-wrapper">
          <h2>Posts</h2>
          <div className="searched-posts">{postsReturned}</div>
        </div>
      </div>
    </section>
  );
}
