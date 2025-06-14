import React, { useEffect, useState } from 'react';
import Account from './Account'
import CreatePost from './CreatePost'
import '../styles/header.css';

export default function Header({  currentUser, setCurrentUser }){
  const [isScrolled, setIsScrolled] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [clickCreatePost, setClickCreatePost] = useState(false);

  //remove ability to scroll any content outside of the account component
  useEffect(() => {
    document.body.style.overflow = showLogin ? "hidden" : "auto";
  }, [showLogin])

  // turn the header's background color to black when page is being scrolled
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50){
        setIsScrolled(true)
      }
      else{
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <section className={`header ${isScrolled ? "scrolled" : ""}`}>
      <nav className="header-info">
        <a onClick={() => window.scrollTo({ top: 0, behavior: 'smooth'})}className="site-info">
          <h2 className="site-name">Codelings</h2>
        </a>
        <div className="header-buttons-wrapper">
          {!clickCreatePost && <a className="header-create-post-button" onClick={() => setClickCreatePost(true)}>Create Post</a>}
          {currentUser ? (<div>HELLO, {currentUser.username}</div>) : (<button className="header-login-button" onClick={() => setShowLogin(true)}>Log in</button>)}
        </div>
      </nav>
      {/* {currentUser && <PostProject currentUser={currentUser}/>} */}
      {clickCreatePost && <CreatePost setClickCreatePost={setClickCreatePost} currentUser={currentUser}/>}
      {showLogin ? <Account setShowLogin={setShowLogin} setCurrentUser={setCurrentUser}/> : null}
    </section>
  )
}