import React, { useEffect, useState, useContext } from 'react';
import Account from './Account'
import CreatePost from './CreatePost'
import '../styles/header.css';
import { UserContext } from '../utils';

export default function Header(){
  const { currentUser, isLoggedIn } = useContext(UserContext)
  const [isScrolled, setIsScrolled] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [clickCreatePost, setClickCreatePost] = useState(false);

  //remove ability to scroll any content outside of the account component
  useEffect(() => {
    document.body.style.overflow = (showLogin || clickCreatePost) ? "hidden" : "auto";
  }, [showLogin, clickCreatePost])

  // turn the header's border to visible when the page is being scrolled
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

  function checkLoggedIn(){
    isLoggedIn ? setClickCreatePost(true) : setShowLogin(true);
  }

  return (
    <section className={`header ${isScrolled ? "scrolled" : ""}`}>
      <nav className="header-info">
        <a onClick={() => window.scrollTo({ top: 0, behavior: 'smooth'})}className="site-info">
          <img className="site-logo" src="../media/images/site-logo.svg"/>
          <h2 className="site-name">Codelings</h2>
        </a>
        <div className="header-buttons-wrapper">
          <a className="header-create-post-button" onClick={checkLoggedIn}>Create Post</a>
          {isLoggedIn ? (<img className="header-pfp" src={currentUser ? currentUser.pfp : "../media/images/doggy.png"}/>) : (<button className="header-login-button" onClick={() => setShowLogin(true)}>Log in</button>)}
        </div>
      </nav>
      {clickCreatePost && <CreatePost setClickCreatePost={setClickCreatePost}/>}
      {showLogin && <Account setShowLogin={setShowLogin}/>}
    </section>
  )
}