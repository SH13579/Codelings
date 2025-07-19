import React, { useState, useEffect, useRef, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SearchBar } from "./Content";
import { handleNavigating } from "./Content";
import SectionsNavbar from "./SectionsNavbar";
import Posts from "./Posts";
import Loading, { ViewMoreLoading } from "./Loading";
import "../styles/search.css";
import { UIContext, EmptyContainer, UserContext } from "../utils";

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
  return props.postsLoading ? (
    <Loading />
  ) : (
    <div className="searched-profiles-wrapper">
      <h2 className="post-label">Profiles</h2>
      {props.profiles.length > 0 ? (
        <div className="searched-profiles">{profilesReturned}</div>
      ) : (
        <EmptyContainer />
      )}
      {props.hasMore && (
        <button onClick={props.fetchMore}>
          {props.viewMorePostsLoading ? <ViewMoreLoading /> : "View More"}
        </button>
      )}
    </div>
  );
};

export default function Search() {
  const { token } = useContext(UserContext);
  const { searchTerm, currentSection = "project" } = useParams();
  const [start, setStart] = useState(0);
  const [posts, setPosts] = useState(null);
  const limit = 10;
  const [hasMore, setHasMore] = useState(false);
  const [postsLoading, setPostsLoading] = useState(true);
  const [viewMorePostsLoading, setViewMorePostsLoading] = useState(false);
  const location = "search-page";

  console.log("Search");

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
    reset = false,
    token
  ) {
    reset ? setPostsLoading(true) : setViewMorePostsLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/search_posts?search_term=${searchTerm}&limit=${limit}&offset=${
          reset ? 0 : postStart
        }&post_type=${currentSection}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      if (reset) {
        setPostsHasMore(true);
        setSearchPosts(data.posts);
        setPostStart(data.posts.length);
      } else {
        setSearchPosts((prev) => [...prev, ...data.posts]);
        setPostStart((prev) => prev + limit);
      }
      if (data.posts.length < limit) {
        setPostsHasMore(false);
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      reset ? setPostsLoading(false) : setViewMorePostsLoading(false);
    }
  }

  async function search_profiles(
    profileStart,
    setProfilesHasMore,
    setSearchProfiles,
    setProfileStart,
    reset = false
  ) {
    reset ? setPostsLoading(true) : setViewMorePostsLoading(true);
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
      if (reset) {
        setProfilesHasMore(true);
        setSearchProfiles(data.profiles);
        setProfileStart(data.profiles.length);
      } else {
        setSearchProfiles((prev) => [...prev, ...data.profiles]);
        setProfileStart((prev) => prev + limit);
      }
      if (data.profiles.length < limit) {
        setProfilesHasMore(false);
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      reset ? setPostsLoading(false) : setViewMorePostsLoading(false);
    }
  }

  return (
    <section className="content-wrapper">
      <SearchBar />
      <div className="search-results">
        <SectionsNavbar
          sections={navbar_sections}
          currentRoute={`/search/${searchTerm}/`}
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
            postsLoading={postsLoading}
            viewMorePostsLoading={viewMorePostsLoading}
          />
        )}
        {currentSection === "project" && (
          <Posts
            displaySectionPosts={() =>
              search_posts(start, setHasMore, setPosts, setStart, true, token)
            }
            fetchMorePosts={() =>
              search_posts(start, setHasMore, setPosts, setStart, false, token)
            }
            postsLoading={postsLoading}
            viewMorePostsLoading={viewMorePostsLoading}
            dependencies={[currentSection, searchTerm]}
            postLabel="Projects"
            location={location}
            posts={posts}
            hasMorePosts={hasMore}
            setHasMorePosts={setHasMore}
          />
        )}
        {currentSection === "qna" && (
          <Posts
            displaySectionPosts={() =>
              search_posts(start, setHasMore, setPosts, setStart, true, token)
            }
            fetchMorePosts={() =>
              search_posts(start, setHasMore, setPosts, setStart, false, token)
            }
            postsLoading={postsLoading}
            viewMorePostsLoading={viewMorePostsLoading}
            dependencies={[currentSection, searchTerm]}
            postLabel="Ask & Answers"
            location={location}
            posts={posts}
            hasMorePosts={hasMore}
            setHasMorePosts={setHasMore}
          />
        )}
      </div>
    </section>
  );
}
