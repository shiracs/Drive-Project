import { useSearchParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { RESOURCE_API_URL } from "../consts/Urls";
import { getTokenHeader } from "../utils/auth";
import FileGrid from "../components/FileGrid";
import { GENERAL } from "../consts/General";

const FilePage = ({ customUrl, title, subTitle }) => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // get folderId from URL params
  const folderId = searchParams.get("folderId");

  const fetchResources = useCallback(
    async (parentId) => {
      setLoading(true);
      try {
        const auth = getTokenHeader();

        let baseUrl = customUrl || RESOURCE_API_URL;
        let finalUrl = parentId ? `${baseUrl}?parentId=${parentId}` : baseUrl;

        const response = await fetch(finalUrl, { headers: auth });

        if (!response.ok) throw new Error("Failed to fetch resources");

        const data = await response.json();
        setResources(data);
      } catch (err) {
        console.error("Fetch error:", err);
        setResources([]);
      } finally {
        setLoading(false);
      }
    },
    [customUrl]
  );

  useEffect(() => {
    fetchResources(folderId);
  }, [folderId, fetchResources]);

  const handleDeleteSuccess = (deletedId) => {
    setResources((prev) => prev.filter((item) => item.id !== deletedId));
  };

  const displayTitle = folderId ? GENERAL.GO_BACK : title || GENERAL.MY_FILES;

  return (
    <FileGrid
      resources={resources}
      loading={loading}
      title={displayTitle}
      subTitle={subTitle}
      onNavigate={(id) => setSearchParams({ folderId: id })}
      onBack={() => navigate(-1)}
      showBackButton={!!folderId}
      onDeleteSuccess={handleDeleteSuccess}
      onRefresh={() => fetchResources(folderId)}
    />
  );
};

export default FilePage;
