import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Content from './components/Content';
import Post from './components/Post';
import Footer from './components/Footer';
import { UserContext } from './utils';
import './styles/App.css';

function App() {
  const token = sessionStorage.getItem('token');
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(token ? true : false);

  useEffect(() => {
    console.log(currentUser);
  }, [currentUser]);
  
  useEffect(() => {
    if (!isLoggedIn){
      return;
    }
    const controller = new AbortController();
    const signal = controller.signal;

    const getCurrentUser = async() => {
      try{
        const res = await fetch('http://localhost:5000/fetch_profile', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}` 
          },
          signal: signal,
        });

        const data = await res.json();

        if (res.ok){
          setIsLoggedIn(true);
          setCurrentUser({
            'username': data.username,
            'email': data.email,
            'pfp': data.pfp
          })
        }
        else{ 
          sessionStorage.removeItem('token');
          setCurrentUser(null);
          setIsLoggedIn(false);
        }
      }
      catch (err){
        if (err.name !== 'AbortError') {
          alert('Error: ' + err.message);
          sessionStorage.removeItem('token');
          setCurrentUser(null);
          setIsLoggedIn(false);
        }
      }
    };

    getCurrentUser();

    return () => controller.abort();
  }, [isLoggedIn]);

  return (
    <div>
      <UserContext.Provider value={{ currentUser, setCurrentUser, isLoggedIn, setIsLoggedIn }}>
        <Header currentUser={currentUser}/>
        <Router>
          <Routes>
            <Route path="/" element={<Content/>} />
            <Route path="/post" element={<Post />} />
          </Routes>
        </Router>
      </UserContext.Provider>
      <Footer />
    </div>
  )
}

export default App
