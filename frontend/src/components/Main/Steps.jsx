import React from "react";

const Steps = () => {
  return (
    <section id="steps" className="lp-steps">
      <div className="lp-container">
        <h2 className="lp-section__title">이용 방법</h2>
        <p className="lp-section__desc">3단계로 끝나는 간편한 이사 견적</p>

        <div className="lp-steps__grid">
          <div className="lp-step">
            <div className="lp-step__circle">1</div>
            <h3 className="lp-step__title">사진 촬영</h3>
            <p className="lp-step__desc">
              이사할 공간과 짐을<br />촬영하여 업로드합니다.
            </p>
          </div>

          <div className="lp-step">
            <div className="lp-step__circle">2</div>
            <h3 className="lp-step__title">AI 분석</h3>
            <p className="lp-step__desc">
              AI가 짐의 양과 종류를<br />자동으로 분석합니다.
            </p>
          </div>

          <div className="lp-step">
            <div className="lp-step__circle">3</div>
            <h3 className="lp-step__title">견적 확인</h3>
            <p className="lp-step__desc">
              분석 결과를 바탕으로<br />예상 견적을 받습니다.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Steps;
