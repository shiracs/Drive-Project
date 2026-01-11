import { useNavigate, Link } from "react-router-dom";
import LoginForm from "../components/LoginForm";
import { REGISTER } from "../consts/Register";
import { LOG_IN } from "../consts/Login";
import './styles/LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate("/dashboard");
  };

  return (
    <div className="container d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
      <div className="google-card col-md-5 col-sm-10 text-center">
        <h1 className="mb-2" style={{ color: "#5f6368", fontSize: "24px" }}>Drive</h1>
        <h2 className="mb-4" style={{ fontSize: "22px", fontWeight: "400" }}>כניסה למערכת</h2>
        
        <LoginForm onLoginSuccess={handleSuccess} />
        
        <p className="mt-4 text-center small text-muted">
          {LOG_IN.DONT_HAVE_ACCOUNT}{" "}
          <Link to="/register" style={{ color: "#1a73e8", textDecoration: "none", fontWeight: "500" }}>
            {REGISTER.SIGN_IN}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;