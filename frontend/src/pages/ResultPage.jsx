import { useNavigate } from "react-router-dom";
import StepIndicator from "../components/layout/StepIndicator";
import { useEstimateStore } from "../store/estimateStore";
import { useEffect, useMemo } from "react";

export default function ResultPage() {
  const navigate = useNavigate();
  const reset = useEstimateStore((state) => state.reset);

  const {
    basicInfo,
    detectedItems,
    moveInfo,
    result,
  } = useEstimateStore();

  const calculateResult = useEstimateStore(
    (state) => state.calculateResult
  );

  const handleReset = () => {
    reset();
    navigate("/HomePage");
  };

  useEffect(() => {
    calculateResult();
  }, [calculateResult]);

  /** ✅ 체크된 짐만 */
  const selectedItems = detectedItems.filter((item) => item.checked);

  /** ✅ 짐 이름 기준 그룹핑 + 수량 합산 */
  const groupedItems = useMemo(() => {
    const map = {};
    selectedItems.forEach((item) => {
      const count = item.count ?? 1;
      if (!map[item.name]) {
        map[item.name] = count;
      } else {
        map[item.name] += count;
      }
    });
    return map;
  }, [selectedItems]);

  /** ✅ 총 짐 개수 */
  const totalItemCount = Object.values(groupedItems).reduce(
    (sum, count) => sum + count,
    0
  );

  /** ✅ 장비 사용 여부 (UI용) */
  const useLadder =
    !moveInfo.fromElevator || !moveInfo.toElevator;
  const useCrane =
    basicInfo.size >= 30 && !moveInfo.fromElevator;

  if (!result) {
    return (
      <div className="container my-4 text-center">
        <p>결과 데이터가 없습니다.</p>
        <button
          className="btn btn-outline-primary"
          onClick={() => navigate("/")}
        >
          처음으로
        </button>
      </div>
    );
  }


  return (
    <div className="container my-4">
      <div className="card shadow-sm">
        <div className="card-body">

          <StepIndicator currentStep={4} />

          <h2 className="mb-4">이사 비용 계산 결과</h2>

          {/* AI 예상 비용 */}
          <div className="card bg-light mb-4">
            <div className="card-body text-center">
              <h4 className="mb-2">AI 예상 이사 비용</h4>
              <p className="fw-bold mb-0 fs-4">
                {result.totalPrice.toLocaleString()}원
              </p>
            </div>
          </div>

          {/* 짐 목록 */}
          <div className="row g-4 mb-4">
            <div className="col-md-6">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="mb-3">선택한 짐 목록</h5>
                  <ul className="list-group list-group-flush">
                    {Object.entries(groupedItems).map(
                      ([name, count]) => (
                        <li
                          key={name}
                          className="list-group-item d-flex justify-content-between"
                        >
                          <span>{name}</span>
                          <span>{count}개</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card h-100 bg-light text-center">
                <div className="card-body d-flex flex-column justify-content-center">
                  <p className="fw-bold mb-1">
                    총 짐 개수
                  </p>
                  <p className="fs-3 fw-bold mb-0">
                    {totalItemCount}개
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 비용 구성 */}
          <div className="row g-4 mb-4">
            <div className="col-md-6">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="mb-3">예상 비용 구성</h5>
                  <ul className="list-group list-group-flush">
                    <li className="list-group-item d-flex justify-content-between">
                      <span>기본 비용</span>
                      <span>
                        {result.breakdown.basePrice.toLocaleString()}원
                      </span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between">
                      <span>짐 추가 비용</span>
                      <span>
                        +{result.breakdown.itemPrice.toLocaleString()}원
                      </span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between">
                      <span>층수 추가 비용</span>
                      <span>
                        +{result.breakdown.floorExtra.toLocaleString()}원
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card h-100 text-center">
                <div className="card-body d-flex flex-column justify-content-center">
                  <h5>예상 총 비용</h5>
                  <p className="fs-3 fw-bold text-primary mb-0">
                    {result.totalPrice.toLocaleString()}원
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 이사 정보 요약 */}
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="mb-3">이사 정보 요약</h5>
              <div className="row">
                <div className="col-md-6 mb-2">
                  <strong>출발지 :</strong> {moveInfo.fromAddress}
                </div>
                <div className="col-md-6 mb-2">
                  <strong>도착지 :</strong>{" "}
                  {moveInfo.toAddress || "미정"}
                </div>
                <div className="col-md-6 mb-2">
                  <strong>평수 :</strong> {basicInfo.size}평
                </div>
                <div className="col-md-6 mb-2">
                  <strong>방 개수 :</strong> {basicInfo.roomCount}개
                </div>
                <div className="col-md-6 mb-2">
                  <strong>사다리차 :</strong>{" "}
                  {useLadder ? "필요" : "불필요"}
                </div>
                <div className="col-md-6 mb-2">
                  <strong>크레인 :</strong>{" "}
                  {useCrane ? "필요" : "불필요"}
                </div>
              </div>
            </div>
          </div>

          {/* 버튼 */}
          <div className="text-center">
            <button
              className="btn btn-outline-primary"
              onClick={handleReset}
            >
              다시 계산하기
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
