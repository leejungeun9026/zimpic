import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

const Steps = () => {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray(".step-card");

      gsap.set(cards, { autoAlpha: 0, y: 30 });

      gsap.to(cards, {
        autoAlpha: 1,
        y: 0,
        stagger: 0.15,
        duration: 0.7,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ref.current,
          start: "top 75%",
          once: true,
        },
      });
    }, ref);

    return () => ctx.revert();
  }, []);


  return (
    <section id="steps" className="main-section bg-light">
      <div className="inner">
        <div className="container-fluid">
          <div className="title pb-4 text-center">
            <h2 className="fs-2 fw-bold pb-2">이용 방법</h2>
            <p className="text-secondary pb-3">3단계면 끝나는 간편한 이사 견적</p>
          </div>

          <div ref={ref} className="row row-cols-1 row-cols-md-3 gy-5 gx-3">
            <div className="col">
              <div className="step-card card rounded-4 h-100 border-0 overflow-hidden shadow-sm">
                <img src="/step01.jpg" alt="이용방법1" style={{ width: "100%", height: "auto" }} />
                <div className="card-body p-md-4">
                  <div className="d-flex align-items-center gap-1 pb-2">
                    <div className="icon-box-24 rounded-pill bg-primary text-white small">1</div>
                    <h3 className="fs-5 fw-bold">사진 촬영</h3>
                  </div>
                  <p>
                    이사할 공간과 짐을 촬영하여 업로드합니다.
                  </p>
                </div>
              </div>
            </div>
            <div className="col">
              <div className="step-card card rounded-4 h-100 border-0 overflow-hidden shadow-sm">
                <img src="/step02.jpg" alt="이용방법2" style={{ width: "100%", height: "auto" }} />
                <div className="card-body p-md-4">
                  <div className="d-flex align-items-center gap-1 pb-2">
                    <div className="icon-box-24 rounded-pill bg-primary text-white small">2</div>
                    <h3 className="fs-5 fw-bold">AI 분석</h3>
                  </div>
                  <p>
                    AI가 짐의 양과 종류를 자동으로 분석합니다.
                  </p>
                </div>
              </div>
            </div>
            <div className="col">
              <div className="step-card card rounded-4 h-100 border-0 overflow-hidden shadow-sm">
                <img src="/step03.jpg" alt="이용방법3" style={{ width: "100%", height: "auto" }} />
                <div className="card-body p-md-4">
                  <div className="d-flex align-items-center gap-1 pb-2">
                    <div className="icon-box-24 rounded-pill bg-primary text-white small">3</div>
                    <h3 className="fs-5 fw-bold">견적 확인</h3>
                  </div>
                  <p>
                    분석 결과를 바탕으로 예상 견적을 받습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Steps;
