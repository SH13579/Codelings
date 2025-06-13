import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Content from './components/Content';
import Post from './components/Post';
import Footer from './components/Footer';
import './styles/App.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  return (
    <div>
      <Header currentUser={currentUser} setCurrentUser={setCurrentUser}/>
      <Router>
        <Routes>
          <Route path="/" element={<Content currentUser={currentUser}/>} />
          <Route path="/post" element={<Post />} />
        </Routes>
      </Router>
      <Footer />
    </div>
  )
}

export default App
