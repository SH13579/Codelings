import React, { useState, useRef, useContext } from "react";
import { useExitListener, useExitListenerWithAlert } from "../utils";
import { UserContext } from "../utils";
import { useNavigate } from "react-router-dom";

export default function CreatePost({ setClickCreatePost }) {
  const { currentUser, userCreatedPost, setUserCreatedPost } =
    useContext(UserContext);
  const [alertMsg, setAlertMsg] = useState(null);
  const [msg, setMsg] = useState("");
  const postFormRef = useRef(null);
  const postMsgRef = useRef(null);
  const navigate = useNavigate();

  useExitListenerWithAlert(setAlertMsg, postFormRef);
  useExitListener(setClickCreatePost, postMsgRef);

  console.log("Rendering Create Post");

  const CreatePostForm = () => {
    const [projectPost, setProjectPost] = useState({
      post_date: "",
      post_type: "",
      user_name: "",
      post_title: "",
      post_description: "",
      post_body: "",
      video_file_path: "",
    });
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
      // setProjectPost(prev => ({
      //   ...prev,
      //   post_date: dayjs().format('YYYY-MM-DD HH:mm:ss')
      // }));
      Object.keys(projectPost).forEach((key) => {
        console.log(`${key}: ${projectPost[key]}`);
      });
      try {
        const res = await fetch("http://localhost:5000/post_project", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
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
            user_name: currentUser.username, //replaced projectPost.user_name
          }),
        });

        const data = await res.json();

        if (res.ok) {
          setMsg(data.success);
          setUserCreatedPost(true);
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
      </div>
    );
  };

  const PostedMessage = () => {
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
          <h2>Your submission has been sent</h2>
          <button
            className="login-button"
            onClick={() => {
              setLoginOrRegister("login");
            }}
          >
            View Post
          </button>
        </div>
      </div>
    );
  };

  const AlertMsg = () => {
    return (
      <div>
        <div className="blocking-div"></div>
        <div className="popup-wrapper">
          <div className="popup">
            <h2>Are you sure you want to quit?</h2>
            <h3>Your post will not be saved</h3>
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

  return (
    <div>
      <div className="blur"></div>
      {msg !== "Your project has been posted" ? (
        <CreatePostForm />
      ) : (
        <PostedMessage />
      )}
      {alertMsg && <AlertMsg />}
    </div>
  );
}
