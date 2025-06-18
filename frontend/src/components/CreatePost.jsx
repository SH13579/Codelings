import React, { useState, useRef, useContext } from 'react';;
import { useExitListener } from '../utils';
import { UserContext } from '../utils';

export default function CreatePost({ setClickCreatePost }){
  const { currentUser } = useContext(UserContext);
  const [projectPost, setProjectPost] = useState({
    post_date: "",
    post_type: "",
    user_name: "", 
    post_title: "",
    post_description: "",
    post_body: "",
    video_file_path: ""
  });
  const [msg, setMsg] = useState("");

  //set the states of all form values
  const handleChange = (e) => {
    setProjectPost(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };
  
  //handles submitting the post
  const handleSubmit = async(e) => {
    e.preventDefault();
    // setProjectPost(prev => ({
    //   ...prev,
    //   post_date: dayjs().format('YYYY-MM-DD HH:mm:ss')
    // }));
    Object.keys(projectPost).forEach(key => {
      console.log(`${key}: ${projectPost[key]}`);
    });
    try{
      const res = await fetch('http://localhost:5000/post_project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
          user_name: projectPost.user_name
        }),
      });

      const data = await res.json();

      if(res.ok){
        setMsg(data.success);
      }
      else{
        setMsg(data.error);
      }
    } catch(err){
      alert('Error:' + err.message)
    }
  };

  return (
    <>
      <div className="blur"></div>
      <form onSubmit={handleSubmit} className="post-project">
        <button className="exit-button" onClick={() => {
          setClickCreatePost(false)
        }}>&times;</button>
        <h2 className="create-post">Create Post</h2>
        <div className="post-error">{msg}</div>
        <label>Select type of post<span className="required"> *</span></label>
        <select className="create-post-select" name="post_type">
          <option disabled selected hidden>Select</option>
          <option>Project</option>
          <option>Q and A</option>
        </select>
        <label>Title<span className="required"> *</span></label>
        <input value={projectPost.post_title} onChange={handleChange} className="create-post-title" type="text" name="post_title"/>
        <label>Description<span className="required"> *</span></label>
        <textarea value={projectPost.description} onChange={handleChange} className="create-post-description" type="text" name="post_description"/>
        <label>Body</label>
        <textarea value={projectPost.post_body} onChange={handleChange} className="create-post-body" type="text" name="post_body"/>
        <div className="post-project-last">
          <div className="">
            <label>Demo(mp4 only): </label>
            <input onChange={handleChange} type="file" accept=".mp4" name="video_file_path"/>
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