import { Outlet } from "react-router-dom";

function LayoutWithWrapper() {
  return (
    <div className="content-wrapper">
      <Outlet />
    </div>
  );
}

export default LayoutWithWrapper;
