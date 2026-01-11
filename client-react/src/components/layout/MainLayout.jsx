import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const MainLayout = () => {
  return (
    <div className="d-flex flex-column" style={{ height: "100vh", overflow: "hidden" }}>
      <Navbar />
      <div className="d-flex flex-row-reverse flex-grow-1" style={{ overflow: "hidden" }}>
        <Sidebar />
        <main className="flex-grow-1 overflow-auto p-4" dir="rtl" style={{ backgroundColor: "var(--bg-secondary)" }}>
          <Outlet /> 
        </main>
      </div>
    </div>
  );
};

export default MainLayout;