import { useState } from "react";
import { Autoplay, EffectFade, FreeMode, Thumbs } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/pagination";

const StepSimulator = () => {
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const slides = [
    "/mock_step1.png",
    "/mock_step2.png",
    "/mock_step3.png",
    "/mock_step4.png",
  ];
  const steps = [
    "이사 정보 입력",
    "이미지 분석 결과",
    "주소 입력",
    "결과 확인"
  ]

  return (
    <section id="simulator" className="position-relative main-section bg-primary text-white pb-0 overflow-hidden">
      <div className="container">
        <div className="thumb_wrap">
          <div className="title pb-4 text-start">
            <h2 className="fs-2 fw-bold pb-2">결과까지 딱! 3단계</h2>
            <p className="pb-3">빠르게 견적 결과를 확인하세요.</p>
          </div>
          <Swiper
            onSwiper={setThumbsSwiper}
            spaceBetween={10}
            slidesPerView={4}
            freeMode={true}
            watchSlidesProgress={true}
            modules={[FreeMode, Thumbs]}
            className="simulator_thumb_swiper"
          >
            {slides.map((_, idx) => (
              <SwiperSlide key={idx}>
                <div className="step_box">
                  <div className="num">
                    {idx + 1}
                  </div>
                  <div className="text">
                    {steps[idx]}
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
        <div className="simulator_wrap">
          <Swiper
            modules={[EffectFade, FreeMode, Thumbs, Autoplay]}
            autoplay={{ delay: 3000, disableOnInteraction: false }}
            loop={false}
            effect="fade"
            thumbs={{
              swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null,
            }}
            className="simulator_swiper"
          >
            {slides.map((src, idx) => (
              <SwiperSlide key={`${src}-${idx}`}>
                <div className="img_wrap">
                  <img src={src} />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
};

export default StepSimulator;
