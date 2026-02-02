import { Check } from "lucide-react";

function StepIndicator({ currentStep }) {
  const steps = [1, 2, 3, 4];

  return (
    <div className="step-indicator">
      {steps.map((step) => {
        const isCompleted = step < currentStep;
        const isActive = step === currentStep;

        return (
          <div key={step} className="step-wrapper">
            <div
              className={`step-circle
                ${isCompleted ? "completed" : ""}
                ${isActive ? "active" : ""}
              `}
            >
              {isCompleted ? <Check size={16} /> : step}
            </div>

            {step !== steps.length && (
              <div
                className={`step-line ${isCompleted ? "completed" : ""}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default StepIndicator;
