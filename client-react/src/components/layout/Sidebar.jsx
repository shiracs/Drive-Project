import { useSearchParams, useLocation, Link } from "react-router-dom";
import { SIDEBAR_MENU, SIDEBAR_PATHS } from "../../consts/Sidebar";
import { RESOURCE_API_URL } from "../../consts/Urls";
import { getTokenHeader } from "../../utils/auth";
import NewMenu from "../NewMenu";
import './styles/Sidebar.css';

const Sidebar = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const currentFolderId = searchParams.get("folderId") || null;

  const fileToBase64 = (file) =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.readAsDataURL(file);
      r.onload = () => res(r.result);
      r.onerror = (e) => rej(e);
    });

  const createResource = async (name, type, content = "", parentId = null) => {
    const auth = getTokenHeader();

    const response = await fetch(RESOURCE_API_URL, {
      method: "POST",
      headers: {
        ...auth,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, type, content, parentId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }
    return await response.json();
  };

  const handleUpload = async (uploadData) => {
    try {
      if (uploadData.isFolder) {
        const sortedFiles = [...uploadData.files].sort(
          (a, b) =>
            a.webkitRelativePath.split("/").length -
            b.webkitRelativePath.split("/").length
        );

        const folderIdMap = { "": currentFolderId };

        for (const file of sortedFiles) {
          const parts = file.webkitRelativePath.split("/");
          const fileName = parts.pop();
          let runningPath = "";
          let lastParentId = currentFolderId;

          for (const folderName of parts) {
            const currentPath = runningPath
              ? `${runningPath}/${folderName}`
              : folderName;
            if (!folderIdMap[currentPath]) {
              const newFolder = await createResource(
                folderName,
                "FOLDER",
                "",
                lastParentId
              );
              folderIdMap[currentPath] = newFolder.id;
            }
            lastParentId = folderIdMap[currentPath];
            runningPath = currentPath;
          }

          const base64 = await fileToBase64(file);
          const isImage = file.type.startsWith("image/");
          const contentToSend = isImage ? base64.split(",")[1] : base64;
          const resourceType = isImage ? "IMAGE" : "FILE";

          await createResource(
            fileName,
            resourceType,
            contentToSend,
            lastParentId
          );
        }
      } else {
        const cleanBase64 =
          uploadData.base64.split(",")[1] || uploadData.base64;
        const resourceType = uploadData.type?.startsWith("image/")
          ? "IMAGE"
          : "FILE";

        await createResource(
          uploadData.name,
          resourceType,
          cleanBase64,
          currentFolderId
        );
      }
      alert("העלאה הושלמה בהצלחה!");
      window.location.reload();
    } catch (err) {
      console.error("Upload failed:", err);
      alert("שגיאה בהעלאה: " + err.message);
    }
  };

  const menuItems = [
    {
      name: SIDEBAR_MENU.HOME,
      icon: "bi-house-door",
      path: SIDEBAR_PATHS.HOME,
    },
    {
      name: SIDEBAR_MENU.MY_STORAGE,
      icon: "bi-hdd-stack",
      path: SIDEBAR_PATHS.MY_STORAGE,
    },
    {
      name: SIDEBAR_MENU.SHARED,
      icon: "bi-people",
      path: SIDEBAR_PATHS.SHARED,
    },
    {
      name: SIDEBAR_MENU.RECENT,
      icon: "bi-clock-history",
      path: SIDEBAR_PATHS.RECENT,
    },
    {
      name: SIDEBAR_MENU.STARRED,
      icon: "bi-star",
      path: SIDEBAR_PATHS.STARRED,
    },
    { name: SIDEBAR_MENU.TRASH, icon: "bi-trash3", path: SIDEBAR_PATHS.TRASH },
    {
      name: SIDEBAR_MENU.STORAGE,
      icon: "bi-cloud-check",
      path: SIDEBAR_PATHS.STORAGE,
    },
  ];

  return (
    <div
      className="bg-white pt-4"
      style={{ width: "250px", minHeight: "100vh", position: "relative" }}
      dir="rtl"
    >
      <div className="px-3 mb-4">
        <NewMenu onUpload={handleUpload} />
      </div>

      <ul className="list-unstyled pe-0">
        {menuItems.map((item, index) => (
          <li key={index} className="mb-1">
            <Link
              to={item.path}
              className={`sidebar-item text-decoration-none ${
                location.pathname === item.path ? "active" : ""
              }`}
            >
              <i className={`bi ${item.icon}`}></i>
              <span>{item.name}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="px-4 mt-4 pt-4 border-top">
        <div className="progress mb-2" style={{ height: "4px" }}>
          <div className="progress-bar" style={{ width: "45%" }}></div>
        </div>
        <small className="text-secondary" style={{ fontSize: "12px" }}>
          6.7GB מתוך 15GB בשימוש
        </small>
      </div>
    </div>
  );
};

export default Sidebar;
