import { useEstimateStore } from "../../../store/estimateStore";
import TruckLoad3D from "./TruckLoad3D";

export default function RoomItemsSummary({
  roomSummaries,
  thumbUrls,
  vehicleText,
  specialFurnitureIdSet,
  boxesDescription,
}) {
  const result = useEstimateStore((s) => s.result);

  return (
    <div className="card rounded-3 border-secondary border-opacity-25">
      <div className="card-header p-3 p-sm-4 pb-0 pb-sm-0 bg-transparent border-0">
        <h5 className="fw-bold" style={{ fontSize: "18px" }}>이삿짐 정보</h5>
      </div>
      <div className="card-body p-3 p-sm-4">
        <div className="row gy-4">
          {roomSummaries.map((r, idx) => {
            const entries = Object.values(r.grouped);
            return (
              <div
                key={r.roomId}
                className="col-12"
              >
                <div className="fw-bold mb-2">{idx + 1}. {r.roomType}</div>
                <div className="row gy-2 gx-3">
                  <div className="col-12 col-sm-3">
                    {/* 썸네일 */}
                    <div
                      className="mx-auto rounded-2 overflow-hidden border bg-light"
                      style={{ maxWidth: "300px" }}
                    >
                      {thumbUrls.get(r.roomId) ? (
                        <img
                          src={thumbUrls.get(r.roomId)}
                          alt={r.roomType}
                          className="d-block w-100 h-100 object-fit-cover"
                        />
                      ) : null}
                    </div>
                  </div>

                  <div className="col-12 col-sm-9">
                    {/* 품목/치수 */}
                    <ul>
                      {entries.length == 0 ? (
                        <li>
                          <div className="text-muted small">선택된 이삿짐이 없어요.</div>
                        </li>
                      ) : (
                        entries.map((g) => {
                          const w = g.width ?? "0";
                          const h = g.height ?? "0";
                          const d = g.depth ?? "0";

                          // 분해/조립 여부는 needsDisassembly로 판단
                          const hasDisassembly = Boolean(g.needsDisassembly);
                          const isSpecial = specialFurnitureIdSet instanceof Set &&
                            g.furnitureId != null &&
                            specialFurnitureIdSet.has(Number(g.furnitureId));

                          return (
                            <li className="py-2 border-secondary border-bottom border-opacity-10 small">
                              <div className="row">
                                <div className="col">
                                  <p className="">
                                    {g.name} {g.count}개{" "}
                                  </p>
                                </div>
                                <div className="col-auto ms-auto">
                                  <span className="text-muted text-nowrap">
                                    사이즈 : {w} x {h} x {d}
                                  </span>
                                </div>
                                {(hasDisassembly || isSpecial) &&
                                  (
                                    <ul className="opacity-50 ps-3">
                                      {hasDisassembly && (
                                        <li>
                                          &middot; 분해/조립 필요
                                        </li>
                                      )}
                                      {isSpecial ? (
                                        <li>&middot; 특수가구 비용 추가</li>
                                      ) : null}
                                    </ul>
                                  )
                                }
                              </div>
                            </li>
                          );
                        })
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
          <div className="col-12">
            <div className="fw-bold mb-2">{roomSummaries.length + 1}. 잔짐 박스</div>
            <p className="small text-muted">{boxesDescription}</p>
          </div>
        </div>
        <div className="pt-3 pt-sm-4 mt-3 mt-sm-4 border-top">
          <TruckLoad3D result={result} />
          <div className="pt-3 pt-md-4 d-flex justify-content-between align-items-center">
            <div className="fw-bold fs-5">예상 이사 차량</div>
            <div className="fw-bold fs-5 text-primary">{vehicleText}</div>
          </div>
        </div>
      </div>

    </div>
  );
}
