import { Dumbbell, Gauge, PiggyBank, RulerDimensionLine, Smartphone } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: <Gauge size={24} />,
      desc: <>여러 업체 비교 전, <br />이사 비용을 빠르게 가늠해보고 싶을 때</>,
    },
    {
      icon: <RulerDimensionLine size={24} />,
      desc: <>견적서에 일일이 <br />가구 입력하고 부피 계산하기 귀찮을 때</>,
    },
    {
      icon: <Dumbbell size={24} />,
      desc: <>우리 집 짐이 몇 톤 정도 나올지 <br />가늠하기 어려울 때</>,
    },
  ];

  return (
    <section id="main-features" className="main-section">
      <div className="container">
        <div className="title pb-4">
          <h2 className="fs-2 fw-bold pb-2">이럴 때 짐픽하세요!</h2>
          <p className="text-secondary pb-3">AI가 자동으로 계산하는 이사 견적 계산기</p>
        </div>

        <div className="row row-cols-1 row-cols-md-3 g-3">
          {features.map((feature, index) => (
            <div key={index} className="col">
              <div className="card h-100 rounded-3 shadow-sm border border-opacity-10 text-center">
                <div className="card-body">
                  <div className="icon-box-48 mx-auto bg-primary bg-opacity-10 rounded-3 text-primary mb-3">{feature.icon}</div>
                  <p className="fw-semibold">{feature.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
