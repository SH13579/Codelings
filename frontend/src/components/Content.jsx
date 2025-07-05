import React, { useState, useEffect, useContext } from "react";
import { Link, useFetcher, useNavigate } from "react-router-dom";
import "../styles/content.css";
import SectionsNavbar from "./SectionsNavbar";
import Posts from "./Posts";
import { displayLiked, UIContext } from "../utils";

export const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        navigate(`/search/${searchTerm}`);
      }}
      className="search-wrapper"
    >
      <input
        className="search-bar"
        onChange={(e) => setSearchTerm(e.target.value)}
        type="search"
        placeholder="Looking for something?"
      />
    </form>
  );
};

//short introduction to our website and search bar
const AboutUs = () => {
  return (
    <section className="about-us">
      <div className="about-us-wrapper">
        <h1 className="about-us-title">Share your Coding Projects</h1>
        <h2 className="about-us-description">
          A place for tech students to showcase their work and connect with
          others
        </h2>
        <SearchBar />
      </div>
    </section>
  );
};

export const handleNavigating = (e, navigate, username) => {
  e.stopPropagation();
  e.preventDefault();
  navigate(`/profile/${username}`);
};

//function used to fetch the posts for a specific tag
async function fetchSpecificTag(
  currentSection,
  post_type,
  setPosts,
  start,
  setStart,
  setHasMore,
  filter,
  limit,
  setLoading,
  reset = false
) {
  setLoading(true);
  const category = filter === "Best" ? "likes" : "post_date";
  try {
    const res = await fetch(
      `http://localhost:5000/fetch_specific_tag?target_tag=${currentSection}&post_type=${post_type}&category=${category}&start=${
        reset ? 0 : start
      }&limit=${limit}`
    );
    const data = await res.json();
    if (data.posts.length < limit) {
      setHasMore(false);
    }
    if (reset) {
      setPosts(data.posts);
      setStart(data.posts.length);
    } else {
      setPosts((prev) => [...prev, ...data.posts]);
      setStart((prev) => prev + limit);
    }
  } catch (err) {
    alert("Error: " + err.message);
  } finally {
    setLoading(false);
  }
}

//fetch respective tags for specific category on the site (projects, ask & answer, ...)
function fetchTagsForPostType(tags, post_type) {
  const tags_arr = [];
  tags.forEach((element) => {
    if (element.post_type === post_type) {
      tags_arr.push(element.tag_name);
    }
  });
  return tags_arr;
}

//function to fetch 10 posts at a time
async function fetchPostsHomePage(
  postType,
  setPostType,
  start,
  setStart,
  setHasMore,
  filter,
  limit,
  setLoading,
  reset = false
) {
  setLoading(true);
  const category = filter === "Best" ? "likes" : "post_date";
  try {
    const res = await fetch(
      `http://localhost:5000/get_postsByCategory?post_type=${encodeURIComponent(
        postType
      )}&category=${category}&start=${reset ? 0 : start}&limit=${limit}`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
      }
    );
    const data = await res.json();
    //if the number of posts received is lower than the limit, it means there's no more posts left to fetch
    if (data.posts.length < limit) {
      setHasMore(false);
    }
    if (reset) {
      setPostType(data.posts);
      setStart(data.posts.length);
    } else {
      //update all the posts displayed
      setPostType((prev) => [...prev, ...data.posts]);
      //increment the offset to fetch the next batch of 10 posts
      setStart((prev) => prev + limit);
    }
  } catch (err) {
    alert("Error: " + err.message);
  } finally {
    setLoading(false);
  }
}

async function fetchTags(setTags) {
  try {
    const res = await fetch("http://localhost:5000/fetch_tags");
    const data = await res.json();
    setTags(data.tags);
  } catch (err) {
    alert("Error: " + err.message);
  }
}

export function displayTagsOnPage(setTags) {
  useEffect(() => {
    fetchTags(setTags);
  }, []);
}

export default function Content() {
  const [likedPosts, setLikedPosts] = useState([]);
  const [currentSection, setCurrentSection] = useState("project");
  const [tags, setTags] = useState([]);
  const [posts, setPosts] = useState([]);
  const [start, setStart] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [postFilter, setPostFilter] = useState("Best");
  const location = "home-page";
  const { loading, setLoading } = useContext(UIContext);

  displayLiked(setLikedPosts, "posts", setLoading);
  displayTagsOnPage(setTags);

  const navbar_sections = [
    {
      sectionDbName: "project",
      imagePath: "../media/images/projects-logo.svg",
      sectionName: "All Projects",
      subsections: fetchTagsForPostType(tags, "project"),
    },
    {
      sectionDbName: "qna",
      imagePath: "../media/images/askAnswer.svg",
      sectionName: "All Ask & Answers",
      subsections: fetchTagsForPostType(tags, "qna"),
    },
  ];

  console.log("Rendering Content");

  return (
    <section className="content-wrapper">
      <AboutUs />
      <div className="content-grid">
        <SectionsNavbar //render sections navbar
          sections={navbar_sections}
          setCurrentSection={setCurrentSection}
          currentSection={currentSection}
          location={location}
        />
        {currentSection === "project" && ( //fetch posts for projects
          <Posts
            displaySectionPosts={() =>
              fetchPostsHomePage(
                currentSection,
                setPosts,
                start,
                setStart,
                setHasMore,
                postFilter,
                10,
                setLoading,
                true
              )
            }
            fetchMorePosts={() =>
              fetchPostsHomePage(
                currentSection,
                setPosts,
                start,
                setStart,
                setHasMore,
                postFilter,
                10,
                setLoading,
                false
              )
            }
            currentSection={currentSection}
            location={location}
            postLabel="Projects"
            posts={posts}
            likedPosts={likedPosts}
            hasMorePosts={hasMore}
            setHasMorePosts={setHasMore}
            filter={postFilter}
            setFilter={setPostFilter}
          />
        )}
        {fetchTagsForPostType(tags, "project").includes(currentSection) && ( //fetch tag posts for projects
          <Posts
            displaySectionPosts={() =>
              fetchSpecificTag(
                currentSection,
                "project",
                setPosts,
                start,
                setStart,
                setHasMore,
                postFilter,
                10,
                setLoading,
                true
              )
            }
            fetchMorePosts={() =>
              fetchSpecificTag(
                currentSection,
                "project",
                setPosts,
                start,
                setStart,
                setHasMore,
                postFilter,
                10,
                setLoading,
                false
              )
            }
            currentSection={currentSection}
            location={location}
            postLabel="Projects"
            posts={posts}
            likedPosts={likedPosts}
            hasMorePosts={hasMore}
            setHasMorePosts={setHasMore}
            filter={postFilter}
            setFilter={setPostFilter}
          />
        )}
        {currentSection === "qna" && ( //fetch posts for ask&answers
          <Posts
            displaySectionPosts={() =>
              fetchPostsHomePage(
                currentSection,
                setPosts,
                start,
                setStart,
                setHasMore,
                postFilter,
                10,
                setLoading,
                true
              )
            }
            fetchMorePosts={() =>
              fetchPostsHomePage(
                currentSection,
                setPosts,
                start,
                setStart,
                setHasMore,
                postFilter,
                10,
                setLoading,
                false
              )
            }
            currentSection={currentSection}
            location={location}
            postLabel="Ask & Answers"
            posts={posts}
            likedPosts={likedPosts}
            hasMorePosts={hasMore}
            setHasMorePosts={setHasMore}
            filter={postFilter}
            setFilter={setPostFilter}
          />
        )}
      </div>
    </section>
  );
}
