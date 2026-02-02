import { Trash } from "lucide-react";
import InfoPopover from "../../common/InfoPopover";

export default function DetectedItemRow({
  roomId,
  item,
  onToggle,
  onSizeChange,
  onRemoveManualItem,
  furniturePolicy,
  onUpdateItem,
}) {
  // DB 가구 정책 정보를 툴팁으로 보여줌
  const tooltipContent = furniturePolicy ? (
    <div className="text-start">
      <p className="mb-2">{furniturePolicy.description}</p>
      <div className="text-muted" style={{ fontSize: "12px" }}>
        {furniturePolicy.reference_model && (
          <>
            <b>사이즈 참고(cm)</b>
            <p>{furniturePolicy.reference_model} (너비 : {furniturePolicy.width_cm} / 깊이 : {furniturePolicy.depth_cm} / 높이 : {furniturePolicy.height_cm})</p>
          </>
        )}
      </div>
      {furniturePolicy?.reference_url && (
        <a
          href={furniturePolicy.reference_url}
          target="_blank"
          rel="noopener noreferrer"
          className="d-flex align-items-center gap-2 mt-1 text-decoration-none"
          onClick={(e) => e.stopPropagation()}
          style={{
            border: "1px solid #e9ecef",
            borderRadius: 10,
            padding: "8px 10px",
            background: "#fff",
          }}
        >
          <img
            src={`https://www.google.com/s2/favicons?domain=${new URL(
              furniturePolicy.reference_url
            ).hostname}&sz=64`}
            alt=""
            width={20}
            height={20}
            style={{ borderRadius: 4 }}
          />

          <div className="d-flex flex-column" style={{ minWidth: 0 }}>
            <div
              className="text-dark"
              style={{
                fontSize: 12,
                fontWeight: 600,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              참고 제품 보기
            </div>
            <div
              className="text-muted"
              style={{
                fontSize: 11,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {new URL(furniturePolicy.reference_url).hostname}
            </div>
          </div>

          <div className="ms-auto text-muted" style={{ fontSize: 12 }}>
            ↗
          </div>
        </a>
      )}
    </div>
  ) : null;

  // DB 정책상 "분해/조립 옵션을 보여줄 품목"인지 여부
  const disassemblyAvailable = (() => {
    if (!furniturePolicy) return false;
    const v =
      furniturePolicy.needs_disassembly
    return v == true;
  })();

  const disassemblyChecked = Boolean(item.needsDisassembly);

  // label 클릭/포커스 안정
  const disassemblyId = `disassembly-${roomId}-${item.id}`;

  return (
    <div
      className={`list-group-item border-0 border-bottom px-1 py-3 ${item.checked ? "opacity-1" : "opacity-50"}`}
    >
      <div className="row g-1 align-items-start">
        {/* 체크박스 & 아이템 이름 */}
        <div className="col12 col-sm-auto">
          <div className="d-flex align-items-center gap-1">
            <input
              className="form-check-input mt-0"
              type="checkbox"
              id={`${item.name}${item.id}`}
              checked={!!item.checked}
              onChange={() => onToggle(roomId, item.id)}
              style={{ cursor: "pointer" }}
            />
            <label htmlFor={`${item.name}${item.id}`} className="fw-semibold">
              {item.name}{""}
              <span className="ms-1">
                {item.count ? `${item.count}개` : ""}
              </span>
            </label>
            {item.manual && (
              <span className="ms-1 badge bg-primary bg-opacity-10 text-primary">
                직접 추가
              </span>
            )}
          </div>
        </div>

        {/* DB에서 분해/조립 가능인 품목만 표시 */}
        {disassemblyAvailable && (
          <div className="col12 col-sm-auto ms-sm-auto">
            <div className="form-check form-switch text-muted small" >
              <input
                id={disassemblyId}
                className="form-check-input"
                type="checkbox"
                role="switch"
                disabled={!item.checked}
                checked={disassemblyChecked}
                onChange={(e) => {
                  const next = e.target.checked;
                  onUpdateItem?.(roomId, item.id, { needsDisassembly: next });
                }}
                style={{ cursor: "pointer" }}
              />
              <label className="form-check-label" htmlFor={disassemblyId} style={{ cursor: "pointer" }}>
                분해 및 조립 필요
              </label>
            </div>
          </div>
        )}
      </div>

      {/* 가구 사이즈 */}
      <div className="row gy-2 mt-1">
        <div className="col">
          <div className="row flex-sm-nowrap flex-lg-nowrap align-items-center gx-2 gy-1">
            {/* W */}
            <div className="col-auto">
              <div className="d-flex align-items-center flex-nowrap gap-1">
                <span className="text-muted small text-nowrap">너비:</span>
                <input
                  type="text"
                  className="form-control form-control-sm text-end"
                  style={{ width: 50 }}
                  disabled={!item.checked}
                  value={item.width ?? ""}
                  onChange={(e) => onSizeChange(roomId, item.id, "width", e.target.value)}
                />
                <span className="text-muted small text-nowrap">cm</span>
              </div>
            </div>

            {/* D */}
            <div className="col-auto">
              <div className="d-flex align-items-center flex-nowrap gap-1">
                <span className="text-muted small text-nowrap">깊이:</span>
                <input
                  type="text"
                  className="form-control form-control-sm text-end"
                  style={{ width: 50 }}
                  disabled={!item.checked}
                  value={item.depth ?? ""}
                  onChange={(e) => onSizeChange(roomId, item.id, "depth", e.target.value)}
                />
                <span className="text-muted small text-nowrap">cm</span>
              </div>
            </div>

            {/* H */}
            <div className="col-auto">
              <div className="d-flex align-items-center flex-nowrap gap-1">
                <span className="text-muted small text-nowrap">높이:</span>
                <input
                  type="text"
                  className="form-control form-control-sm text-end"
                  style={{ width: 50 }}
                  disabled={!item.checked}
                  value={item.height ?? ""}
                  onChange={(e) => onSizeChange(roomId, item.id, "height", e.target.value)}
                />
                <span className="text-muted small text-nowrap">cm</span>
                {tooltipContent &&
                  <InfoPopover content={tooltipContent} />
                }
              </div>
            </div>
          </div>
        </div>
        <div className="col-sm-auto">
          {item.manual && (
            <button
              type="button"
              className="btn btn-danger btn-sm w-100 pe-3"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveManualItem?.(roomId, item.id);
              }}
              title="삭제"
              aria-label={`${item.name} 삭제`}
            >
              <Trash size={16} className="mb-1 me-1" />
              짐 삭제
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
