import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import "../styles/content.css";
import SectionsNavbar from "./SectionsNavbar";
import Posts from "./Posts";
import NotFound404 from "./NotFound404";
import { UserContext, UIContext, ErrorContext } from "../utils";
import ServiceUnavailableError503 from "./ServiceUnavailableError503";

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
        name="search-bar"
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
        <h1 className="about-us-title">Show. Share. Learn.</h1>
        <h2 className="about-us-description">
          A place for tech students to showcase their work and exchange
          knowledge
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
  section,
  post_type,
  setPosts,
  start,
  setStart,
  setHasMore,
  filter,
  limit,
  setLoading,
  setViewMoreLoading,
  setError503,
  reset = false,
  token
) {
  reset ? setLoading(true) : setViewMoreLoading(true);
  const category = filter === "Best" ? "likes" : "post_date";
  try {
    const res = await fetch(
      `http://localhost:5000/fetch_specific_tag?target_tag=${section}&post_type=${post_type}&category=${category}&start=${
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
    console.error("Error: " + err.message);
    setError503(true);
  } finally {
    reset ? setLoading(false) : setViewMoreLoading(false);
  }
}

//function to fetch 10 posts at a time
async function fetchPostsHomePage(
  postType,
  setPosts,
  start,
  setStart,
  setHasMore,
  filter,
  limit,
  setLoading,
  setViewMoreLoading,
  setError503,
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
      setPosts(data.posts);
      setStart(data.posts.length);
      setHasMore(true);
    } else {
      //update all the posts displayed
      setPosts((prev) => [...prev, ...data.posts]);
      //increment the offset to fetch the next batch of 10 posts
      setStart((prev) => prev + limit);
    }
    //if the number of posts received is lower than the limit, it means there's no more posts left to fetch
    if (data.posts.length < limit) {
      setHasMore(false);
    }
  } catch (err) {
    console.error("Error: " + err.message);
    setError503(true);
  } finally {
    reset ? setLoading(false) : setViewMoreLoading(false);
  }
}

// async function fetchTags(setTags) {
//   try {
//     const res = await fetch("http://localhost:5000/fetch_tags");
//     const data = await res.json();
//     setTags(data.tags);
//   } catch (err) {
//     alert("Error: " + err.message);
//   }
// }

// export function useDisplayTagsOnPage(setTags) {
//   useEffect(() => {
//     fetchTags(setTags);
//   }, []);
// }

//fetch respective tags for specific category on the site (projects, ask & answer, ...)
// function fetchTagsForPostType(tags, post_type) {
//   const tags_arr = [];
//   tags.forEach((element) => {
//     if (element.post_type === post_type) {
//       tags_arr.push(element.tag_name);
//     }
//   });
//   return tags_arr;
// }

export default function Content() {
  const { token } = useContext(UserContext);
  const { tags } = useContext(UIContext);
  const [postsLoading, setPostsLoading] = useState(true);
  const [viewMorePostsLoading, setViewMorePostsLoading] = useState(false);
  const { currentSection = "project", currentTag } = useParams();
  const [posts, setPosts] = useState(null);
  const [start, setStart] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [postFilter, setPostFilter] = useState("Best");
  const location = "home-page";
  const validSections = ["project", "qna"];
  const projectTags = tags
    .filter((item) => item.post_type === "project")
    .map((item) => item.tag_name);
  const askAnswerTags = tags
    .filter((item) => item.post_type === "qna")
    .map((item) => item.tag_name);
  const { error503, setError503 } = useContext(ErrorContext);

  if (!validSections.includes(currentSection)) {
    return <NotFound404 />;
  }

  if (currentTag) {
    if (
      !projectTags.includes(currentTag) &&
      !askAnswerTags.includes(currentTag)
    )
      return <NotFound404 />;
  }

  //sections to insert into the navbar for this page
  const navbar_sections = [
    {
      sectionDbName: "project",
      imagePath: "/media/images/projects-logo.svg",
      sectionName: "Projects",
      subsections: projectTags,
    },
    {
      sectionDbName: "qna",
      imagePath: "/media/images/askAnswer.svg",
      sectionName: "Ask & Answer",
      subsections: askAnswerTags,
    },
  ];

  console.log("Rendering Content");

  return error503 ? (
    <ServiceUnavailableError503 />
  ) : (
    <section className="content-wrapper">
      <AboutUs />
      <div className="content-grid">
        {/* render sections navbar */}
        <SectionsNavbar
          sections={navbar_sections}
          currentSection={currentSection}
          currentTag={currentTag}
          currentRoute="/"
          location={location}
        />
        {/* fetch posts for projects */}
        {currentSection === "project" && !currentTag && (
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
                setPostsLoading,
                setViewMorePostsLoading,
                setError503,
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
                setPostsLoading,
                setViewMorePostsLoading,
                setError503,
                false,
                token
              )
            }
            postsLoading={postsLoading}
            viewMorePostsLoading={viewMorePostsLoading}
            dependencies={[currentSection, currentTag, token, postFilter]}
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
        {projectTags.includes(currentTag) && (
          <Posts
            displaySectionPosts={() =>
              fetchSpecificTag(
                currentTag,
                "project",
                setPosts,
                start,
                setStart,
                setHasMore,
                postFilter,
                10,
                setPostsLoading,
                setViewMorePostsLoading,
                setError503,
                true,
                token
              )
            }
            fetchMorePosts={() =>
              fetchSpecificTag(
                currentTag,
                "project",
                setPosts,
                start,
                setStart,
                setHasMore,
                postFilter,
                10,
                setPostsLoading,
                setViewMorePostsLoading,
                setError503,
                false,
                token
              )
            }
            postsLoading={postsLoading}
            viewMorePostsLoading={viewMorePostsLoading}
            dependencies={[currentSection, currentTag, token, postFilter]}
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
        {currentSection === "qna" && !currentTag && (
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
                setPostsLoading,
                setViewMorePostsLoading,
                setError503,
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
                setPostsLoading,
                setViewMorePostsLoading,
                setError503,
                false,
                token
              )
            }
            postsLoading={postsLoading}
            viewMorePostsLoading={viewMorePostsLoading}
            dependencies={[currentSection, currentTag, token, postFilter]}
            location={location}
            postLabel="Ask & Answers"
            posts={posts}
            hasMorePosts={hasMore}
            setHasMorePosts={setHasMore}
            filter={postFilter}
            setFilter={setPostFilter}
          />
        )}
        {askAnswerTags.includes(currentTag) && (
          <Posts
            displaySectionPosts={() =>
              fetchSpecificTag(
                currentTag,
                "qna",
                setPosts,
                start,
                setStart,
                setHasMore,
                postFilter,
                10,
                setPostsLoading,
                setViewMorePostsLoading,
                setError503,
                true,
                token
              )
            }
            fetchMorePosts={() =>
              fetchSpecificTag(
                currentTag,
                "qna",
                setPosts,
                start,
                setStart,
                setHasMore,
                postFilter,
                10,
                setPostsLoading,
                setViewMorePostsLoading,
                setError503,
                false,
                token
              )
            }
            postsLoading={postsLoading}
            viewMorePostsLoading={viewMorePostsLoading}
            dependencies={[currentSection, currentTag, token, postFilter]}
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
