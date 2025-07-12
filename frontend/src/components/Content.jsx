import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/content.css";
import SectionsNavbar from "./SectionsNavbar";
import Posts from "./Posts";
import { UserContext, UIContext } from "../utils";

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
  setViewMoreLoading,
  reset = false,
  token
) {
  reset ? setLoading(true) : setViewMoreLoading(true);
  const category = filter === "Best" ? "likes" : "post_date";
  try {
    const res = await fetch(
      `http://localhost:5000/fetch_specific_tag?target_tag=${currentSection}&post_type=${post_type}&category=${category}&start=${
        reset ? 0 : start
      }&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
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
    reset ? setLoading(false) : setViewMoreLoading(false);
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
  setViewMoreLoading,
  reset = false,
  token
) {
  reset ? setLoading(true) : setViewMoreLoading(true);
  const category = filter === "Best" ? "likes" : "post_date";
  try {
    const res = await fetch(
      `http://localhost:5000/get_postsByCategory?post_type=${encodeURIComponent(
        postType
      )}&category=${category}&start=${reset ? 0 : start}&limit=${limit}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const data = await res.json();
    if (reset) {
      setPostType(data.posts);
      setStart(data.posts.length);
      setHasMore(true);
    } else {
      //update all the posts displayed
      setPostType((prev) => [...prev, ...data.posts]);
      //increment the offset to fetch the next batch of 10 posts
      setStart((prev) => prev + limit);
    }
    //if the number of posts received is lower than the limit, it means there's no more posts left to fetch
    if (data.posts.length < limit) {
      setHasMore(false);
    }
  } catch (err) {
    alert("Error: " + err.message);
  } finally {
    reset ? setLoading(false) : setViewMoreLoading(false);
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
  const { token } = useContext(UserContext);
  const [currentSection, setCurrentSection] = useState("project");
  const [tags, setTags] = useState([]);
  const [posts, setPosts] = useState([]);
  const [start, setStart] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [postFilter, setPostFilter] = useState("Best");
  const location = "home-page";
  const { loading, setLoading, setViewMoreLoading } = useContext(UIContext);

  //display avaliable tags for sections in the navbar
  displayTagsOnPage(setTags);
  const fetchTagsForProjects = fetchTagsForPostType(tags, "project");
  const fetchTagsForQna = fetchTagsForPostType(tags, "qna");

  useEffect(() => {
    console.log(posts);
  }, [posts]);

  //sections to insert into the navbar for this page
  const navbar_sections = [
    {
      sectionDbName: "project",
      imagePath: "../media/images/projects-logo.svg",
      sectionName: "All Projects",
      subsections: fetchTagsForProjects,
    },
    {
      sectionDbName: "qna",
      imagePath: "../media/images/askAnswer.svg",
      sectionName: "All Ask & Answers",
      subsections: fetchTagsForQna,
    },
  ];

  console.log("Rendering Content");

  return (
    <section className="content-wrapper">
      <AboutUs />
      <div className="content-grid">
        {/* render sections navbar */}
        <SectionsNavbar
          sections={navbar_sections}
          setCurrentSection={setCurrentSection}
          currentSection={currentSection}
          location={location}
        />
        {/* fetch posts for projects */}
        {currentSection === "project" && (
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
                setViewMoreLoading,
                true,
                token
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
                setViewMoreLoading,
                false,
                token
              )
            }
            token={token}
            currentSection={currentSection}
            location={location}
            postLabel="Projects"
            posts={posts}
            hasMorePosts={hasMore}
            setHasMorePosts={setHasMore}
            filter={postFilter}
            setFilter={setPostFilter}
          />
        )}
        {/* fetch tag posts for projects */}
        {fetchTagsForProjects.includes(currentSection) && (
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
                setViewMoreLoading,
                true,
                token
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
                setViewMoreLoading,
                false,
                token
              )
            }
            token={token}
            currentSection={currentSection}
            location={location}
            postLabel="Projects"
            posts={posts}
            hasMorePosts={hasMore}
            setHasMorePosts={setHasMore}
            filter={postFilter}
            setFilter={setPostFilter}
          />
        )}
        {/* fetch posts for ask and answers */}
        {currentSection === "qna" && (
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
                setViewMoreLoading,
                true,
                token
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
                setViewMoreLoading,
                false,
                token
              )
            }
            token={token}
            currentSection={currentSection}
            location={location}
            postLabel="Ask & Answers"
            posts={posts}
            hasMorePosts={hasMore}
            setHasMorePosts={setHasMore}
            filter={postFilter}
            setFilter={setPostFilter}
          />
        )}
        {fetchTagsForQna.includes(currentSection) && (
          <Posts
            displaySectionPosts={() =>
              fetchSpecificTag(
                currentSection,
                "qna",
                setPosts,
                start,
                setStart,
                setHasMore,
                postFilter,
                10,
                setLoading,
                setViewMoreLoading,
                true,
                token
              )
            }
            fetchMorePosts={() =>
              fetchSpecificTag(
                currentSection,
                "qna",
                setPosts,
                start,
                setStart,
                setHasMore,
                postFilter,
                10,
                setLoading,
                setViewMoreLoading,
                false,
                token
              )
            }
            token={token}
            currentSection={currentSection}
            location={location}
            postLabel="Ask & Answers"
            posts={posts}
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
