import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "../consts/Urls";
import FileCard from "../components/FileCard";
import { SEARCH } from "../consts/Search";

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const query = searchParams.get("q");
  const navigate = useNavigate();

  const folders = useMemo(
    () => results.filter((r) => r.type === "FOLDER"),
    [results]
  );
  const files = useMemo(
    () => results.filter((r) => r.type === "FILE"),
    [results]
  );

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query) return;
      setLoading(true);
      try {
        //TODO: add authorization header
        const token = localStorage.getItem("userToken");
        const response = await fetch(`${API_BASE_URL}/search/${query}`, {
          headers: { Authorization: token },
        });
        const data = await response.json();
        setResults(data);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query]);

  return (
    <div
      className="file-page-container"
      style={{ padding: "20px 40px", minHeight: "100vh", direction: "rtl" }}
    >
      <h4 className="mb-4 t-text-main">תוצאות חיפוש עבור: "{query}"</h4>

      {loading ? (
        <div className="t-text-main">מחפש...</div>
      ) : results.length > 0 ? (
        <>
          {/* Folder area */}
          {folders.length > 0 && (
            <section className="drive-section">
              <h6 className="t-text-sub mb-3">תיקיות</h6>
              <div className="drive-grid">
                {folders.map((folder) => (
                  <FileCard
                    key={folder.id}
                    file={folder}
                    onNavigate={(id) => navigate(`/home?folderId=${id}`)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* File area */}
          {files.length > 0 && (
            <section className="drive-section" style={{ marginTop: "30px" }}>
              <h6 className="t-text-sub mb-3">קבצים</h6>
              <div className="drive-grid">
                {files.map((file) => (
                  <FileCard key={file.id} file={file} />
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <div className="empty-folder-message t-text-main">
          {SEARCH.NO_RESULTS}
        </div>
      )}
    </div>
  );
};

export default SearchPage;
