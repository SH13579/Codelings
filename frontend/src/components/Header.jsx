import React, { useEffect, useState } from 'react';
import Account from './Account'
import '../styles/header.css';

export default function Header(){
  const [isScrolled, setIsScrolled] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

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
      <header className="header-info">
        <a className="header-buttons">
          <img className="site-logo" src="../media/images/logo.svg"/>
        </a>
        <form className="search-wrapper" action="/search" method="GET">
          <input className="search-bar" type="search" placeholder="Search for a specific topic..."/>
        </form>
        {/* loggedIn ? (
          <a className="header-buttons">WASSUP,</a>
        ) */}
        <div onClick={() => {
          setShowLogin(true)
        }} className="header-buttons">SIGN IN</div>
      </header>
      {showLogin ? <Account setShowLogin={setShowLogin}/> : null}
    </section>
  )
}