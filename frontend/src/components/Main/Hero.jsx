import { useNavigate } from "react-router-dom";
import { Camera, Sparkles } from "lucide-react";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section id="main-hero" className="position-relative overflow-hidden text-white" style={{ height: "60vh" }}>
      <div className="container position-relative z-index-9 text-start start-0 translate-middle-y" style={{ top: "40%" }}>
        <h1 className="fw-semibold pb-2">
          <span className="fw-bold">사진</span><span className="opacity-50">만 올리면, </span><br /><span className="fw-bold">AI가 알아서 계산</span><span className="opacity-50">해주니까!</span>
        </h1>
        <p className="pb-4">
          가구 인식부터 적재량 계산, <br className="d-sm-none" />추천 트럭과 예상 비용까지 한 번에.
        </p>
        <button
          type="button"
          onClick={() => navigate("/HomePage")}
          className="btn btn-primary rounded-3 py-2 px-3"
        >
          <Sparkles size={16} className="mb-1 me-1" />
          <span>이사 견적 계산해보기</span>
        </button>
      </div>
    </section>
  );
};

export default Hero;
