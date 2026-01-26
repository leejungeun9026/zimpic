export default function SelectedInfoTable({
  moveTypeText,
  sizeText,
  moveInfo,
  distanceKm,
  useLadder,
  totalSpecialCount,
  totalItemCount,
  vehicleText,
}) {
  return (
    <div className="card mt-4">
      <div className="card-header bg-white fw-bold">선택 정보</div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table mb-0">
            <tbody>
              <tr>
                <td className="text-muted" style={{ width: "45%" }}>
                  이사 유형
                </td>
                <td className="text-end fw-semibold">{moveTypeText}</td>
              </tr>
              <tr>
                <td className="text-muted">평수</td>
                <td className="text-end fw-semibold">{sizeText}</td>
              </tr>
              <tr>
                <td className="text-muted">출발지 정보</td>
                <td className="text-end fw-semibold">
                  {moveInfo.fromFloor || "-"}층 ·{" "}
                  {moveInfo.fromElevator ? "엘리베이터" : "엘리베이터 없음"}
                  {moveInfo.fromLadder ? " · 사다리차" : ""}
                </td>
              </tr>
              <tr>
                <td className="text-muted">도착지 정보</td>
                <td className="text-end fw-semibold">
                  {moveInfo.toUnknown
                    ? "미정"
                    : `${moveInfo.toFloor || "-"}층 · ${
                        moveInfo.toElevator ? "엘리베이터" : "엘리베이터 없음"
                      }${moveInfo.toLadder ? " · 사다리차" : ""}`}
                </td>
              </tr>
              <tr>
                <td className="text-muted">예상 거리</td>
                <td className="text-end fw-semibold">{distanceKm}km</td>
              </tr>
              <tr>
                <td className="text-muted">사다리차 사용 여부</td>
                <td className="text-end fw-semibold">
                  {useLadder ? "사용" : "미사용"}
                </td>
              </tr>
              <tr>
                <td className="text-muted">특수 이삿짐</td>
                <td className="text-end fw-semibold">총 {totalSpecialCount}개</td>
              </tr>
              <tr>
                <td className="text-muted">선택한 짐</td>
                <td className="text-end fw-semibold">총 {totalItemCount}개</td>
              </tr>
              <tr>
                <td className="text-muted">예상 이사 차량</td>
                <td className="text-end fw-semibold">{vehicleText}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
