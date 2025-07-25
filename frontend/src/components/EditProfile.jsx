import React, { useState, useEffect, useContext } from "react";
import "../styles/profile.css";
import { useFetchProfileInfo } from "./Profile";
import { UserContext } from "../utils";
import Loading from "./Loading";
import CharCount from "./CharCount";
import { ViewMoreLoading } from "./Loading";

async function handleEditProfile(
  e,
  token,
  profileInfo,
  setProfileInfo,
  setMsg,
  currentUser,
  setCurrentUser,
  setEditProfileLoading
) {
  e.preventDefault();
  setEditProfileLoading(true);
  if (profileInfo.about_me.length > 1000) {
    setMsg("About Me section cannot be over 1000 characters");
  } else if (
    profileInfo.pfpFile &&
    !profileInfo.pfpFile.type.startsWith("image/")
  ) {
    setMsg("Only image files are allowed for profile picture");
  } else if (
    profileInfo.pfpFile &&
    profileInfo.pfpFile.size / (1024 * 1024) > 2.5
  ) {
    setMsg("Profile picture cannot exceed 2.5 MB");
  } else if (
    profileInfo.github_link &&
    !profileInfo.github_link.startsWith("https://github.com/")
  ) {
    setMsg(
      'Invalid Github link, make sure it starts with "https://github.com/..."'
    );
  } else {
    const formData = new FormData();
    formData.append("about_me", profileInfo.about_me);
    formData.append("email", profileInfo.email);
    formData.append("github_link", profileInfo.github_link);
    formData.append("year_of_study", profileInfo.year_of_study);
    formData.append("pfp", profileInfo.pfp);
    formData.append("pfpFile", profileInfo.pfpFile);
    try {
      const res = await fetch("http://localhost:5000/edit_profile", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setMsg(data.success);
        //if user selected a new file for the profile picture, reset the cached user info in session storage
        if (profileInfo.pfpFile) {
          const newInfo = {
            username: currentUser.username,
            pfp: data.pfp_url,
          };
          setCurrentUser(newInfo);
          sessionStorage.setItem("currentUser", JSON.stringify(newInfo));
          setProfileInfo((prev) => ({
            ...prev,
            pfp: data.pfp_url,
          }));
        }
      } else {
        setMsg(data.error);
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setEditProfileLoading(false);
    }
  }
}

export default function EditProfile() {
  const { token, setShowLogin, currentUser, setCurrentUser } =
    useContext(UserContext);
  if (!token) {
    setShowLogin(true);
    return;
  }
  const [msg, setMsg] = useState(null);
  const [profileInfo, setProfileInfo] = useState({
    about_me: "",
    email: "",
    github_link: "",
    pfp: "",
    year_of_study: null,
    pfpFile: null,
  });
  const [profileLoading, setProfileLoading] = useState(true);
  // const username = JSON.parse(sessionStorage.getItem("currentUser")).username;
  const [imagePreview, setImagePreview] = useState(null);
  const maxAboutMeLength = 1000;
  const [editProfileLoading, setEditProfileLoading] = useState(false);

  useEffect(() => {
    console.log(profileInfo);
  }, [profileInfo]);

  //fetch all the details for the profile of the current user
  useFetchProfileInfo(currentUser.username, setProfileInfo, setProfileLoading);

  function handleChange(e) {
    if (e.target.name === "pfp") {
      const file = e.target.files[0];
      if (!file.type.startsWith("image/")) {
        setMsg("Only image files are allowed for profile picture");
      } else {
        const reader = new FileReader();

        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      }
      setProfileInfo((prev) => ({
        ...prev,
        pfpFile: file,
      }));
    } else {
      setProfileInfo((prev) => ({
        ...prev,
        [e.target.name]: e.target.value,
      }));
    }
  }

  return profileLoading ? (
    <Loading />
  ) : (
    token && (
      <section className="edit-profile-wrap">
        <h2 className="edit-profile-header">Edit Profile</h2>
        <div className="edit-profile-sec">
          <div className="edit-pfp">
            <img
              className="profile-pfp"
              src={imagePreview || profileInfo.pfp}
            />
            <input
              className="edit-profile-pfp-file"
              type="file"
              accept="image/*"
              name="pfp"
              onChange={(e) => handleChange(e)}
            />
          </div>
          <form
            onSubmit={(e) =>
              handleEditProfile(
                e,
                token,
                profileInfo,
                setProfileInfo,
                setMsg,
                currentUser,
                setCurrentUser,
                setEditProfileLoading
              )
            }
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
                maxLength={maxAboutMeLength}
              />
              <CharCount
                currentLength={profileInfo.about_me.length}
                maxLength={maxAboutMeLength}
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
                value={profileInfo.year_of_study}
                className="yos-dropdown"
                name="year_of_study"
                onChange={(e) => handleChange(e)}
              >
                <option value="" disabled hidden></option>
                <option value="Freshman">Freshman</option>
                <option value="Sophomore">Sophomore</option>
                <option value="Junior">Junior</option>
                <option value="Senior">Senior</option>
                <option value="Graduate">Graduate</option>
                <option value="Alumni">Alumni</option>
              </select>
            </span>

            <button className="edit-profile-save" type="submit">
              {editProfileLoading ? <ViewMoreLoading /> : "Save Changes"}
            </button>
          </form>
        </div>
      </section>
    )
  );
}
