import React from "react";
import { useNavigate } from "react-router-dom";

const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section id="cta" className="lp-cta">
      <div className="lp-container">
        <h2 className="lp-cta__title">지금 바로 견적을 확인해보세요</h2>
        <p className="lp-cta__desc">사진 한 장이면 충분합니다. 부담 없이 시작하세요.</p>

        <button
          type="button"
          onClick={() => navigate("/HomePage")}
          className="lp-btn lp-btn--primary text-black"
        >
          무료 견적 받기
        </button>
      </div>
    </section>
  );
};

export default CTASection;
