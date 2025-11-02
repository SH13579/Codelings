import React, { useState, useRef, useContext, useEffect, useMemo } from "react";
import { useExitListener, useExitListenerWithAlert } from "../utils";
import { UserContext, UIContext, ErrorContext } from "../utils";
import { useNavigate } from "react-router-dom";
import CharCount from "./CharCount";
import { ViewMoreLoading } from "./Loading";

// multiselect dropdown for the user to select all the corresponding tags for their post
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
        onClick={() =>
          tags.length === 0
            ? setShowDropdown(false)
            : setShowDropdown(!showDropdown)
        }
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
          src="/images/dropdown-arrow.svg"
          onClick={() =>
            tags.length === 0
              ? setShowDropdown(false)
              : setShowDropdown(!showDropdown)
          }
        ></img>
      </div>
      <div className={showDropdown ? "multi-select-drop" : "display-none"}>
        {all_tags}
      </div>
    </div>
  );
};

// display the form for creating a post
const CreatePostForm = ({
  token,
  msg,
  setMsg,
  setClickCreatePost,
  setError503,
}) => {
  const [projectPost, setProjectPost] = useState({
    post_date: "",
    post_type: "",
    post_title: "",
    post_body: "",
    demoFile: "",
  });
  const { tags } = useContext(UIContext);
  const postFormRef = useRef(null);
  const [allowedTags, setAllowedTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useExitListenerWithAlert(setAlertMsg, postFormRef);
  const limitedCharTitle = 200;
  const limitedCharBody = 4000;

  //set the states of all form values
  const handleChange = (e) => {
    if (e.target.name === "post_type") {
      setAllowedTags(tags.filter((tag) => tag.post_type === e.target.value));
    }
    if (e.target.name === "demoFile") {
      const file = e.target.files[0];
      setProjectPost((prev) => ({
        ...prev,
        demoFile: file,
      }));
    } else {
      setProjectPost((prev) => ({
        ...prev,
        [e.target.name]: e.target.value,
      }));
    }
  };

  //handles submitting the post
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      projectPost.demoFile &&
      projectPost.demoFile.size / (1024 * 1024) > 50
    ) {
      setMsg("Video file size cannot exceed 50 MB");
    } else if (
      projectPost.demoFile &&
      !projectPost.demoFile.type.startsWith("video/")
    ) {
      setMsg("Only video files are allowed for demo");
    } else {
      const formData = new FormData();
      formData.append("title", projectPost.post_title);
      formData.append("post_type", projectPost.post_type);
      formData.append("post_body", projectPost.post_body);
      formData.append("tags", JSON.stringify(selectedTags));
      formData.append("demoFile", projectPost.demoFile);
      setLoading(true);
      try {
        const res = await fetch("http://localhost:5000/create_post", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const data = await res.json();

        if (res.ok) {
          setMsg(data.success);
          navigate(`/post/${data.post_id}`);
        } else {
          if (res.status === 500) {
            setMsg("Something went wrong. Please try again later.");
          }
          setMsg(data.error);
        }
      } catch (err) {
        console.error("Error:" + err.message);
        setError503(true);
        setMsg(
          "The service is temporariliy unavailable. Please try again later."
        );
      } finally {
        setLoading(false);
      }
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
          Category<span className="required"> *</span>
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
          tags={allowedTags}
          selectedTags={selectedTags}
          setSelectedTags={setSelectedTags}
          showDropdown={showDropdown}
          setShowDropdown={setShowDropdown}
        />
        <label>
          Title<span className="required"> *</span>
        </label>
        <textarea
          value={projectPost.post_title}
          onChange={handleChange}
          className="create-post-title"
          type="text"
          name="post_title"
          maxLength={limitedCharTitle}
        />
        <CharCount
          currentLength={projectPost.post_title.length}
          maxLength={limitedCharTitle}
        />
        <label>Body</label>
        <textarea
          value={projectPost.post_body}
          onChange={handleChange}
          className="create-post-body"
          type="text"
          name="post_body"
          maxLength={limitedCharBody}
        />
        <CharCount
          currentLength={projectPost.post_body.length}
          maxLength={limitedCharBody}
        />
        {projectPost.post_type === "project" && (
          <div className="create-post-files-links">
            <div className="demo-file-wrapper">
              <label>Demo </label>
              <label for="demo-file" className="custom-file-upload">
                Choose File
              </label>
              <div className="demo-file-name">{projectPost.demoFile.name}</div>
            </div>
            <input
              id="demo-file"
              onChange={handleChange}
              type="file"
              accept="video/*"
              name="demoFile"
            />
          </div>
        )}
        <button
          className="project-submit"
          disabled={!projectPost.post_type || !projectPost.post_title}
        >
          {loading ? <ViewMoreLoading /> : "Publish"}
        </button>
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

//Popup alert that warns the user that progress will not be saved when the user wants to exit
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

//Message showing that the post has been successfully posted
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
          <img className="success-logo" src="/images/success.svg" />
        </div>
        <h3>Your submission has been sent</h3>
      </div>
    </div>
  );
};

export default function CreatePost({ setClickCreatePost }) {
  const { token } = useContext(UserContext);
  const [msg, setMsg] = useState("");
  const { setError503 } = useContext(ErrorContext);

  return (
    <div>
      <div className="blur"></div>
      {msg !== "Your project has been posted" ? (
        <CreatePostForm
          token={token}
          msg={msg}
          setMsg={setMsg}
          setClickCreatePost={setClickCreatePost}
          setError503={setError503}
        />
      ) : (
        <PostedMessage setClickCreatePost={setClickCreatePost} />
      )}
    </div>
  );
}
