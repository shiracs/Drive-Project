import { useState } from "react";
import { REGISTER } from "../consts/Register";
import { USER_API_URL } from "../consts/Urls";
import "../App.css";

const RegisterForm = ({ onRegisterSuccess }) => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    fullName: "",
    profilePic: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  try {
    const response = await fetch(USER_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (response.ok) {
      // save token and username to localStorage
      localStorage.setItem("userToken", data.id);
      localStorage.setItem("username", data.username);
      onRegisterSuccess(); 
    } else {
      setError(data.error || "Registration failed");
    }
  } catch (err) {
    setError("Connection error to server");
  }
};

  return (
    <form onSubmit={handleSubmit} dir="rtl">
      <div className="mb-3">
        <input
          name="fullName"
          placeholder={REGISTER.FULL_NAME}
          className="form-control google-input"
          onChange={handleChange}
          required
        />
      </div>
      <div className="mb-3">
        <input
          name="username"
          placeholder={REGISTER.USERNAME}
          className="form-control google-input"
          onChange={handleChange}
          required
        />
      </div>
      <div className="mb-3">
        <input
          name="password"
          type="password"
          placeholder={REGISTER.PASSWORD}
          className="form-control google-input"
          onChange={handleChange}
          required
        />
      </div>
      <div className="mb-4">
        <input
          name="profilePic"
          placeholder={REGISTER.PROFILE_PIC}
          className="form-control google-input"
          onChange={handleChange}
          required
        />
      </div>
      <button type="submit" className="google-btn w-100">
        {REGISTER.SIGN_IN}
      </button>
      {error && <div className="text-danger mt-3 text-center small">{error}</div>}
    </form>
  );
};

export default RegisterForm;