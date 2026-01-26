export default function ResultFooterActions({
  onPrev,
  onSave,
  onResetToHome,
}) {
  return (
    <>
      <div className="d-flex justify-content-between gap-2">
        <button className="btn btn-outline-secondary w-50" onClick={onPrev}>
          이전 단계
        </button>
        <button className="btn btn-primary w-50" onClick={onSave}>
          저장하기
        </button>
      </div>

      <div className="text-center mt-3">
        <button className="btn btn-link" onClick={onResetToHome}>
          다시 계산하기
        </button>
      </div>
    </>
  );
}
