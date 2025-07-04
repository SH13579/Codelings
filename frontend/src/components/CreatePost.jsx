import React, { useState, useRef, useContext, useEffect, useMemo } from "react";
import { useExitListener, useExitListenerWithAlert } from "../utils";
import { UserContext } from "../utils";
import { useNavigate } from "react-router-dom";
import { displayTagsOnPage } from "./Content";

const MultiselectDropdown = ({
  tags,
  selectedTags,
  setSelectedTags,
  showDropdown,
  setShowDropdown,
}) => {
  const dropdownRef = useRef(null);
  useExitListener(setShowDropdown, dropdownRef);

  function handleSelect(e) {
    const value = e.target.value;
    setSelectedTags((prev) => {
      if (prev.includes(value)) {
        return prev.filter((tag) => tag !== value);
      } else {
        return [...prev, value];
      }
    });
  }

  //display the selected tags on the input box
  const DisplaySelectedTags = () => {
    const displaySelected = selectedTags.map((tag) => {
      return (
        <div key={tag} className="selected-tag">
          {tag}
        </div>
      );
    });
    return displaySelected;
  };

  //render all available tags onto the dropdown
  const all_tags = tags.map((item) => {
    return (
      <div key={item.tag_name}>
        <label
          className={
            selectedTags.includes(item.tag_name)
              ? "highlight-tag"
              : "dropdown-tag"
          }
        >
          {item.tag_name}
          <input
            className={
              selectedTags.includes(item.tag_name)
                ? "dropdown-checkbox"
                : "remove-checkbox"
            }
            type="checkbox"
            checked={selectedTags.includes(item.tag_name)}
            value={item.tag_name}
            onChange={(e) => handleSelect(e)}
          />
        </label>
        <div className="horizontal-line"></div>
      </div>
    );
  });
  return (
    <div ref={dropdownRef} className="multi-select">
      <div
        onClick={() => setShowDropdown(!showDropdown)}
        className="select-box"
      >
        <DisplaySelectedTags />
      </div>
      <div className="dropdown-buttons">
        <span
          onClick={() => setSelectedTags([])}
          className={
            selectedTags.length > 0 ? "dropdown-clear" : "display-none"
          }
        >
          &#10006;
        </span>
        <img
          className="dropdown-arrow"
          src="../media/images/dropdown-arrow.svg"
          onClick={() => setShowDropdown(!showDropdown)}
        ></img>
      </div>
      <div className={showDropdown ? "multi-select-drop" : "display-none"}>
        {all_tags}
      </div>
    </div>
  );
};

const CreatePostForm = ({ token, msg, setMsg, setClickCreatePost }) => {
  const [projectPost, setProjectPost] = useState({
    post_date: "",
    post_type: "",
    post_title: "",
    post_description: "",
    post_body: "",
    video_file_path: "",
  });
  const postFormRef = useRef(null);
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);
  const navigate = useNavigate();
  displayTagsOnPage(setTags);
  useExitListenerWithAlert(setAlertMsg, postFormRef);
  //set the states of all form values
  const handleChange = (e) => {
    setProjectPost((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  //handles submitting the post
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/create_post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: projectPost.post_title,
          post_type: projectPost.post_type,
          // post_date: projectPost.post_date,
          post_description: projectPost.post_description,
          post_body: projectPost.post_body,
          video_file_path: projectPost.video_file_path,
          likes: 0,
          comments: 0,
          tags: selectedTags,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMsg(data.success);
        navigate(`/post/${data.post_id}`);
      } else {
        setMsg(data.error);
      }
    } catch (err) {
      alert("Error:" + err.message);
    }
  };

  return (
    <div ref={postFormRef} className="post-project-wrapper">
      <button
        className="exit-button"
        onClick={() => {
          setAlertMsg(true);
        }}
      >
        &times;
      </button>
      <form onSubmit={handleSubmit} className="post-project">
        <h2 className="create-post">Create Post</h2>
        <div className="post-error">{msg}</div>
        <label>
          Select type of post<span className="required"> *</span>
        </label>
        <select
          className="create-post-select"
          name="post_type"
          value={projectPost.post_type}
          onChange={handleChange}
        >
          <option value="" disabled hidden>
            Select
          </option>
          <option value="project">Project</option>
          <option value="qna">Ask and Answer</option>
        </select>
        <label>Tags</label>
        <MultiselectDropdown
          tags={tags}
          selectedTags={selectedTags}
          setSelectedTags={setSelectedTags}
          showDropdown={showDropdown}
          setShowDropdown={setShowDropdown}
        />
        <label>
          Title<span className="required"> *</span>
        </label>
        <input
          value={projectPost.post_title}
          onChange={handleChange}
          className="create-post-title"
          type="text"
          name="post_title"
        />
        <label>
          Description<span className="required"> *</span>
        </label>
        <textarea
          value={projectPost.description}
          onChange={handleChange}
          className="create-post-description"
          type="text"
          name="post_description"
        />
        <label>Body</label>
        <textarea
          value={projectPost.post_body}
          onChange={handleChange}
          className="create-post-body"
          type="text"
          name="post_body"
        />
        <div className="post-project-last">
          <div className="">
            <label>Demo(mp4 only): </label>
            <input
              onChange={handleChange}
              type="file"
              accept=".mp4"
              name="video_file_path"
            />
            <div>OR</div>
            <div>Link:</div>
          </div>
          <div>
            <button className="project-submit">Post</button>
          </div>
        </div>
      </form>
      {alertMsg && (
        <AlertMsg
          setAlertMsg={setAlertMsg}
          setClickCreatePost={setClickCreatePost}
        />
      )}
    </div>
  );
};

const AlertMsg = ({ setAlertMsg, setClickCreatePost }) => {
  return (
    <div>
      <div className="blocking-div"></div>
      <div className="popup-wrapper">
        <div className="popup">
          <h3>Are you sure you want to quit?</h3>
          <h4>Your post will not be saved</h4>
        </div>
        <div className="popup-buttons-wrapper">
          <button
            onClick={() => {
              setClickCreatePost(false);
              setAlertMsg(null);
            }}
            className="popup-button"
          >
            Yes
          </button>
          <button onClick={() => setAlertMsg(null)} className="popup-button">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const PostedMessage = ({ setClickCreatePost }) => {
  const postMsgRef = useRef(null);
  useExitListener(setClickCreatePost, postMsgRef);
  return (
    <div ref={postMsgRef} className="post-project-wrapper">
      <button
        className="exit-button"
        onClick={() => {
          setClickCreatePost(false);
        }}
      >
        &times;
      </button>
      <div className="post-success-wrapper">
        <div className="success-logo-wrapper">
          <img className="success-logo" src="../media/images/success.svg" />
        </div>
        <h3>Your submission has been sent</h3>
      </div>
    </div>
  );
};

export default function CreatePost({ setClickCreatePost }) {
  const token = sessionStorage.getItem("token");
  const [msg, setMsg] = useState("");

  console.log("Rendering Create Post");

  return (
    <div>
      <div className="blur"></div>
      {msg !== "Your project has been posted" ? (
        <CreatePostForm
          token={token}
          msg={msg}
          setMsg={setMsg}
          setClickCreatePost={setClickCreatePost}
        />
      ) : (
        <PostedMessage setClickCreatePost={setClickCreatePost} />
      )}
    </div>
  );
}
