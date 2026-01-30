import InfoTooltip from "../../common/InfoTooltip";

export default function SelectedInfoTable({
  moveTypeText,
  sizeText,
  moveInfo,
  distanceKm,
  ladderText,
  totalSpecialCount,
  totalItemCount,
  boxesCount,
  boxesDescription,
}) {
  const hasBoxes = typeof boxesCount === "number" && boxesCount > 0;

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

              {/* 이사 박스 (툴팁) */}
              {hasBoxes ? (
                <tr>
                  <td className="text-muted">
                    이사 박스(5호)
                    <span className="ms-2 align-middle">
                      <InfoTooltip
                        content={
                          <div style={{ fontSize: 13, lineHeight: 1.4 }}>
                            {boxesDescription || "평수 기준 평균 박스 수로 계산했어요."}
                          </div>
                        }
                      />
                    </span>
                  </td>
                  <td className="text-end fw-semibold">예상 {boxesCount}개</td>
                </tr>
              ) : null}

              <tr>
                <td className="text-muted">출발지 정보</td>
                <td className="text-end fw-semibold">
                  {moveInfo.fromFloor || "-"}층 ·{" "}
                  {moveInfo.fromElevator ? "엘리베이터 있음" : "엘리베이터 없음"}
                </td>
              </tr>

              <tr>
                <td className="text-muted">도착지 정보</td>
                <td className="text-end fw-semibold">
                  {moveInfo.toUnknown
                    ? "미정"
                    : `${moveInfo.toFloor || "-"}층 · ${
                        moveInfo.toElevator ? "엘리베이터 있음" : "엘리베이터 없음"
                      }`}
                </td>
              </tr>

              <tr>
                <td className="text-muted">예상 거리</td>
                <td className="text-end fw-semibold">{distanceKm}km</td>
              </tr>

              <tr>
                <td className="text-muted">사다리차 사용 여부</td>
                <td className="text-end fw-semibold">
                  {ladderText ?? (moveInfo?.toUnknown ? "미사용 (도착지 미정)" : "미사용")}
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
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
