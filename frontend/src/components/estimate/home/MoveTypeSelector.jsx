export default function MoveTypeSelector({ value, onChange }) {
  return (
    <>
      <p className="fw-bold mb-3">이사 유형 선택</p>

      <div className="row g-3">
        <div className="col-12 col-md-6">
          <button
            type="button"
            className={`w-100 text-start btn ${
              value === "normal"
                ? "btn-outline-primary border-2"
                : "btn-outline-secondary"
            }`}
            onClick={() => onChange("normal")}
          >
            <div className="fw-bold">일반 이사</div>
            <div className="text-muted small">
              고객이 직접 짐을 포장하고, 이사업체는 운반만 담당합니다.
            </div>
          </button>
        </div>

        <div className="col-12 col-md-6">
          <button
            type="button"
            className={`w-100 text-start btn ${
              value === "packing"
                ? "btn-outline-primary border-2"
                : "btn-outline-secondary"
            }`}
            onClick={() => onChange("packing")}
          >
            <div className="fw-bold">포장 이사</div>
            <div className="text-muted small">
              업체가 모든 짐을 포장, 운반, 정리합니다.
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
