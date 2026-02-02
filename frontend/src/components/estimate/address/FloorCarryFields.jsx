import { Info } from "lucide-react";

export default function FloorCarryFields({
  title,
  floorValue,
  onChangeFloor,
  elevatorChecked,
  onChangeElevator,
  ladderChecked,
  onChangeLadder,
  disabled,
  idPrefix, // from / to
}) {
  return (
    <>
      <div className="mb-4">
        <h6 className="form-label fw-semibold">{title} 층수</h6>
        <div className="d-flex align-items-baseline gap-3">
          <div className="d-flex align-items-baseline gap-1">
            <input
              type="number"
              inputMode="numeric"
              className="form-control rounded-1"
              placeholder="층수 입력"
              min={1}
              max={50}
              disabled={disabled}
              value={floorValue || ""}
              onChange={(e) => onChangeFloor(Number(e.target.value))}
            />
            <span >층</span>
          </div>
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
              엘리베이터 있음
            </label>
          </div>
        </div>
      </div>

      <div>
        <h6 className="form-label fw-semibold">사다리차 사용 여부</h6>
        <label
          htmlFor={`${idPrefix}-ladder`}
          className={`border rounded-2 p-2 ladder-card d-flex align-items-start gap-2 ${ladderChecked ? "checked border-primary border-opacity-25 bg-primary bg-opacity-10" : ""
            }`}
          style={{ cursor: "pointer" }}
        >
          <input
            className="form-check-input ms-1"
            type="checkbox"
            id={`${idPrefix}-ladder`}
            disabled={disabled}
            checked={!!ladderChecked}
            onChange={(e) => onChangeLadder(e.target.checked)}
          />

          <div>
            <div className="fw-semibold">사다리차 사용</div>
            <div className="text-muted small">
              고층 또는 대형 가구/가전 운반 시 필요
            </div>
          </div>
        </label>
      </div >

    </>
  );
}
