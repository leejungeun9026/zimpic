function SummaryRow({
  label,
  value,
  border = true,
}) {
  return (
    <li className={`row align-items-baseline g-1 py-2 ${border ? "border-secondary border-bottom border-opacity-10" : ""}`}>
      <div className="col-12 col-sm">
        <p className="text-muted small">{label}</p>
      </div>
      <div className="col-12 col-sm text-sm-end">
        <p className="fw-medium">{value}</p>
      </div>
    </li>
  );
}


export default function SelectedInfoTable({
  moveTypeText,
  sizeText,
  moveInfo,
  distanceKm,
  ladderText,
  totalSpecialCount,
  originAddress,
  destAddress,
}) {

  return (
    <div className="card rounded-3 border-secondary border-opacity-25">
      <div className="card-header p-3 p-sm-4 pb-0 pb-sm-0 bg-transparent border-0">
        <h5 className="fw-bold" style={{ fontSize: "18px" }}>선택 정보</h5>
      </div>
      <div className="card-body px-3 px-sm-4">
        <ul>
          <SummaryRow label="이사 유형" value={moveTypeText} />
          <SummaryRow label="평수" value={sizeText} />
          <SummaryRow label="출발지 정보"
            value={
              <>
                {originAddress || "주소 정보 없음"} &middot; {moveInfo.fromFloor || ""}층<br />
                {moveInfo.fromElevator ? "엘리베이터 있음" : "엘리베이터 없음"}
              </>
            } />
          <SummaryRow label="도착지 정보"
            value={
              <>
                {destAddress || (moveInfo?.toUnknown ? "도착지 미정" : "주소 정보 없음")} &middot; {moveInfo.toFloor || ""}층<br />
                {moveInfo.toElevator ? "엘리베이터 있음" : "엘리베이터 없음"}
              </>
            } />
          <SummaryRow label="예상 이동 거리" value={<>{distanceKm}km</>} />
          <SummaryRow label="사다리차 사용 여부"
            value={<>
              {ladderText ?? (moveInfo?.toUnknown ? "미사용 (도착지 미정)" : "미사용")}
            </>}
          />
          {totalSpecialCount > 0 &&
            <SummaryRow label="특수 이삿짐" value={
              <>
                총 {totalSpecialCount}개
              </>
            } />
          }

        </ul>
      </div>
    </div>
  );
}
