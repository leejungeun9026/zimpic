import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import { FreeMode, Navigation, Thumbs } from 'swiper/modules';
import "swiper/css";
import "swiper/css/pagination";
import { useState } from "react";

const Estimate = () => {
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const slides = [
    "https://swiperjs.com/demos/images/nature-1.jpg",
    "https://swiperjs.com/demos/images/nature-2.jpg",
    "https://swiperjs.com/demos/images/nature-3.jpg",
    "https://swiperjs.com/demos/images/nature-4.jpg",
  ];

  return (
    <section id="estimate" className="main-section bg-primary text-white">
      <div className="container">
        <div className="title pb-4 text-center">
          <h2 className="fs-2 fw-bold pb-2">견적을 저장하고 비교하세요</h2>
          <p className="pb-3">사진과 계산 결과를 그대로 보관할 수 있어요.</p>
        </div>

        <Swiper
          modules={[FreeMode, Thumbs, Autoplay]}
          autoplay={{ delay: 2500, disableOnInteraction: false }}
          loop={true}
          thumbs={{
            swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null,
          }}
          className="mySwiper2"
        >
          <SwiperSlide>
            <img src="https://swiperjs.com/demos/images/nature-1.jpg" />
          </SwiperSlide>
          <SwiperSlide>
            <img src="https://swiperjs.com/demos/images/nature-2.jpg" />
          </SwiperSlide>
          <SwiperSlide>
            <img src="https://swiperjs.com/demos/images/nature-3.jpg" />
          </SwiperSlide>
          <SwiperSlide>
            <img src="https://swiperjs.com/demos/images/nature-4.jpg" />
          </SwiperSlide>
        </Swiper>

        <Swiper
          onSwiper={setThumbsSwiper}
          spaceBetween={10}
          slidesPerView={4}
          freeMode={true}
          watchSlidesProgress={true}
          modules={[FreeMode, Thumbs]}
          className="mySwiper"
        >
          <SwiperSlide>
            <img src="https://swiperjs.com/demos/images/nature-1.jpg" />
          </SwiperSlide>
          <SwiperSlide>
            <img src="https://swiperjs.com/demos/images/nature-2.jpg" />
          </SwiperSlide>
          <SwiperSlide>
            <img src="https://swiperjs.com/demos/images/nature-3.jpg" />
          </SwiperSlide>
          <SwiperSlide>
            <img src="https://swiperjs.com/demos/images/nature-4.jpg" />
          </SwiperSlide>
        </Swiper>
      </div>

      <>
        <style>
          {`
            .swiper {
              width: 100%;
              height: 300px;
              margin-left: auto;
              margin-right: auto;
            }

            .swiper-slide {
              background-size: cover;
              background-position: center;
            }

            .mySwiper2 {
              height: 80%;
              width: 100%;
            }

            .mySwiper {
              height: 20%;
              box-sizing: border-box;
              padding: 10px 0;
            }

            .mySwiper .swiper-slide {
              width: 25%;
              height: 100%;
              opacity: 0.4;
            }

            .mySwiper .swiper-slide-thumb-active {
              opacity: 1;
            }

            .swiper-slide img {
              display: block;
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
            `}
        </style>
      </>
    </section>
  );
};

export default Estimate;
