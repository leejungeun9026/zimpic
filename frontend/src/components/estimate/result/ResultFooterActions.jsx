export default function ResultFooterActions({
  onPrev,
  onSave,
  onResetToHome,
}) {
  return (
    <>

      <div className="d-flex justify-content-between gap-2 mt-4">
        <button className="btn btn-lg fs-6 btn-light text-secondary rounded-2" onClick={onPrev}>
          이전 단계
        </button>
        <button className="ms-auto btn btn-lg fs-6 btn-outline-primary rounded-2" onClick={onResetToHome}>
          처음으로
        </button>
        <button className="btn btn-lg fs-6 btn-primary rounded-2" onClick={onSave}>
          결과 저장하기
        </button>
      </div>
    </>
  );
}
