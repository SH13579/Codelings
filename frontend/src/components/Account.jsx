import React, { useState, useEffect, useRef } from 'react';
import '../styles/account.css';
import { useExitListener } from '../utils';

function LoginPage({ setLoginOrRegister, setLogin }){
  const loginRef = useRef(null);

  useExitListener(setLogin, loginRef);

  return (
    <div>
      <div className="blur"></div>
      <div ref={loginRef} className="account-container">
        <button className="exit-button" onClick={() => {
          setLogin(false)
        }}>&times;</button>
        <form className="form-section">
          <h3 className="form-title">Sign In</h3>
          <label>Username</label>
          <input type="text" name="username" placeholder="Enter Username"/>
          <label>Password</label>
          <input type="password" name="password" placeholder="Enter Password"/>
          <button className="login-button">Login</button>
          <center>Don't Have An Account? </center>
          <button className="register-button" onClick={() => {
            setLoginOrRegister("register")
          }}>Register</button>
        </form>
      </div>
    </div>
  )
}

function RegisterPage({ setLoginOrRegister, setLogin }){
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const registerRef = useRef(null);

  useExitListener(setLogin, registerRef);

  const handleRegister = async(e) => {
    e.preventDefault();
    try{
      if (!username || !password || !email){
        alert('Do not leave blanks')
        return;
      }
      const res = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok){
        alert('Registration successful');
      }
      else{
        if (data.error === 'Username already exists') {
          alert('Error: Username exists')
        }
        else {
          alert('Error: ' + data.error);
        }
      }
    } catch (err){
      alert('Error:', err)
    }
  }

  return (
    <div>
      <div className="blur"></div>
      <div ref={registerRef} className="account-container">
        <button className="exit-button" onClick={() => {
          setLogin(false)
        }}>&times;</button>
        <form className="form-section" onSubmit={handleRegister}>
          <h3 className="form-title">Register</h3>
          <label>Username</label>
          <input type="text" name="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter Username"/>
          <label>Email</label>
          <input type="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter Email"/>
          <label>Password</label>
          <input type="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter Password"/>
          {/* <label>Confirm Password</label>
          <input type="text" name="conf-password" placeholder="Re-Enter Password"/> */}
          <button className="register-button">Register</button>
          <center>Already Have An Account?</center>
          <button className="login-button" onClick={() => {
            setLoginOrRegister("login")
          }}>Login</button>
        </form>
      </div>
    </div>
  )
}

export default function Account({ setLogin }){
  const [loginOrRegister, setLoginOrRegister] = useState("login")
  return (
    loginOrRegister === "login" ? <LoginPage setLogin={setLogin} setLoginOrRegister={setLoginOrRegister}/> : <RegisterPage setLogin={setLogin} setLoginOrRegister={setLoginOrRegister}/>
  )
}