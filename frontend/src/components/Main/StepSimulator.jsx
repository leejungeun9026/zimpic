import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import { FreeMode, Navigation, Thumbs } from 'swiper/modules';
import "swiper/css";
import "swiper/css/pagination";
import { useState } from "react";

const StepSimulator = () => {
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const slides = [
    "/mock_step1.png",
    "/mock_step2.png",
    "/mock_step2.png",
    "/mock_step2.png",
  ];
  const steps = [
    "이사 정보 입력",
    "이미지 분석 결과",
    "주소 입력",
    "결과 확인"
  ]

  return (
    <section id="simulator" className="main-section bg-primary text-white pb-0 overflow-hidden">
      <div className="container">
        <div className="simulator_wrap">
          <Swiper
            onSwiper={setThumbsSwiper}
            spaceBetween={10}
            slidesPerView={4}
            freeMode={true}
            watchSlidesProgress={true}
            loop={false}
            modules={[FreeMode, Thumbs]}
            className="d-none d-md-block simulator_thumb_swiper"
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
          <Swiper
            modules={[FreeMode, Thumbs, Autoplay]}
            autoplay={{ delay: 3000, disableOnInteraction: false }}
            loop={true}
            thumbs={{
              swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null,
            }}
            className="simulator_swiper"
          >
            {slides.map((src) => (
              <SwiperSlide key={src}>
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
