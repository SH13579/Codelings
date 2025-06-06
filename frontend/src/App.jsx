import { useState } from 'react'
import Header from './components/Header'
import Content from './components/Content'
import Footer from './components/Footer'
import './styles/App.css'

function App() {
  const [login, setLogin] = useState(false);

  return (
    <div>
      <Header/>
      <Content />
      <Footer />
    </div>
  )
}

export default App
