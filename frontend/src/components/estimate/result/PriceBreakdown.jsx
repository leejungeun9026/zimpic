export default function PriceBreakdown({ sections, totalPrice }) {
  const formatWon = (n) => `${Number(n ?? 0).toLocaleString()}원`;

  const safeSections = Array.isArray(sections) ? sections : [];

  // 서버 섹션을 우리가 원하는 순서로 보여주기
  const ORDER = ["BASE", "LADDER", "STAIRS", "DISTANCE", "SPECIAL", "ASSEMBLY"];

  const sortedSections = [...safeSections].sort((a, b) => {
    const ai = ORDER.indexOf(a?.key);
    const bi = ORDER.indexOf(b?.key);
    const ax = ai === -1 ? 999 : ai;
    const bx = bi === -1 ? 999 : bi;
    return ax - bx;
  });

  const renderSection = (s) => {
    const key = s?.key ?? "";
    const title = s?.title ?? key;
    const amount = Number(s?.amount ?? 0);
    const desc = s?.description;
    const lines = Array.isArray(s?.lines) ? s.lines : [];

    // 0원 섹션은 숨김
    if (amount === 0) return null;

    // 사다리차 문구: 서버 amount 기준
    const subtitle = key === "LADDER" ? null : desc;

    return (
      <div key={key} className="py-3 border-bottom">
        <div className="d-flex justify-content-between">
          <div>
            <div className="fw-bold">{title}</div>
          </div>
          <div className="fw-bold">
            {key === "BASE" ? formatWon(amount) : `+${formatWon(amount)}`}
          </div>
        </div>

        {/* 라인 아이템(분해/조립 포함)이 있으면 상세 표시 */}
        {subtitle ? <div className="small opacity-50">{subtitle}</div> : null}
        {lines.length > 0 && (
          <ul className="">
            {lines.map((l, idx) => {
              const lineAmount = Number(l?.amount ?? 0);
              const lineDesc = l?.description ?? "";

              // 0원 라인은 보통 의미 없어서 숨김
              if (!lineDesc && lineAmount === 0) return null;

              return (
                <li
                  key={`${key}-line-${idx}`}
                  className="d-flex justify-content-between small opacity-50"
                  style={{ gap: 12 }}
                >
                  <div style={{ minWidth: 0 }}>&middot; {lineDesc || "세부 항목"}</div>
                  <div style={{ whiteSpace: "nowrap" }}>
                    {lineAmount ? formatWon(lineAmount) : ""}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  };

  // 서버 sections만 사용. 없으면 안내만.
  if (!sortedSections.length) {
    return (
      <div className="card mb-4">
        <div className="card-header bg-white fw-bold">견적 세부 내역</div>
        <div className="card-body text-muted">세부 내역이 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="card rounded-3 border-secondary border-opacity-25">
      <div className="card-header p-3 p-sm-4 pb-0 pb-sm-0 bg-transparent border-0">
        <h5 className="fw-bold" style={{ fontSize: "18px" }}>견적 세부 내역</h5>
      </div>
      <div className="card-body px-3 px-sm-4">
        {sortedSections.map(renderSection).filter(Boolean)}
        <div className="mt-3 mt-sm-4 d-flex justify-content-between align-items-center">
          <div className="fw-bold fs-5">총 예상 비용</div>
          <div className="fw-bold fs-5 text-primary">{formatWon(totalPrice || 0)}</div>
        </div>
      </div>
    </div>
  );
}
