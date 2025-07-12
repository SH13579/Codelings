import React, { useState, useEffect, useContext } from "react";
import { useParams } from "react-router-dom";
import "../styles/profile.css";
import { fetchProfileInfo } from "./Profile";
import { UserContext } from "../utils";

async function handleEditProfile(e, token, profileInfo, setMsg) {
  e.preventDefault();
  try {
    const res = await fetch("http://localhost:5000/edit_profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        about_me: profileInfo.about_me,
        email: profileInfo.email,
        github_link: profileInfo.github_link,
        year_of_study: profileInfo.year_of_study,
        pfp: profileInfo.pfp,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setMsg(data.success);
    } else {
      setMsg(data.error);
    }
  } catch (err) {
    alert("Error: " + err.message);
  }
}

export default function EditProfile() {
  const { username } = useParams();
  const { token } = useContext(UserContext);
  const [profileInfo, setProfileInfo] = useState({
    about_me: "",
    email: "",
    github_link: "",
    pfp: null,
    year_of_study: "",
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [msg, setMsg] = useState(null);

  function handleChange(e) {
    if (e.target.name === "pfp") {
      const file = e.target.files[0];
      const reader = new FileReader();

      reader.onloadend = () => {
        setImagePreview(reader.result);
      };

      reader.readAsDataURL(file);
    }
    setProfileInfo((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  fetchProfileInfo(username, setProfileInfo);
  useEffect(() => {
    setImagePreview(profileInfo.pfp);
  }, [profileInfo.pfp]);

  useEffect(() => {
    console.log(imagePreview);
  }, [imagePreview]);

  useEffect(() => {
    console.log(profileInfo);
  }, [profileInfo]);

  return (
    <section className="edit-profile-wrap">
      <h2 className="edit-profile-header">Edit Profile</h2>
      <div className="edit-profile-sec">
        <div className="edit-pfp">
          <img className="profile-pfp" src={imagePreview} />
          <input
            className="edit-profile-pfp-file"
            type="file"
            accept="image/*"
            name="pfp"
            value={profileInfo.pfp}
            onChange={(e) => handleChange(e)}
          />
        </div>
        <form
          onSubmit={(e) => handleEditProfile(e, token, profileInfo, setMsg)}
          className="edit-profile-info"
        >
          {msg && <div className="edit-profile-msg">{msg}</div>}
          <span className="edit-profile-col">
            <label>About Me:</label>
            <textarea
              className="profile-about-box"
              name="about_me"
              value={profileInfo.about_me}
              onChange={(e) => handleChange(e)}
            />
          </span>
          <span className="edit-profile-col">
            <label>Email:</label>
            <input
              className="profile-email-box"
              type="email"
              value={profileInfo.email}
              name="email"
              onChange={(e) => handleChange(e)}
            />
          </span>
          <span className="edit-profile-col">
            <label>Github Link:</label>
            <input
              className="profile-github-box"
              name="github_link"
              type="text"
              value={profileInfo.github_link}
              onChange={(e) => handleChange(e)}
            />
          </span>
          <span className="edit-profile-col">
            <label>Year of Study:</label>
            <select
              value={profileInfo.year_of_study || "Select Year"}
              className="yos-dropdown"
              name="year_of_study"
              onChange={(e) => handleChange(e)}
            >
              <option value="" disabled hidden>
                Select Year
              </option>
              <option value="Freshman">Freshman</option>
              <option value="Sophomore">Sophomore</option>
              <option value="Junior">Junior</option>
              <option value="Senior">Senior</option>
              <option value="Graduate">Graduate</option>
              <option value="Alumni">Alumni</option>
            </select>
          </span>

          <button className="edit-profile-save" type="submit">
            Save Changes
          </button>
        </form>
      </div>
    </section>
  );
}
