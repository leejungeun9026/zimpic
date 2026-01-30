import { NavLink, useNavigate, useLocation } from "react-router-dom";
import headerLogo from "../../assets/logo.png";

function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 80; //sticky 헤더 높이만큼 위로 보정
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  // 메인이면 스크롤, 아니면 메인으로 이동
  const goSection = (id) => {
    if (location.pathname === "/") {
      scrollTo(id);
    } else {
      navigate(`/#${id}`);
    }
  };

  // CSS에서 opacity만 살짝 조절
  const isMain = location.pathname === "/";

  return (
    <nav className="navbar bg-white border-bottom sticky-top" style={{ backdropFilter: "blur(8px)" }}>
      <div className="container d-flex align-items-center py-2">
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
              height: "50px", // 전체 높이를 확보해서 로고가 커질 공간을 만듦
              overflow: "visible", // 그림자가 잘리지 않게 설정
            }}
          >
            <img
              src={headerLogo}
              alt="ZIMPIC 로고"
              style={{
                height: "100%", // div 높이에 꽉 차게 설정
                width: "auto",  // 가로세로 비율 유지
                objectFit: "contain",
                display: "block",
                // 만약 로고 이미지 자체에 여백이 있다면 여기서 미세하게 조절 가능
                filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.05))", // 아주 은은한 그림자만 추가 (선택사항)
              }}
            />
          </div>
        </NavLink>

        {/* Menu */}
        <div className="d-flex align-items-center gap-4 ms-auto">
          <button
            type="button"
            className="lp-navlink btn btn-link p-0 text-decoration-none text-dark small fw-semibold"
            onClick={() => goSection("features")}
          >
            서비스 소개
          </button>

          <button
            type="button"
            className="lp-navlink btn btn-link p-0 text-decoration-none text-dark small fw-semibold"
            onClick={() => goSection("steps")}
          >
            이용 방법
          </button>

          <button
            className="btn btn-primary btn-sm px-3 fw-semibold"
            style={{
              borderRadius: 999,
              background: "linear-gradient(135deg, #2563eb, #4f46e5)",
              border: 0,
              boxShadow: "0 10px 22px rgba(79, 70, 229, 0.25)",
            }}
            onClick={() => navigate("/HomePage")}
          >
            무료 견적
          </button>
        </div>
      </div>

      {/* 헤더 메뉴 hover 밑줄 효과용 CSS */}
      <style>{`
        .lp-navlink{
          position: relative;
          opacity: ${isMain ? 0.95 : 1};
        }
        .lp-navlink::after{
          content: "";
          position: absolute;
          left: 0;
          bottom: -6px;
          width: 0%;
          height: 2px;
          border-radius: 999px;
          background: linear-gradient(135deg, #2563eb, #4f46e5);
          transition: width .18s ease;
        }
        .lp-navlink:hover::after{
          width: 100%;
        }
      `}</style>
    </nav>
  );
}

export default Header;
