import React, { useState, useEffect, useRef } from 'react';
import '../styles/account.css';
import { useExitListener } from '../utils';

function LoginPage({ setLoginOrRegister, setShowLogin, setCurrentUser }){
  const [msg, setMsg] = useState([]);
  const loginRef = useRef(null);

  //click anywhere outside of the box and it will exit out
  useExitListener(setShowLogin, loginRef);

  const [login, setLogin] = useState({
    username: "",
    password: "",
  });

  const handleChange = (e) => {
    setLogin(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }
  
  const handleLogin = async(e) => {
    e.preventDefault();
    try{
      if (!login.username || !login.password){
        setMsg(['error', 'Please fill in the blanks!']);
        return;
      }
      const res = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: login.username, 
          password: login.password }),
      });

      const data = await res.json();

      if (res.ok){ //codes 200(ok), 201(created)
        setMsg(['success', 'Login successful!']);
        setCurrentUser({username: data.username})
        setShowLogin(false);
      }
      else{ //!res.ok (Login unsuccessful)
        //codes 400(bad request), 401(invalid credentials), 409(conflict, info already taken), 500(server error)
        setMsg(['error', 'Invalid username or password!']);
      }
    }
    catch (err){
      alert('Error:' + err.message)
    }
  }

  return (
    <div>
      <div className="blur"></div>
      <div ref={loginRef} className="account-container">
        <button className="exit-button" onClick={() => {
          setShowLogin(false)
        }}>&times;</button>
        <form className="form-section" onSubmit={handleLogin}>
          <h3 className="form-title">Sign In</h3>
          {msg[0] === 'success' ? <div className="success-message">{msg[1]}</div> : <div className="error-message">{msg[1]}</div>}
          <label>Username</label>
          <input type="text" name="username" value={login.username} onChange={handleChange} placeholder="Enter Username"/>
          {/* <label>Email</label>
          <input type="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter Email"/> */}
          <label>Password</label>
          <input type="password" name="password" value={login.password} onChange={handleChange} placeholder="Enter Password"/>
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

function RegisterPage({ setLoginOrRegister, setShowLogin }){
  const [msg, setMsg] = useState([]);
  const registerRef = useRef(null);
  useExitListener(setShowLogin, registerRef);

  const [register, setRegister] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    message: ""
  });

  const handleChange = (e) => {
    setRegister(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleRegister = async(e) => {
    e.preventDefault();
    try{
      if (!register.username || !register.password || !register.email || !register.confirmPassword){
        setMsg(['error', 'Please fill in the blanks!'])
        return;
      }
      else if (register.password != register.confirmPassword){
          setMsg(['error', 'Passwords do not match!']);
          return;
      }
      const res = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: register.username, 
          email: register.email, 
          password: register.password, 
          confirm_password: register.confirmPassword }),
      });

      const data = await res.json();

      if (res.ok){
        setMsg(['success', 'Registration successful!']);
      }
      else{ //!res.ok (Registration unsuccessful)
        if (data.error === 'Username is taken'){
          setMsg(['error', 'Username is taken']);
        }
        if (data.error === 'Email is taken'){
          setMsg(['error', 'Email is taken!']);
        }
        // else{
        //   alert('Error: ' + data.error);
        // }
      }
    } catch (err){
      alert('Error:' + err.message)
    }
  }

  return (
    <div>
      <div className="blur"></div>
      <div ref={registerRef} className="account-container">
        <button className="exit-button" onClick={() => {
          setShowLogin(false)
        }}>&times;</button>
        <form className="form-section" onSubmit={handleRegister}>
          <h3 className="form-title">Register</h3>
          {msg[0] === 'success' ? <div className="success-message">{msg[1]}</div> : <div className="error-message">{msg[1]}</div>}
          <label>Username</label>
          <input type="text" name="username" value={register.username} onChange={handleChange} placeholder="Enter Username"/>
          <label>Email</label>
          <input type="email" name="email" value={register.email} onChange={handleChange} placeholder="Enter Email"/>
          <label>Password</label>
          <input type="password" name="password" value={register.password} onChange={handleChange} placeholder="Enter Password"/>
          <label>Confirm Password</label>
          <input type="password" name="confirmPassword" value={register.confirmPassword} onChange={handleChange} placeholder="Re-Enter Password"/>
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

export default function Account({ setShowLogin, setCurrentUser }){
  const [loginOrRegister, setLoginOrRegister] = useState("login")
  return (
    loginOrRegister === "login" ? <LoginPage setShowLogin={setShowLogin} setLoginOrRegister={setLoginOrRegister} setCurrentUser={setCurrentUser}/> : <RegisterPage setShowLogin={setShowLogin} setLoginOrRegister={setLoginOrRegister}/>
  )
}