import InfoTooltip from "../../common/InfoTooltip";

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
    <div className="d-flex flex-column gap-1">
      <div>{furniturePolicy.description}</div>

      {furniturePolicy.reference_model && (
        <div className="text-muted">참고: {furniturePolicy.reference_model}</div>
      )}

      {furniturePolicy.width_cm &&
        furniturePolicy.depth_cm &&
        furniturePolicy.height_cm && (
          <div className="text-muted">
            기준치: W : {furniturePolicy.width_cm} / D : {furniturePolicy.depth_cm} / H : {furniturePolicy.height_cm} (cm)
          </div>
        )}

      {furniturePolicy?.reference_url && (
        <a
          href={furniturePolicy.reference_url}
          target="_blank"
          rel="noopener noreferrer"
          className="d-flex align-items-center gap-2 mt-2 text-decoration-none"
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
      className="list-group-item"
      style={{
        opacity: item.checked ? 1 : 0.45,
        border: "none",
        borderBottom: "1px solid #EEF2F7",
        paddingTop: 14,
        paddingBottom: 14,
      }}
    >
      <div className="d-flex flex-column flex-md-row gap-2 gap-md-3 align-items-md-center justify-content-between">
        {/* 좌측 */}
        <div className="d-flex align-items-center gap-2" style={{ minWidth: 180 }}>
          <input
            className="form-check-input mt-0"
            type="checkbox"
            checked={!!item.checked}
            onChange={() => onToggle(roomId, item.id)}
          />

          <div className="fw-semibold">{item.name}</div>

          {tooltipContent && <InfoTooltip content={tooltipContent} />}

          <div className="text-muted small ms-1">{item.count ?? 1}개</div>
        </div>

        {/* 우측 */}
        <div className="w-100 w-md-auto">
          <div className="d-flex flex-wrap flex-lg-nowrap align-items-center justify-content-md-end gap-2">
            {/* W */}
            <div className="d-flex align-items-center" style={{ gap: 6 }}>
              <span className="text-muted small">W:</span>
              <input
                type="number"
                className="form-control form-control-sm"
                style={{ width: 72 }}
                disabled={!item.checked}
                value={item.width ?? 300}
                onChange={(e) => onSizeChange(roomId, item.id, "width", e.target.value)}
              />
              <span className="text-muted small">cm</span>
            </div>

            {/* H */}
            <div className="d-flex align-items-center" style={{ gap: 6 }}>
              <span className="text-muted small">H:</span>
              <input
                type="number"
                className="form-control form-control-sm"
                style={{ width: 72 }}
                disabled={!item.checked}
                value={item.height ?? 200}
                onChange={(e) => onSizeChange(roomId, item.id, "height", e.target.value)}
              />
              <span className="text-muted small">cm</span>
            </div>

            {/* D */}
            <div className="d-flex align-items-center" style={{ gap: 6 }}>
              <span className="text-muted small">D:</span>
              <input
                type="number"
                className="form-control form-control-sm"
                style={{ width: 72 }}
                disabled={!item.checked}
                value={item.depth ?? 100}
                onChange={(e) => onSizeChange(roomId, item.id, "depth", e.target.value)}
              />
              <span className="text-muted small">cm</span>
            </div>

            {item.manual && (
              <div className="w-100 w-lg-auto d-flex justify-content-end">
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  style={{ width: 32, height: 32, lineHeight: 1, padding: 0 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveManualItem?.(roomId, item.id);
                  }}
                  title="삭제"
                  aria-label={`${item.name} 삭제`}
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ✅ DB에서 분해/조립 가능인 품목만 표시 */}
      {disassemblyAvailable && (
        <div className="d-flex justify-content-end mt-2">
          <div className="form-check text-muted small">
            <input
              id={disassemblyId}
              className="form-check-input"
              type="checkbox"
              disabled={!item.checked}
              checked={disassemblyChecked}
              onChange={(e) => {
                const next = e.target.checked;
                onUpdateItem?.(roomId, item.id, { needsDisassembly: next });
              }}
            />
            <label className="form-check-label" htmlFor={disassemblyId}>
              분해 및 조립 필요
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
