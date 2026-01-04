const Dashboard = () => {
  return (
    <div className="container-fluid">
      <h4 className="mb-4 fw-normal text-secondary">הקבצים שלי</h4>
      <div className="row g-3">
        <div className="col-xl-2 col-lg-3 col-md-4 col-sm-6">
          <div className="card p-3 shadow-sm border-0 text-center h-100">
            <i className="bi bi-file-earmark-pdf fs-1 text-danger"></i>
            <p className="mt-2 mb-0 small text-truncate">סיכום פגישה.pdf</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;