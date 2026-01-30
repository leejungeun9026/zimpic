import React from "react";
import { ShieldCheck, CircleDollarSign, CheckCircle2 } from "lucide-react";

const Trust = () => {
  return (
    <section id="trust" className="lp-trust">
      <div className="lp-container">
        <h2 className="lp-section__title">믿고 맡길 수 있는 서비스</h2>

        <div className="lp-trustGrid">
          <div className="lp-trustItem">
            <ShieldCheck size={64} className="lp-icon" />
            <h3 className="lp-trustItem__title">검증된 업체</h3>
            <p className="lp-trustItem__desc">
              엄격한 심사를 통과한<br />이사 업체만 연결합니다.
            </p>
          </div>

          <div className="lp-trustItem">
            <CircleDollarSign size={64} className="lp-icon" />
            <h3 className="lp-trustItem__title">정확한 견적</h3>
            <p className="lp-trustItem__desc">
              AI 분석으로 오차 없는<br />정확한 물량을 산출합니다.
            </p>
          </div>

          <div className="lp-trustItem">
            <CheckCircle2 size={64} className="lp-icon" />
            <h3 className="lp-trustItem__title">추가 요금 0원</h3>
            <p className="lp-trustItem__desc">
              견적 외 불필요한<br />추가 비용을 요구하지 않습니다.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Trust;
