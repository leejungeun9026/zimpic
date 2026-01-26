export default function ResultSummaryBox({ totalPrice }) {
  return (
    <div
      className="p-4 rounded"
      style={{
        background: "#EEF5FF",
        border: "1px solid #D6E6FF",
        textAlign: "center",
      }}
    >
      <div className="text-primary fw-bold mb-2">예상 이사 비용</div>

      <div className="fw-bold" style={{ fontSize: 32, color: "#2F6BFF" }}>
        {Number(totalPrice || 0).toLocaleString()}원
      </div>

      <div className="mt-3 small" style={{ color: "#4B5563" }}>
        ※ 손없는날 또는 주말/공휴일 이사인 경우 추가 비용이 발생할 수 있어요.
      </div>
    </div>
  );
}
