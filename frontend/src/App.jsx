import { useState } from 'react';
import Header from './components/Header';
import Projects from './components/Projects';
import Footer from './components/Footer';
import './styles/App.css';

function App() {
  const [login, setLogin] = useState(false);

  return (
    <div>
      <Header/>
      <Projects />
      <Footer />
    </div>
  )
}

export default App
