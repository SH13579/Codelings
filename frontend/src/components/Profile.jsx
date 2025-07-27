import React, { useState, useContext, useEffect } from "react";
import "../styles/profile.css";
import { UserContext, UIContext, ErrorContext } from "../utils";
import { useParams, Link } from "react-router-dom";
import Loading from "./Loading";
import SectionsNavbar from "./SectionsNavbar";
import Posts from "./Posts";
import NotExist from "./NotExist";
import InternalServerError500 from "./InternalServerError500";
import ServiceUnavailableError503 from "./ServiceUnavailableError503";

export function showDeletePopup(
  e,
  post_id,
  setDeleted,
  setShowPopup,
  video_file_path,
  setError500Msg,
  setError503
) {
  e.preventDefault();
  e.stopPropagation();
  const token = sessionStorage.getItem("token");
  async function deletePost() {
    try {
      const res = await fetch("http://localhost:5000/delete_post", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          post_id: post_id,
          video_file_path: video_file_path,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setDeleted(true);
        setShowPopup(null);
      } else {
        // ❗ show the error from Python backend
        if (res.status === 500) {
          setError500Msg(true)
        }
        alert("Error1: " + data.error);
      }
    } catch (err) {
      alert("Error2: " + err.message);
      setError503(true);
    }
  }
  setShowPopup({
    message: (
      <div>
        <h3>Delete Post?</h3>
        <h4>Action cannot be restored</h4>
      </div>
    ),
    buttons: [
      {
        label: "Yes",
        action: deletePost,
      },
      {
        label: "Cancel",
        action: () => setShowPopup(null),
      },
    ],
  });
}

async function fetchLikedPosts(
  start,
  setStart,
  setPosts,
  setHasMore,
  limit,
  reset = false,
  setPostsLoading,
  token,
  setViewMorePostsLoading
) {
  reset ? setPostsLoading(true) : setViewMorePostsLoading(true);
  try {
    const res = await fetch(
      `http://localhost:5000/fetch_liked_posts?limit=${limit}&offset=${
        reset ? 0 : start
      }`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const data = await res.json();
    if (data.liked_posts.length < limit) {
      setHasMore(false);
    }
    if (reset) {
      setStart(data.liked_posts.length);
      setPosts(data.liked_posts);
    } else {
      setStart((prev) => prev + limit);
      setPosts((prev) => [...prev, ...data.liked_posts]);
    }
  } catch (err) {
    alert("Error3: " + err.message);
  } finally {
    reset ? setPostsLoading(false) : setViewMorePostsLoading(false);
  }
}

async function fetchPostsProfile(
  postType,
  setPosts,
  start,
  setStart,
  setHasMore,
  filter,
  limit,
  reset = false,
  username,
  setPostsLoading,
  setViewMorePostsLoading,
  setError503,
  token
) {
  const category = filter === "Best" ? "likes" : "post_date";
  reset ? setPostsLoading(true) : setViewMorePostsLoading(true);
  try {
    const res = await fetch(
      `http://localhost:5000/get_posts_byUserAndCategory?username=${encodeURIComponent(
        username
      )}&post_type=${encodeURIComponent(postType)}&category=${category}&start=${
        reset ? 0 : start
      }&limit=${limit}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const data = await res.json();
    //if the number of posts received is lower than the limit, it means there's no more posts left to fetch
    if (data.posts.length < limit) {
      setHasMore(false);
    }
    if (reset) {
      setPosts(data.posts);
      setStart(data.posts.length);
    } else {
      //update all the posts displayed
      setPosts((prev) => [...prev, ...data.posts]);
      //increment the offset to fetch the next batch of 10 posts
      setStart((prev) => prev + limit);
    }
  } catch (err) {
    alert("Error4: " + err.message);
    setError503(true);
  } finally {
    reset ? setPostsLoading(false) : setViewMorePostsLoading(false);
  }
}

export function useFetchProfileInfo(
  username,
  setProfileInfo,
  setProfileLoading,
  setError503
) {
  useEffect(() => {
    async function fetchProfile() {
      setProfileLoading(true);
      try {
        const res = await fetch(
          `http://localhost:5000/fetch_profile?username=${encodeURIComponent(
            username
          )}`
        );
        const data = await res.json();
        const profile = data.profile;

        if (!profile) {
          setProfileInfo(null);
          return;
        }

        setProfileInfo({
          about_me: profile.about_me || "",
          email: profile.email || "",
          github_link: profile.github_link || "",
          pfp: profile.pfp || null,
          year_of_study: profile.year_of_study || "",
        });
      } catch (err) {
        alert("Error5: " + err.message);
        setError503(true);
      } finally {
        setProfileLoading(false);
      }
    }

    fetchProfile();
  }, [username]);
}

export default function Profile() {
  const [profileInfo, setProfileInfo] = useState({
    about_me: "",
    email: "",
    github_link: "",
    pfp: "",
    year_of_study: "",
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [viewMorePostsLoading, setViewMorePostsLoading] = useState(false);
  const { currentUser, token } = useContext(UserContext);
  const [posts, setPosts] = useState([]);
  const [start, setStart] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [postFilter, setPostFilter] = useState("Best");
  const location = "profile";
  const { username, currentSection = "project" } = useParams();
  const { error500Msg, setError500Msg, error500Page, setError500Page, error503, setError503 } = useContext(ErrorContext);

  useFetchProfileInfo(username, setProfileInfo, setProfileLoading, setError503);

  const navbar_sections = [
    {
      sectionDbName: "project",
      imagePath: "/media/images/projects-logo.svg",
      sectionName: "Projects",
    },
    {
      sectionDbName: "qna",
      imagePath: "/media/images/askAnswer.svg",
      sectionName: "Ask & Answer",
    },
    {
      sectionDbName: "liked_posts",
      imagePath: "/media/images/liked_section_icon.svg",
      sectionName: "Liked Posts",
      condition: Boolean(currentUser && currentUser.username === username),
    },
  ];

  return error503? (
    <ServiceUnavailableError503 />
  ) :
  profileLoading ? (
    <Loading />
  ) : profileInfo ? (
    <div className="profile-wrapper">
      <div className="profile">
        <div className="profile-info">
          {currentUser && currentUser.username === username && (
            <Link to="/edit-profile">
              <button className="edit-profile">Edit Profile</button>
            </Link>
          )}
          <img className="profile-pfp" src={currentUser.pfp} />
          <h2 className="profile-name">@{username}</h2>

          <div className="profile-details-wrap">
            {profileInfo.about_me && (
              <div className="profile-about">{profileInfo.about_me}</div>
            )}
            <div className="profile-details">
              {profileInfo.email && (
                <span className="profile-email">
                  <img
                    className="profile-email-logo"
                    src="/media/images/email-logo.svg"
                  />
                  {profileInfo.email}
                </span>
              )}
              {profileInfo.year_of_study && (
                <span className="profile-yos">
                  <img
                    className="profile-yos-logo"
                    src="/media/images/year-study-logo.svg"
                  />
                  {profileInfo.year_of_study}
                </span>
              )}
              {profileInfo.github_link && (
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={profileInfo.github_link}
                  className="profile-github"
                >
                  <img
                    className="profile-github-logo"
                    src="/media/images/github-logo.svg"
                  />
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="horizontal-line"></div>
        <div className="content-grid">
          <SectionsNavbar
            currentRoute={`/profile/${username}/`}
            sections={navbar_sections}
            currentSection={currentSection}
          />
          {currentSection === "project" && (
            <Posts
              displaySectionPosts={() =>
                fetchPostsProfile(
                  currentSection,
                  setPosts,
                  start,
                  setStart,
                  setHasMore,
                  postFilter,
                  10,
                  true,
                  username,
                  setPostsLoading,
                  setViewMorePostsLoading,
                  setError503,
                  token
                )
              }
              fetchMorePosts={() =>
                fetchPostsProfile(
                  currentSection,
                  setPosts,
                  start,
                  setStart,
                  setHasMore,
                  postFilter,
                  10,
                  false,
                  username,
                  setPostsLoading,
                  setViewMorePostsLoading,
                  token
                )
              }
              postsLoading={postsLoading}
              viewMorePostsLoading={viewMorePostsLoading}
              dependencies={[currentSection, postFilter, username]}
              location={location}
              postLabel="Projects"
              posts={posts}
              hasMorePosts={hasMore}
              setHasMorePosts={setHasMore}
              filter={postFilter}
              setFilter={setPostFilter}
            />
          )}
          {currentSection === "qna" && (
            <Posts
              displaySectionPosts={() =>
                fetchPostsProfile(
                  currentSection,
                  setPosts,
                  start,
                  setStart,
                  setHasMore,
                  postFilter,
                  10,
                  true,
                  username,
                  setPostsLoading,
                  setViewMorePostsLoading,
                  token
                )
              }
              fetchMorePosts={() =>
                fetchPostsProfile(
                  currentSection,
                  setPosts,
                  start,
                  setStart,
                  setHasMore,
                  postFilter,
                  10,
                  false,
                  username,
                  setPostsLoading,
                  setViewMorePostsLoading,
                  token
                )
              }
              postsLoading={postsLoading}
              viewMorePostsLoading={viewMorePostsLoading}
              dependencies={[currentSection, postFilter, username]}
              location={location}
              postLabel="Ask & Answers"
              posts={posts}
              hasMorePosts={hasMore}
              setHasMorePosts={setHasMore}
              filter={postFilter}
              setFilter={setPostFilter}
            />
          )}
          {currentSection === "liked_posts" && (
            <Posts
              displaySectionPosts={() =>
                fetchLikedPosts(
                  start,
                  setStart,
                  setPosts,
                  setHasMore,
                  10,
                  true,
                  setPostsLoading,
                  token,
                  setViewMorePostsLoading
                )
              }
              fetchMorePosts={() =>
                fetchLikedPosts(
                  start,
                  setStart,
                  setPosts,
                  setHasMore,
                  10,
                  false,
                  setPostsLoading,
                  token,
                  setViewMorePostsLoading
                )
              }
              postsLoading={postsLoading}
              viewMorePostsLoading={viewMorePostsLoading}
              dependencies={[currentSection, postFilter, username]}
              location={location}
              postLabel="Liked Posts"
              posts={posts}
              hasMorePosts={hasMore}
              setHasMorePosts={setHasMore}
            />
          )}
        </div>
      </div>
    </div>
  ) : (
    <NotExist msg={"The user you are looking for does not exist"} />
  );
}
