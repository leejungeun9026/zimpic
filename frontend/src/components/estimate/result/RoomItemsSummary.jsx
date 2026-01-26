export default function RoomItemsSummary({ roomSummaries, thumbUrls, vehicleText }) {
  return (
    <div className="card mb-4">
      <div className="card-header bg-white fw-bold">이삿짐 정보</div>
      <div className="card-body">
        {roomSummaries.map((r, idx) => {
          const entries = Object.entries(r.grouped);
          const top3 = entries.slice(0, 3);

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
                  {top3.length === 0 ? (
                    <div className="text-muted small">선택된 짐이 없습니다.</div>
                  ) : (
                    top3.map(([name, count]) => {
                      const sample = r.items.find((i) => i.name === name) || {};
                      const w = sample.width ?? 300;
                      const h = sample.height ?? 200;
                      const d = sample.depth ?? 100;

                      const hasAssembly = Boolean(sample.assemblyRequired);

                      return (
                        <div
                          key={name}
                          className="d-flex justify-content-between small py-1 border-bottom"
                        >
                          <span>
                            {name} {count}개{" "}
                            {hasAssembly ? (
                              <span className="badge bg-secondary ms-2">
                                분해/조립
                              </span>
                            ) : null}
                            {sample.isSpecial ? (
                              <span className="badge bg-warning text-dark ms-2">
                                특수
                              </span>
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
