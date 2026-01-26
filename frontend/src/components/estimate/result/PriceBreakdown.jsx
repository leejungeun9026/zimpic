export default function PriceBreakdown({ breakdown, totalPrice, useLadder }) {
  const basePrice = breakdown?.basePrice ?? 0;
  const ladderPrice = breakdown?.ladderPrice ?? 0;
  const specialPrice = breakdown?.specialPrice ?? 0;

  // ✅ 현재 store 계산에는 assemblyPrice가 없어서 0 처리(기존 UI 유지)
  const assemblyPrice = breakdown?.assemblyPrice ?? 0;

  return (
    <div className="card mb-4">
      <div className="card-header bg-white fw-bold">견적 세부 내역</div>
      <div className="card-body">
        <div className="d-flex justify-content-between mb-2">
          <div>
            <div className="fw-bold">기본 이사 비용</div>
            <div className="text-muted small">기본 운반/작업 비용</div>
          </div>
          <div className="fw-bold">{Number(basePrice).toLocaleString()}원</div>
        </div>

        <hr />

        <div className="d-flex justify-content-between mb-2">
          <div>
            <div className="fw-bold">사다리차 비용</div>
            <div className="text-muted small">
              {useLadder ? "사다리차 사용" : "미사용"}
            </div>
          </div>
          <div className="fw-bold text-muted">
            +{Number(ladderPrice).toLocaleString()}원
          </div>
        </div>

        <hr />

        <div className="d-flex justify-content-between mb-2">
          <div>
            <div className="fw-bold">특수 이삿짐 비용</div>
            <div className="text-muted small">에어컨/피아노 등</div>
          </div>
          <div className="fw-bold text-muted">
            +{Number(specialPrice).toLocaleString()}원
          </div>
        </div>

        <hr />

        <div className="d-flex justify-content-between mb-2">
          <div>
            <div className="fw-bold">분해/조립 비용</div>
            <div className="text-muted small">조립/해체 필요한 물품</div>
          </div>
          <div className="fw-bold text-muted">
            +{Number(assemblyPrice).toLocaleString()}원
          </div>
        </div>

        <hr />

        <div className="d-flex justify-content-between align-items-center mt-3">
          <div className="fw-bold">총 예상 비용</div>
          <div className="fw-bold" style={{ fontSize: 20 }}>
            {Number(totalPrice || 0).toLocaleString()}원
          </div>
        </div>
      </div>
    </div>
  );
}
