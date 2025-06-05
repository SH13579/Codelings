import React, { useState} from 'react';
import '../styles/account.css'

function LoginPage({ setLoginOrRegister, setLogin }){
  return (
    <div>
      <div className="blur"></div>
      <div className="account-container">
        <button onClick={() => {
          setLogin(false)
        }}>X</button>
        <label>Username</label>
        <input type="text" name="username" placeholder="Enter Username"/>
        <label>Password</label>
        <input type="password" name="password" placeholder="Enter Password"/>
        <button>Login</button>
        <button onClick={() => {
          setLoginOrRegister("register")
        }}>Don't Have An Account? Register</button>
      </div>
    </div>
  )
}

function RegisterPage({ setLoginOrRegister, setLogin }){
  return (
    <form action="register">
      <div className="blur"></div>
      <div className="account-container">
        <button onClick={() => {
          setLogin(false)
        }}>X</button>
        <label>Username</label>
        <input type="text" name="username" placeholder="Enter Username"/>
        <label>Password</label>
        <input type="password" name="password" placeholder="Enter Password"/>
        {/* <label>Confirm Password</label>
        <input type="text" name="conf-password" placeholder="Re-Enter Password"/> */}
        <button>Register</button>
        <button onClick={() => {
          setLoginOrRegister("login")
        }}>Already Have An Account? Login</button>
      </div>
    </form>
  )
}

export default function Account({ setLogin }){
  const [loginOrRegister, setLoginOrRegister] = useState("login")
  return (
    loginOrRegister === "login" ? <LoginPage setLogin={setLogin} setLoginOrRegister={setLoginOrRegister}/> : <RegisterPage setLogin={setLogin} setLoginOrRegister={setLoginOrRegister}/>
  )
}