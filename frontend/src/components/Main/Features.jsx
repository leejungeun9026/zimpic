import { Container, HandCoins, Van, VectorSquare } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: <VectorSquare size={24} />,
      title: "AI 가구 자동 인식",
      desc: <>직접 하나하나 입력할 필요 없이 <br className="d-block d-sm-none d-md-block" />사진 속 가구를 자동으로 분류하고 크기를 추정</>,
    },
    {
      icon: <Container size={24} />,
      title: "실제 적재 기준 용적(CBM) 계산",
      desc: <>단순 개수가 아닌 <br className="d-block d-sm-none d-md-block" />트럭 적재 기준으로 실제 부피를 계산</>,
    },
    {
      icon: <Van size={24} />,
      title: "최적의 트럭 톤수 자동 추천",
      desc: <>1톤? 2.5톤? 고민할 필요 없이 <br className="d-block d-sm-none d-md-block" />적재율을 기준으로 자동 조합</>,
    },
    {
      icon: <HandCoins size={24} />,
      title: "거리·층수까지 반영한 현실적인 비용",
      desc: <>이동 거리, 엘리베이터/사다리차 여부, <br className="d-block d-sm-none d-md-block" />특수 가구까지 반영한 견적</>,
    },
  ];

  return (
    <section id="main-features" className="main-section">
      <div className="container">
        <div className="title pb-4 text-center">
          <h2 className="fs-2 fw-bold pb-2">짐픽만의 스마트 이사 견적</h2>
          <p className="text-secondary pb-3">사진 한 장으로 가구 인식부터 예상 비용까지 자동 계산합니다.</p>
        </div>

        <div className="row row-cols-1 row-cols-sm-2 g-3 main-inner">
          {features.map((feature, index) => (
            <div key={index} className="col">
              <div className="card h-100 rounded-3 shadow-sm border border-opacity-10 text-center">
                <div className="card-body py-4">
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
