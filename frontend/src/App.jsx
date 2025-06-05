import { useState } from 'react'
import Header from './components/Header'
import Content from './components/Content'
import Account from './components/Account'
import './styles/App.css'

function App() {
  const [login, setLogin] = useState(false);

  return (
    <div>
      <Header setLogin={setLogin}/>
      <Content />
      {login ? <Account setLogin={setLogin}/> : null}
      {console.log(login)}
    </div>
  )
}

export default App
