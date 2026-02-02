export default function FloorCarryFields({
  floorValue,
  onChangeFloor,
  elevatorChecked,
  onChangeElevator,
  ladderChecked,
  onChangeLadder,
  disabled,
  idPrefix, // from / to
  showHint,
}) {
  return (
    <div className="row g-3 align-items-end">
      <div className="col-12 col-md-5">
        <label className="form-label fw-semibold">층수</label>
        <div className="d-flex align-items-baseline gap-2">
          <input
            type="number"
            inputMode="numeric"
            className="form-control rounded-1"
            placeholder="층수 입력"
            min={1}
            disabled={disabled}
            value={floorValue || ""}
            onChange={(e) => onChangeFloor(Number(e.target.value))}
          />
          <span >층</span>
        </div>
      </div>

      <div className="col-12 col-md-7">
        <label className="form-label fw-semibold">운반 방식</label>
        <div className="d-flex gap-4 flex-wrap">
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id={`${idPrefix}-elevator`}
              disabled={disabled}
              checked={!!elevatorChecked}
              onChange={(e) => onChangeElevator(e.target.checked)}
            />
            <label className="form-check-label" htmlFor={`${idPrefix}-elevator`}>
              엘리베이터
            </label>
          </div>

          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id={`${idPrefix}-ladder`}
              disabled={disabled}
              checked={!!ladderChecked}
              onChange={(e) => onChangeLadder(e.target.checked)}
            />
            <label className="form-check-label" htmlFor={`${idPrefix}-ladder`}>
              사다리차
            </label>
          </div>
        </div>

        {showHint && (
          <div className="text-muted small mt-2">
            필요 장비가 없으면 체크하지 않아도 됩니다.
          </div>
        )}
      </div>
    </div>
  );
}
