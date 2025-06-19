import React, { useState, useEffect, useRef, useContext } from 'react';
import '../styles/account.css';
import '../styles/createpost.css';
import { useExitListener } from '../utils';
import { UserContext } from '../utils';

function LoginPage({ setLoginOrRegister, setShowLogin }){
  const [msg, setMsg] = useState([]);
  const loginRef = useRef(null);
  const { setIsLoggedIn } = useContext(UserContext);

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
        body: JSON.stringify(login),
      });

      const data = await res.json(); //frontend receives JSON object from backend

      if (res.ok){ //codes 200(ok), 201(created)
        setMsg(['success', 'Login successful!']);
        sessionStorage.setItem("token", data.token);
        setIsLoggedIn(true);
        setShowLogin(false);
      }
      else{ //!res.ok (Login unsuccessful)
        //codes 400(bad request), 401(invalid credentials), 409(conflict, info already taken), 500(server error)
        setMsg(['error', data.error]);
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
          <h2 className="form-title">Sign in</h2>
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
    confirmPassword: ""
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
      const res = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...register,
          confirm_password: register.confirmPassword //change to python format/rules
        }),
      });

      const data = await res.json(); //frontend receives JSON object from backend
      
      if (res.ok){
        setMsg(['success', 'Registration successful!']);
      }
      else{ //!res.ok (Registration unsuccessful)
        setMsg(['error', data.error]);
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
          <h2 className="form-title">Register</h2>
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

export default function Account({ setShowLogin }){
  const [loginOrRegister, setLoginOrRegister] = useState("login")
  return (
    loginOrRegister === "login" ? <LoginPage setShowLogin={setShowLogin} setLoginOrRegister={setLoginOrRegister}/> : <RegisterPage setShowLogin={setShowLogin} setLoginOrRegister={setLoginOrRegister}/>
  )
}