import { useNavigate, Link } from "react-router-dom";
import RegisterForm from "../components/RegisterForm";
import { REGISTER } from "../consts/Register";

const RegisterPage = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    alert("User registered successfully!");
    navigate("/login");
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <h2 className="text-center mb-4">{REGISTER.CREATE_ACCOUNT}</h2>

          <RegisterForm onRegisterSuccess={handleSuccess} />

          <p className="mt-3 text-center">
            {REGISTER.ALREADY_HAVE_ACCOUNT}
            <Link to="/login">{REGISTER.LOG_IN}</Link>
          </p>

        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
