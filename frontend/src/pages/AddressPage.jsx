import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StepIndicator from "../components/layout/StepIndicator";
import { useEstimateStore } from "../store/estimateStore";

export default function AddressPage() {
  const navigate = useNavigate();
  const { moveInfo, setMoveInfo } = useEstimateStore();

  // 도착지 미정 여부 (true = 도착지 있음)
  const [hasDestination, setHasDestination] = useState(true);

  // 엘리베이터 기본값 true 보정
  useEffect(() => {
    setMoveInfo({
      fromElevator: moveInfo.fromElevator ?? true,
      toElevator: moveInfo.toElevator ?? true,
    });
    // eslint-disable-next-line
  }, []);

  // 도착지 미정 체크 해제 시 값 초기화
  useEffect(() => {
    if (!hasDestination) {
      setMoveInfo({
        toAddress: "",
        toFloor: 0,
        toElevator: true,
      });
    }
  }, [hasDestination, setMoveInfo]);

  // 입력 검증
  const isValid =
    moveInfo.fromAddress &&
    moveInfo.fromFloor > 0 &&
    (!hasDestination ||
      (moveInfo.toAddress && moveInfo.toFloor > 0));

  return (
    <div className="container my-4">
      <div className="card shadow-sm p-4">

        <StepIndicator currentStep={3} />

        <h2 className="mb-4">출발 / 도착 정보</h2>

        <div className="row g-4">
          {/* 출발지 */}
          <div className="col-md-6">
            <div className="card h-100">
              <div className="card-body">
                <h5 className="mb-3">출발지</h5>

                <div className="mb-3">
                  <label className="form-label">출발지 주소</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="예: 부산광역시 금정구"
                    value={moveInfo.fromAddress}
                    onChange={(e) =>
                      setMoveInfo({ fromAddress: e.target.value })
                    }
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">층수</label>
                  <input
                    type="number"
                    className="form-control"
                    min={1}
                    value={moveInfo.fromFloor}
                    onChange={(e) =>
                      setMoveInfo({ fromFloor: Number(e.target.value) })
                    }
                  />
                </div>

                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={moveInfo.fromElevator}
                    onChange={(e) =>
                      setMoveInfo({ fromElevator: e.target.checked })
                    }
                  />
                  <label className="form-check-label">
                    엘리베이터 있음
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* 도착지 */}
          <div className="col-md-6">
            <div className="card h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">도착지</h5>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={hasDestination}
                      onChange={(e) =>
                        setHasDestination(e.target.checked)
                      }
                    />
                    <label className="form-check-label">
                      도착지 있음
                    </label>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">도착지 주소</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="예: 부산광역시 부산진구"
                    disabled={!hasDestination}
                    value={moveInfo.toAddress}
                    onChange={(e) =>
                      setMoveInfo({ toAddress: e.target.value })
                    }
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">층수</label>
                  <input
                    type="number"
                    className="form-control"
                    min={1}
                    disabled={!hasDestination}
                    value={moveInfo.toFloor}
                    onChange={(e) =>
                      setMoveInfo({ toFloor: Number(e.target.value) })
                    }
                  />
                </div>

                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    disabled={!hasDestination}
                    checked={moveInfo.toElevator}
                    onChange={(e) =>
                      setMoveInfo({ toElevator: e.target.checked })
                    }
                  />
                  <label className="form-check-label">
                    엘리베이터 있음
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 참고사항 */}
        <h4 className="mt-5">참고사항</h4>
        <div className="card mt-2 bg-light">
          <div className="card-body text-muted small">
            <p className="mb-1">
              • 입력하신 정보는 작업 인원 및 장비 산정에 사용됩니다.
            </p>
            <p className="mb-1">
              • 엘리베이터가 없는 경우 추가 인력 또는 사다리차가 필요할 수 있습니다.
            </p>
          </div>
        </div>

        {/* 버튼 */}
        <div className="d-flex justify-content-between mt-4">
          <button
            className="btn btn-outline-secondary"
            onClick={() => navigate("/AICheckPage")}
          >
            이전
          </button>

          <button
            className="btn btn-primary"
            disabled={!isValid}
            onClick={() => navigate("/ResultPage")}
          >
            견적 보기
          </button>
        </div>

      </div>
    </div>
  );
}
