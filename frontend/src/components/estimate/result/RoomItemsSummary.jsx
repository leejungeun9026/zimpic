export default function RoomItemsSummary({ roomSummaries, thumbUrls, vehicleText, specialFurnitureIdSet }) {
  return (
    <div className="card mb-4">
      <div className="card-header bg-white fw-bold">이삿짐 정보</div>
      <div className="card-body">
        {roomSummaries.map((r, idx) => {
          const entries = Object.values(r.grouped);

          return (
            <div
              key={r.roomId}
              className={idx === roomSummaries.length - 1 ? "" : "mb-4"}
            >
              <div className="fw-bold mb-2">{r.roomType}</div>

              <div className="d-flex gap-3 align-items-start">
                {/* 썸네일 */}
                <div
                  style={{
                    width: 86,
                    height: 86,
                    background: "#E9EEF5",
                    borderRadius: 8,
                    flex: "0 0 auto",
                    overflow: "hidden",
                    border: "1px solid #DEE6F2",
                  }}
                >
                  {thumbUrls.get(r.roomId) ? (
                    <img
                      src={thumbUrls.get(r.roomId)}
                      alt="thumb"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : null}
                </div>

                {/* 품목/치수 */}
                <div className="flex-grow-1">
                  {entries.length === 0 ? (
                    <div className="text-muted small">선택된 짐이 없습니다.</div>
                  ) : (
                    entries.map((g) => {
                      const w = g.width ?? 300;
                      const h = g.height ?? 200;
                      const d = g.depth ?? 100;

                      // 분해/조립 여부는 needsDisassembly로 판단
                      const hasDisassembly = Boolean(g.needsDisassembly);
                      const isSpecial = specialFurnitureIdSet instanceof Set &&
                      g.furnitureId != null &&
                      specialFurnitureIdSet.has(Number(g.furnitureId));

                      return (
                        <div
                          key={g.key}
                          className="d-flex justify-content-between small py-1 border-bottom"
                        >
                          <span>
                            {g.name} {g.count}개{" "}
                            {hasDisassembly ? (
                              <span className="badge bg-secondary ms-2">
                                분해/조립
                              </span>
                            ) : null}
                            {isSpecial ? (
                             <span className="badge bg-warning text-dark ms-2">특수가구</span>
                            ) : null}
                          </span>
                          <span className="text-muted">
                            {w}*{h}*{d}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div className="d-flex justify-content-between align-items-center border-top pt-3 mt-3">
          <div className="fw-bold">예상 이사 차량</div>
          <div className="fw-bold">{vehicleText}</div>
        </div>
      </div>
    </div>
  );
}
