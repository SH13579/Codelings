import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Content from './components/Content';
import Post from './components/Post';
import Footer from './components/Footer';
import './styles/App.css';

function App() {
  const [login, setLogin] = useState(false);

  return (
    <div>
      <Header/>
      <Router>
        <Routes>
          <Route path="/" element={<Content />} />
          <Route path="/post" element={<Post />} />
        </Routes>
      </Router>
      <Footer />
    </div>
  )
}

export default App
