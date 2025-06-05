import { useState } from 'react'
import Header from './components/Header'
import Content from './components/Content'
import './styles/App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <Header />
      <Content />
    </div>
  )
}

export default App
