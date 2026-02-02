import { NavLink } from "react-router-dom";


function Header() {
  return (
    <nav className="navbar bg-white border-bottom sticky-top py-3">
      <div className="inner">
        <div className="container-fluid d-flex align-items-center">
          {/* Logo */}
          <NavLink
            to="/"
            className="navbar-brand d-flex align-items-center m-0 p-0"
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src="/logo_kr.svg"
                alt="ZIMPIC"
                style={{
                  height: "34px",
                  width: "auto",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            </div>
          </NavLink>

          {/* Menu */}
          <div className="d-flex align-items-center gap-4 ms-auto">
            <NavLink to="/HomePage" className="header-navlink btn btn-link p-0 text-decoration-none text-dark small fw-semibold">
              견적 계산해보기
            </NavLink>
            <NavLink to="" className="header-navlink btn btn-link p-0 text-decoration-none text-dark small fw-semibold">
              내 주변 이사업체 찾기
            </NavLink>
          </div>
        </div>
      </div>

      {/* 헤더 메뉴 hover 밑줄 효과용 CSS */}
      <style>{`
        .header-navlink{
          position: relative;
        }
        .header-navlink::after{
          content: "";
          position: absolute;
          left: 0;
          bottom: -6px;
          width: 0%;
          height: 2px;
          border-radius: 999px;
          background: var(--bs-primary);
          transition: width .18s ease;
        }
        .header-navlink:hover::after{
          width: 100%;
        }
      `}</style>
    </nav>
  );
}

export default Header;
