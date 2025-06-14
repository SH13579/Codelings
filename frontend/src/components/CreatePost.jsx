import React, { useState, useRef } from 'react';
import { useExitListener } from '../utils';

export default function CreatePost({ currentUser, setClickCreatePost }){
  const [projectPost, setProjectPost] = useState({
    post_title: "",
    post_date: "",
    post_description: "",
    video_file_name: "",
    user_name: currentUser
  });
  const [msg, setMsg] = useState("");
  const createPostRef = useRef(null);

  useExitListener(setClickCreatePost, createPostRef);

  const handleChange = (e) => {
    setProjectPost(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handlePost = async(e) => {
    e.preventDefault();
    const currentDate = new Date();
    setProjectPost(prev => ({
      ...prev,
      post_date: currentDate
    }));
    
    if(!projectPost.post_title){
      setMsg("Title cannot be empty");
    }
    else if(projectPost.post_title.length > 50){
      setMsg("Title cannot be over 50 characters"); 
    }
    else if(projectPost.post_description.length > 3000){
      setMsg("Description cannot be over 3000 characters");
    }
    else{
      setMsg("Post submitted");
    }
  };

  return (
    <>
      <div className="blur"></div>
      <form ref={createPostRef} onSubmit={handlePost} className="post-project">
        <button className="exit-button" onClick={() => {
          setClickCreatePost(false)
        }}>&times;</button>
        <h2 className="create-post">Create Post</h2>
        <div className="post-error">{msg}</div>
        <label>Title<span className="required">*</span></label>
        <input value={projectPost.post_title} onChange={handleChange} className="post-title" type="text" name="post_title"/>
        <label>Description</label>
        <textarea value={projectPost.description} onChange={handleChange} className="post-description" type="text" name="post_description"/>
        <div className="post-project-last">
          <div className="">
            <label>Demo(mp4 only): </label>
            <input onChange={handleChange} type="file" accept=".mp4" name="video_file_name"/>
            <div>OR</div>
            <div>Link: 
              
            </div>
          </div>
          <div >
            <button className="project-submit">Post</button>
          </div>
        </div>
      </form>
    </>
  )
}