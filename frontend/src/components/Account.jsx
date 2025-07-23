import React, { useState, useEffect, useRef, useContext } from "react";
import "../styles/account.css";
import "../styles/createpost.css";
import { useNavigate } from "react-router-dom";
import { UserContext, useExitListener } from "../utils";

function LoginPage({ setLoginOrRegister, setShowLogin }) {
  const [msg, setMsg] = useState(null);
  const loginRef = useRef(null);
  const navigate = useNavigate();
  const { setCurrentUser } = useContext(UserContext);

  //click anywhere outside of the box and it will exit out
  useExitListener(setShowLogin, loginRef);

  const [login, setLogin] = useState({
    username: "",
    password: "",
  });

  const handleChange = (e) => {
    setLogin((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      if (!login.username || !login.password) {
        setMsg("Please fill in the blanks!");
        return;
      }
      const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(login),
      });

      const data = await res.json(); //frontend receives JSON object from backend

      if (res.ok) {
        //codes 200(ok), 201(created)
        sessionStorage.setItem("token", data.token);
        setShowLogin(false);
        navigate("/");
      } else {
        //codes 400(bad request), 401(invalid credentials), 409(conflict, info already taken), 500(server error)
        setMsg(data.error);
      }
    } catch (err) {
      alert("Error:" + err.message);
    }
  };

  return (
    <div>
      <div className="blur"></div>
      <div ref={loginRef} className="account-container">
        <button
          type="button"
          className="exit-button"
          onClick={() => {
            setShowLogin(false);
          }}
        >
          &times;
        </button>
        <form className="form-section" onSubmit={handleLogin}>
          <h2 className="form-title">Sign in</h2>
          {msg && <div className="error-message">{msg}</div>}
          <input
            type="text"
            name="username"
            value={login.username}
            onChange={handleChange}
            placeholder="Username"
          />
          <input
            type="password"
            name="password"
            value={login.password}
            onChange={handleChange}
            placeholder="Password"
          />
          <button type="submit" className="form-button">
            Login
          </button>
          <div className="alternative">
            <span>Don't have an account?</span>
            <span
              className="alternative-button"
              onClick={() => {
                setLoginOrRegister("register");
              }}
            >
              Register
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}

//RegisterForm is now a separete component for existing input to not be removed after an error (something with re-rendering issues)
//display the actual registration form
function RegisterForm({ msg, setMsg, setLoginOrRegister }) {
  const [register, setRegister] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const handleChange = (e) => {
    setRegister((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (
      !register.username ||
      !register.password ||
      !register.email ||
      !register.confirmPassword
    ) {
      setMsg("Please fill in the blanks!");
      return;
    } else if (register.password !== register.confirmPassword) {
      setMsg("Passwords do not match!");
      return;
    }
    try {
      const res = await fetch("http://localhost:5000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...register,
          confirm_password: register.confirmPassword, //change to python format/rules
        }),
      });

      const data = await res.json(); //frontend receives JSON object from backend

      if (res.ok) {
        setMsg("Registration successful!");
      } else {
        //!res.ok (Registration unsuccessful)
        setMsg(data.error);
      }
    } catch (err) {
      alert("Error:" + err.message);
    }
  };
  return (
    <form className="form-section" onSubmit={handleRegister}>
      <h2 className="form-title">Register</h2>
      {msg && <div className="error-message">{msg}</div>}
      <input
        type="text"
        name="username"
        value={register.username}
        onChange={handleChange}
        placeholder="Username"
      />
      <input
        type="email"
        name="email"
        value={register.email}
        onChange={handleChange}
        placeholder="Email"
      />
      <input
        type="password"
        name="password"
        value={register.password}
        onChange={handleChange}
        placeholder="Password"
      />
      <input
        type="password"
        name="confirmPassword"
        value={register.confirmPassword}
        onChange={handleChange}
        placeholder="Confirm Password"
      />
      <button type="submit" className="form-button">
        Register
      </button>
      <div className="alternative">
        <span>Already have an account?</span>
        <span
          className="alternative-button"
          onClick={() => {
            setLoginOrRegister("login");
          }}
        >
          Login
        </span>
      </div>
    </form>
  );
}

function RegisterPage({ setLoginOrRegister, setShowLogin }) {
  const [msg, setMsg] = useState(null);
  const registerRef = useRef(null);
  useExitListener(setShowLogin, registerRef);
  //display the actual registration form
  //RegisteredForm is now a function/component (located below)

  //display message after user successfully registers
  const RegisteredMsg = () => {
    return (
      <div className="register-success-wrapper">
        <div className="success-logo-wrapper">
          <img className="success-logo" src="/media/images/success.svg" />
        </div>
        <h2 className="register-success">Thank you for registering</h2>
        <button
          className="login-button"
          onClick={() => {
            setLoginOrRegister("login");
          }}
        >
          Sign in
        </button>
      </div>
    );
  };

  return (
    <div>
      <div className="blur"></div>
      <div ref={registerRef} className="account-container">
        <button
          type="button"
          className="exit-button"
          onClick={() => {
            setShowLogin(false);
          }}
        >
          &times;
        </button>
        {msg !== "Registration successful!" ? (
          // register, handleChange, handleRegister, msg, setLoginOrRegister
          <RegisterForm
            msg={msg}
            setMsg={setMsg}
            setLoginOrRegister={setLoginOrRegister}
          />
        ) : (
          <RegisteredMsg />
        )}
      </div>
    </div>
  );
}

export default function Account({ setShowLogin }) {
  const [loginOrRegister, setLoginOrRegister] = useState("login");
  console.log("Rendering account");
  return loginOrRegister === "login" ? (
    <LoginPage
      setShowLogin={setShowLogin}
      setLoginOrRegister={setLoginOrRegister}
    />
  ) : (
    <RegisterPage
      setShowLogin={setShowLogin}
      setLoginOrRegister={setLoginOrRegister}
    />
  );
}
