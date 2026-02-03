import { Sparkles } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";

const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section id="main-cta" className="main-section">
      <div className="position-absolute top-0 start-0 w-100 h-100 bg-dark opacity-50 z-1"></div>
      <video
        className="position-absolute top-0 start-0 w-100 h-100 object-fit-cover"
        muted
        autoPlay
        loop
        playsInline
      >
        <source src="/landing-main.mp4" type="video/mp4" className="object-cover" />
      </video>
      <div className="position-relative z-3 text-white">
        <div className="main-inner">
          <div className="text-center">
            <h1 className="text-center fw-bold pb-5">지금 바로 견적을 확인해보세요</h1>
            <button
              type="button"
              onClick={() => navigate("/HomePage")}
              className="btn btn-primary rounded-3 py-2 px-3"
            >
              <span>이사 견적 계산해보기</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
