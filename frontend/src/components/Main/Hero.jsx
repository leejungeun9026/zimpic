import React from "react";
import { useNavigate } from "react-router-dom";
import { Camera } from "lucide-react";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section id="intro" className="lp-hero">
      <div className="lp-container">
        <h1 className="lp-hero__title">
          사진 한 장으로<br />이사 견적 끝!
        </h1>

        <p className="lp-hero__subtitle">
          복잡한 방문 견적 없이, AI가 사진을 분석해 정확한 견적을 내드립니다.
        </p>

        <button
          type="button"
          onClick={() => navigate("/HomePage")}
          className="lp-btn lp-btn--primary lp-btn--icon"
        >
          <Camera size={24} />
          <span>지금 견적 받아보기</span>
        </button>
      </div>
    </section>
  );
};

export default Hero;
