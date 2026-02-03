import { Check } from "lucide-react";

function StepIndicator({ currentStep }) {
  const steps = [1, 2, 3, 4];
  const tests = ["이사 정보 입력", "이미지 분석", "주소 입력", "결과 확인"];

  return (
    <div className="step-indicator">
      {steps.map((step, idx) => {
        const isCompleted = step < currentStep;
        const isActive = step === currentStep;

        return (
          <div key={step} className={`step-wrapper 
            ${isCompleted ? "completed" : ""}
            ${isActive ? "active" : ""}`
          }
          >
            <div className="step-circle">
              {isCompleted ? <Check size={16} /> : step}
            </div>
            <p className="step-text">{tests[idx]}</p>
          </div>
        );
      })}
    </div >
  );
}

export default StepIndicator;
