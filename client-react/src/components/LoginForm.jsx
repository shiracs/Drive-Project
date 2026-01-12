import { useState } from "react";
import { LOGIN_API_URL } from "../consts/Urls";
import { LOG_IN } from "../consts/Login";
import { saveAuthData } from "../utils/auth";
import './styles/LoginForm.css';

const LoginForm = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await fetch(LOGIN_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        saveAuthData(data.token, data.username, data.id, data.profilePic);
        onLoginSuccess();
      } else {
        setError(data.error || LOG_IN.LOG_IN_FAIL);
      }
    } catch (err) {
      setError(LOG_IN.NETWORK_ERROR);
    }
  };

  return (
    <form onSubmit={handleSubmit} dir="rtl">
      <div className="mb-4">
        <input
          name="username"
          placeholder={LOG_IN.USERNAME}
          className="form-control google-input"
          onChange={handleChange}
          required
        />
      </div>
      <div className="mb-4">
        <input
          name="password"
          type="password"
          placeholder={LOG_IN.PASSWORD}
          className="form-control google-input"
          onChange={handleChange}
          required
        />
      </div>
      <button type="submit" className="google-btn w-100 mt-2">
        {LOG_IN.SUBMIT_BUTTON}
      </button>
      {error && (
        <div className="text-danger mt-3 text-center small">{error}</div>
      )}
    </form>
  );
};

export default LoginForm;
