import { NavLink } from "react-router-dom";

function Header() {
  return (
    <nav className="navbar navbar-light bg-white border-bottom">
      <div className="container justify-content-center">
        <NavLink
          to="/HomePage"
          className="navbar-brand fw-bold"
        >
          🚚 ZIMPIC
        </NavLink>
      </div>
    </nav>
  );
}

export default Header;
