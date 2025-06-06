import React, { useEffect, useState } from 'react';
import Account from './Account'
import '../styles/header.css';

export default function Header(){
  const [isScrolled, setIsScrolled] = useState(false);
  const [login, setLogin] = useState(false);

  useEffect(() => {
    document.body.style.overflow = login ? "hidden" : "auto";
  }, [login])

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
    <section>
      <header className={`header ${isScrolled ? "scrolled" : ""}`}>
        <a className="header-buttons">IMG</a>
        <form className="search-wrapper" action="/search" method="GET">
          <input className="search-bar" type="search" placeholder="Search for a specific topic..."/>
        </form>
        <a onClick={() => {
          setLogin(true)
        }} className="header-buttons">SIGN IN</a>
      </header>
      {login ? <Account setLogin={setLogin}/> : null}
    </section>
  )
}