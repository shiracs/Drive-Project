import { useState } from "react";
import { REGISTER } from "../consts/Register";
import { USER_API_URL } from "../consts/Urls";

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

      if (response.ok) {
        onRegisterSuccess();
      } else {
        const data = await response.json();
        setError(data.error || "Registration failed");
      }
    } catch (err) {
      setError("Connection error to server");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 border rounded bg-light">
      <div className="mb-3">
        <input
          name="username"
          placeholder="Username"
          className="form-control"
          onChange={handleChange}
          required
        />
      </div>
      <div className="mb-3">
        <input
          name="password"
          type="password"
          placeholder="Password"
          className="form-control"
          onChange={handleChange}
          required
        />
      </div>
      <div className="mb-3">
        <input
          name="fullName"
          placeholder="Full Name"
          className="form-control"
          onChange={handleChange}
          required
        />
      </div>
      <div className="mb-3">
        <input
          name="profilePic"
          placeholder="Profile Picture URL"
          className="form-control"
          onChange={handleChange}
          required
        />
      </div>
      <button type="submit" className="btn btn-primary w-100">
        {REGISTER.SIGN_IN}
      </button>
      {error && <div className="text-danger mt-2 text-center">{error}</div>}
    </form>
  );
};

export default RegisterForm;
