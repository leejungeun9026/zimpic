import React from "react";
import { ScanEye, Smartphone, PiggyBank } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: <ScanEye size={48} />,
      title: "AI 이미지 분석",
      desc: "공간 사진을 찍으면 AI가 가구와 짐의 양을 자동으로 분석합니다.",
    },
    {
      icon: <Smartphone size={48} />,
      title: "간편한 비대면",
      desc: "약속 잡고 방문할 필요 없이, 언제 어디서나 견적을 확인하세요.",
    },
    {
      icon: <PiggyBank size={48} />,
      title: "합리적인 비용",
      desc: "여러 업체의 비교 견적을 통해 최적의 가격을 제안합니다.",
    },
  ];

  return (
    <section id="features" className="lp-features">
      <div className="lp-container">
        <h2 className="lp-section__title">왜 AI 견적일까요?</h2>
        <p className="lp-section__desc">최첨단 기술로 이사의 새로운 기준을 만듭니다.</p>

        <div className="lp-featureGrid">
          {features.map((feature, index) => (
            <div key={index} className="lp-card">
              <div className="lp-card__icon">{feature.icon}</div>
              <h3 className="lp-card__title">{feature.title}</h3>
              <p className="lp-card__desc">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
