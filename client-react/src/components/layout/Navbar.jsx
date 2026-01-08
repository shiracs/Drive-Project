import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SEARCH } from "../../consts/Search";
import SearchBar from "../SearchBar";
import { LOG_IN } from "../../consts/Login";

const Navbar = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "אורח";

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <nav className="navbar navbar-light bg-white border-bottom px-4 py-2 shadow-sm d-flex justify-content-between align-items-center">
      <div className="d-flex align-items-center gap-2">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg"
          alt="logo"
          width="30"
        />
        <span className="navbar-brand fw-normal fs-4 m-0 text-secondary">
          Drive
        </span>
      </div>

      <SearchBar />

      <div className="d-flex align-items-center gap-3">
        <span className="text-muted small fw-bold">שלום, {username}</span>
        <button
          onClick={handleLogout}
          className="btn btn-outline-danger btn-sm rounded-pill px-3"
        >
          {LOG_IN.LOG_OUT}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
