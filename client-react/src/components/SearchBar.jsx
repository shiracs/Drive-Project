import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SEARCH } from "../consts/Search";

const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
    const location = useLocation(); 

  // Clear search input when not on search page
  useEffect(() => {
    if (!location.pathname.includes("/search")) {
      setSearchQuery("");
    }
  }, [location.pathname]);

  // Handle Enter key press on search input
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      const trimmedQuery = searchQuery.trim();
      if (!trimmedQuery) {
        setSearchQuery("");
        navigate("/dashboard");
      } else {
        navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`);
      }
    }
  };

  return (
    <div className="flex-grow-1 mx-5" style={{ maxWidth: "720px" }}>
      <input
        type="text"
        className="google-search-input w-100"
        placeholder={SEARCH.PLACEHOLDER}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
};

export default SearchBar;
