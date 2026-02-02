function Footer() {
  return (
    <footer className="bg-dark text-white py-5">
      <div className="inner">
        <div className="container-fluid">
          <div className="row gx-5 gy-3">
            <div className="col-12 col-md-auto">
              <div className="logo opacity-75">
                <img src="/logo_en_w.svg" alt="짐픽"
                  style={{
                    height: "28px",
                    width: "auto",
                    objectFit: "contain",
                    display: "block",
                  }} />
              </div>
            </div>
            <div className="col-12 col-md">
              <ul className="ps-4 pt-1 small opacity-50" style={{ listStyle: "disc" }}>
                <li>이 계산기는 이사 비용의 대략적인 예상치를 제공합니다.</li>
                <li>실제 이사 비용은 이사 업체의 방문 견적 및 현장 상황에 따라 달라질 수 있습니다.</li>
                <li>정확한 비용은 여러 이사 업체에 견적을 요청하여 비교하시는 것이 좋습니다.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
