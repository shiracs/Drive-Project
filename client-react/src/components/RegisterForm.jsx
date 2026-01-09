import { useState } from "react";
import { REGISTER } from "../consts/Register";
import { USER_API_URL } from "../consts/Urls";
import { getTokenHeader, saveAuthData } from "../utils/auth";
import FileUploader from "../components/FileUploader";
import { FILE } from "../consts/FilePage";
import "../App.css";

const RegisterForm = ({ onRegisterSuccess }) => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    passwordConfirm: "",
    fullName: "",
    profilePic: "",
  });
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  const handleFileChange = (fileData) => {
    setFormData((prev) => ({ ...prev, profilePic: fileData.base64 }));
    setFileName(fileData.name);
  };

  const openImageInNewTab = () => {
    const newTab = window.open();
    newTab.document.write(`<img src="${formData.profilePic}" style="max-width:100%" />`);
  };

  const validatePasswords = () => { 
    const lengthOK = formData.password.length >= 8 && formData.password.length <= 16; 
    const hasLetter = /\p{L}/u.test(formData.password); 
    const hasNumber = /[0-9]/.test(formData.password); 
    
    if (!lengthOK || !hasLetter || !hasNumber) { 
      setError(REGISTER.ERROR_NOT_STRONG_PASSWORD); 
      return false; 
    }
    
    if (formData.password !== formData.passwordConfirm) { 
      setError(REGISTER.ERROR_PASSWORD_MISMATCH); 
      return false; 
    }
    setError("");
    return true;
  }

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validatePasswords()) {
    return;
  }
  try {
    const response = await fetch(USER_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (response.ok) {
      saveAuthData();
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
      <div className="mb-3">
        <input
          name="passwordConfirm"
          type="password"
          placeholder={REGISTER.PASSWORD_CONFIRM}
          className="form-control google-input no-reveal"
          onChange={handleChange}
          required
        />
      </div>
      <div className="mb-4">
        <FileUploader
          label={REGISTER.UPLOAD_PROFILE_PIC}
          accept="image/*"
          onFileSelected={handleFileChange}
        />
        {fileName && (
          <span 
            onClick={openImageInNewTab} 
            style={{ color: '#1a73e8', cursor: 'pointer', textDecoration: 'underline', fontSize: '14px' }}
          >
            {fileName}
          </span>
        )}
      </div>
      <button type="submit" className="google-btn w-100">
        {REGISTER.SIGN_IN}
      </button>
      {error && <div className="text-danger mt-3 text-center small">{error}</div>}
    </form>
  );
};

export default RegisterForm;