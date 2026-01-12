import { useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import RegisterForm from "../components/RegisterForm";
import { REGISTER } from "../consts/Register";
import { useTheme } from '../contexts/ThemeContext';
import './styles/LoginPage.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();

  useEffect(() => {
    if (isDarkMode) {
      toggleTheme();
    }
    // eslint-disable-next-line
  }, []);

  const handleSuccess = () => {
    navigate("/dashboard");
  };

  return (
    <div className="container d-flex align-items-center justify-content-center" style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      <div className="google-card col-md-5 col-sm-10 text-center">
        <h1 className="mb-2" style={{ color: "#5f6368", fontSize: "24px" }}>Drive</h1>
        <h2 className="mb-4" style={{ fontSize: "22px", fontWeight: "400", color: "#202124" }}>{REGISTER.CREATE_ACCOUNT}</h2>

        <RegisterForm onRegisterSuccess={handleSuccess} />

        <p className="mt-4 text-center small text-muted">
          {REGISTER.ALREADY_HAVE_ACCOUNT}{" "}
          <Link to="/login" style={{ color: "#1a73e8", textDecoration: "none", fontWeight: "500" }}>
            {REGISTER.LOG_IN}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;