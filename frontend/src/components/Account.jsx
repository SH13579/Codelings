import React, { useState, useEffect, useRef } from 'react';
import '../styles/account.css';
import { useExitListener } from '../utils';

function LoginPage({ setLoginOrRegister, setLogin }){
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState(''); //maybe unnecessary
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState(''); //message when registration is successful
  const loginRef = useRef(null);

  useExitListener(setLogin, loginRef);

  const handleLogin = async(e) => {
    e.preventDefault();
    try{
      if (!username || !password){
        setError('Please fill in the blanks!');
        setMsg('')
        return;
      }
      const res = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok){ //codes 200(ok), 201(created)
        setMsg('Login successful!');
        setError('');
      }
      else{ //!res.ok (Login unsuccessful)
        //codes 400(bad request), 401(invalid credentials), 409(conflict, info already taken), 500(server error)
        setError('Invalid username or password!');
        setMsg('')
      }
    }
    catch (err){
      alert('Error:', err)
    }
  }

  return (
    <div>
      <div className="blur"></div>
      <div ref={loginRef} className="account-container">
        <button className="exit-button" onClick={() => {
          setLogin(false)
        }}>&times;</button>
        <form className="form-section" onSubmit={handleLogin}>
          <h3 className="form-title">Sign In</h3>
          {msg && <p className="success-message">{msg}</p>}
          {error && <p className="error-message">{error}</p>}
          <label>Username</label>
          <input type="text" name="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter Username"/>
          {/* <label>Email</label>
          <input type="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter Email"/> */}
          <label>Password</label>
          <input type="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter Password"/>
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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState(''); //message when registration is successful
  const registerRef = useRef(null);

  useExitListener(setLogin, registerRef);

  const handleRegister = async(e) => {
    e.preventDefault();
    try{
      if (!username || !password || !email){
        setError('Please fill in the blanks!!')
        setMsg('');
        return;
      }
      else if (password != confirmPassword){
          setError('Passwords do not match!');
          setMsg('');
          return;
      }
      const res = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();

      if (res.ok){
        setMsg('Registration successful!');
        setError('');
      }
      else{ //!res.ok (Registration unsuccessful)
        if (data.error === 'Username is taken'){
          setError('Username is taken!');
          setMsg('') //reset successful message
        }
        if (data.error === 'Email is taken'){
          setError('Email is taken!');
          setMsg('') //reset successful message
        }
        // else{
        //   alert('Error: ' + data.error);
        // }
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
          {msg && <p className="success-message">{msg}</p>}
          {error && <p className="error-message">{error}</p>}
          <label>Username</label>
          <input type="text" name="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter Username"/>
          <label>Email</label>
          <input type="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter Email"/>
          <label>Password</label>
          <input type="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter Password"/>
          <label>Confirm Password</label>
          <input type="password" name="conf-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-Enter Password"/>
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