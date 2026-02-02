import React from "react";
import { ShieldCheck, CircleDollarSign, CheckCircle2, Check } from "lucide-react";

const Recommend = () => {
  return (
    <section id="main-features" className="main-section">
      <div className="container main-inner">
        <div className="title pb-4 text-center">
          <h2 className="fs-2 fw-bold pb-2">이런 분들에게 추천드려요</h2>
          <p className="text-secondary pb-3">사진 한 장으로 가구 인식부터 예상 비용까지 자동 계산합니다.</p>
        </div>
        <ul className="fs-5 fw-semibold mx-auto" style={{ width: "fit-content" }}>
          <li className="mb-3 d-flex align-items-baseline gap-1">
            <div className="flex-shrink-0 icon-box-24 bg-primary rounded-1 text-white">
              <Check size={16} strokeWidth={3} />
            </div>
            <p>
              원룸/소형 이사부터 중형 이사까지 셀프 비교하고 싶은 사람
            </p>
          </li>
          <li className="mb-3 d-flex align-items-baseline gap-1">
            <div className="flex-shrink-0 icon-box-24 bg-primary rounded-1 text-white ">
              <Check size={16} strokeWidth={3} />
            </div>
            <p>
              대략적인 이사 비용을 빠르게 알고 싶을 때
            </p>
          </li>
          <li className="mb-3 d-flex align-items-baseline gap-1">
            <div className="flex-shrink-0 icon-box-24 bg-primary rounded-1 text-white ">
              <Check size={16} strokeWidth={3} />
            </div>
            <p>
              우리 집 짐 톤수가 감이 안 잡힐 때
            </p>
          </li>
        </ul>
      </div>
    </section>
  );
};

export default Recommend;
