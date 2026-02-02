import { Info } from "lucide-react";

export default function ResultSummaryBox({ totalPrice }) {
  return (
    <div
      className="p-4 rounded bg-primary bg-opacity-10 border border-primary border-opacity-10  text-center"
    >
      <p className="text-primary fw-bold mb-2">예상 이사 비용</p>
      <h1 className="fw-bold text-primary">
        {Number(totalPrice || 0).toLocaleString()}원
      </h1>

      <div className="mt-3 small text-muted">
        <Info size={16} className="me-1" />
        비수기 평일을 기준으로 계산했어요. <br />
        성수기(손 없는 날 또는 주말/공휴일) 이사인 경우 추가 비용이 발생할 수 있어요.
      </div>
    </div>
  );
}
