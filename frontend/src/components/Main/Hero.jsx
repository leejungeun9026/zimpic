import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const Hero = () => {
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const bgRef = useRef(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const bg = bgRef.current;
    if (!root || !bg) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const headline = root.querySelector("[data-hero='headline']");
    const desc = root.querySelector("[data-hero='desc']");
    const ctaWrap = root.querySelector("[data-hero='ctaWrap']");
    const btn = root.querySelector("[data-hero='cta']");
    const icon = root.querySelector("[data-hero='spark']");

    // 1) 텍스트/버튼 올라오며 등장
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.fromTo(headline, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 })
      .fromTo(desc, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, "-=0.25")
      .fromTo(ctaWrap, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45 }, "-=0.2")
      .fromTo(
        btn,
        { scale: 0.98 },
        { scale: 1, duration: 0.35, ease: "back.out(1.6)" },
        "-=0.25"
      );

    // 2) 버튼 hover/tap 미세 인터랙션
    const enter = () => {
      gsap.to(btn, { y: -2, scale: 1.02, duration: 0.18, ease: "power2.out" });
      if (icon) gsap.to(icon, { rotate: 10, duration: 0.18, ease: "power2.out" });
    };
    const leave = () => {
      gsap.to(btn, { y: 0, scale: 1, duration: 0.2, ease: "power2.out" });
      if (icon) gsap.to(icon, { rotate: 0, duration: 0.2, ease: "power2.out" });
    };
    const down = () => gsap.to(btn, { scale: 0.98, duration: 0.08, ease: "power2.out" });
    const up = () => gsap.to(btn, { scale: 1.02, duration: 0.1, ease: "power2.out" });

    btn?.addEventListener("mouseenter", enter);
    btn?.addEventListener("mouseleave", leave);
    btn?.addEventListener("pointerdown", down);
    btn?.addEventListener("pointerup", up);

    // 3) 스크롤 패럴랙스: 배경이 "늦게" 따라오는 느낌
    // start/end 구간 동안 bg가 y로 천천히 이동
    const parallaxTween = gsap.to(bg, {
      y: 80,              // ← 숫자 올리면 패럴랙스 더 큼 (60~120 추천)
      ease: "none",
      scrollTrigger: {
        trigger: root,
        start: "top top",
        end: "bottom top", // hero가 화면에서 사라질 때까지
        scrub: 0.6,        // ← 핵심: 숫자 클수록 "늦게 따라옴" 느낌
      },
    });

    return () => {
      btn?.removeEventListener("mouseenter", enter);
      btn?.removeEventListener("mouseleave", leave);
      btn?.removeEventListener("pointerdown", down);
      btn?.removeEventListener("pointerup", up);

      tl.kill();
      parallaxTween.kill();
      ScrollTrigger.getAll().forEach((st) => st.kill()); // 혹시 남아있을까봐 안전하게
    };
  }, []);

  return (
    <section
      id="main-hero"
      ref={rootRef}
      className="position-relative overflow-hidden"
      style={{ minHeight: "70vh" }}
    >
      <div ref={bgRef} className="hero-bg" />

      <div className="hero-content inner position-relative start-0 translate-middle-y" style={{ top: "40%" }}>
        <div className="container-fluid px-4 text-start">
          <h1 className="fw-semibold pb-2" data-hero="headline">
            <span className="fw-bold">사진</span>
            <span className="opacity-50">만 올리면, </span>
            <br />
            <span className="fw-bold">AI가 알아서 계산</span>
            <span className="opacity-50">해주니까!</span>
          </h1>

          <p className="pb-4" data-hero="desc">
            가구 인식부터 적재량 계산, <br className="d-sm-none" />
            추천 트럭과 예상 비용까지 한 번에.
          </p>

          <div data-hero="ctaWrap" className="d-inline-block">
            <button
              type="button"
              onClick={() => navigate("/HomePage")}
              className="btn btn-primary rounded-3 py-2 px-3"
              data-hero="cta"
            >
              <Sparkles data-hero="spark" size={16} className="mb-1 me-1" />
              <span>이사 견적 계산해보기</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
