function StepIndicator({ currentStep }) {
  const steps = [1, 2, 3, 4];

  return (
    <div className="step-indicator">
      {steps.map((step) => (
        <div key={step} className="step-wrapper">
          <div
            className={
              step === currentStep
                ? "step-circle active"
                : "step-circle"
            }
          >
            {step}
          </div>

          {step !== steps.length && (
            <div className="step-line" />
          )}
        </div>
      ))}
    </div>
  );
}

export default StepIndicator;
