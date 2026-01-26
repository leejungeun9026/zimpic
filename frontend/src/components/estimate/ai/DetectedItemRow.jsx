export default function DetectedItemRow({
  roomId,
  item,
  onToggle,
  onSizeChange,
}) {
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
        {/* 좌측: 체크 + 이름 */}
        <div className="d-flex align-items-center gap-2" style={{ minWidth: 180 }}>
          <input
            className="form-check-input mt-0"
            type="checkbox"
            checked={!!item.checked}
            onChange={() => onToggle(roomId, item.id)}
          />
          <div className="fw-semibold">{item.name}</div>
          <div className="text-muted small ms-2">{item.count ?? 1}개</div>
        </div>

        {/* 우측: W/H/D */}
        <div className="w-100 w-md-auto">
          <div className="row gx-2 gy-2 justify-content-md-end">
            <div className="col-auto">
              <div className="d-flex align-items-center" style={{ gap: 6 }}>
                <span className="text-muted small">W:</span>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  style={{ width: 72 }}
                  disabled={!item.checked}
                  value={item.width ?? 300}
                  onChange={(e) =>
                    onSizeChange(roomId, item.id, "width", e.target.value)
                  }
                />
                <span className="text-muted small">cm</span>
              </div>
            </div>

            <div className="col-auto">
              <div className="d-flex align-items-center" style={{ gap: 6 }}>
                <span className="text-muted small">H:</span>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  style={{ width: 72 }}
                  disabled={!item.checked}
                  value={item.height ?? 200}
                  onChange={(e) =>
                    onSizeChange(roomId, item.id, "height", e.target.value)
                  }
                />
                <span className="text-muted small">cm</span>
              </div>
            </div>

            <div className="col-auto">
              <div className="d-flex align-items-center" style={{ gap: 6 }}>
                <span className="text-muted small">D:</span>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  style={{ width: 72 }}
                  disabled={!item.checked}
                  value={item.depth ?? 100}
                  onChange={(e) =>
                    onSizeChange(roomId, item.id, "depth", e.target.value)
                  }
                />
                <span className="text-muted small">cm</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {item.isSpecial && (
        <div className="d-flex justify-content-end mt-2">
          <div className="form-check text-muted small">
            <input className="form-check-input" type="checkbox" disabled={!item.checked} />
            <label className="form-check-label">분해 및 조립 필요</label>
          </div>
        </div>
      )}
    </div>
  );
}
