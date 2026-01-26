import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StepIndicator from "../components/layout/StepIndicator";
import { useEstimateStore } from "../store/estimateStore";

import LocationSection from "../components/estimate/address/LocationSection";

export default function AddressPage() {
  const navigate = useNavigate();

  const moveInfo = useEstimateStore((s) => s.moveInfo);
  const setMoveInfo = useEstimateStore((s) => s.setMoveInfo);

  const handlePrev = () => navigate("/AICheckPage");
  const handleNext = () => navigate("/ResultPage");

  // ✅ 도착지 미정 = store 값
  const isDestinationUnknown = !!moveInfo.toUnknown;

  // ✅ 도착지 미정이면 도착지 관련 값 초기화(체크박스는 false로)
  useEffect(() => {
    if (isDestinationUnknown) {
      setMoveInfo({
        toAddress: "",
        toFloor: 0,
        toElevator: false,
        toLadder: false,
      });
    }
  }, [isDestinationUnknown, setMoveInfo]);

  // ✅ 검증
  const isValid =
    moveInfo.fromAddress &&
    moveInfo.fromAddress.trim().length > 0 &&
    moveInfo.fromFloor > 0 &&
    (isDestinationUnknown ||
      (moveInfo.toAddress &&
        moveInfo.toAddress.trim().length > 0 &&
        moveInfo.toFloor > 0));

  /**
   * ✅ 다음 우편번호 팝업 열기
   * type: "from" | "to"
   */
  const openPostcode = (type) => {
    if (!window?.daum?.Postcode) {
      alert(
        "주소 검색 스크립트가 로드되지 않았어요. index.html에 postcode 스크립트를 추가했는지 확인해 주세요."
      );
      return;
    }

    new window.daum.Postcode({
      oncomplete: (data) => {
        const address = data.roadAddress || data.address || "";

        if (type === "from") {
          setMoveInfo({ fromAddress: address });
        } else {
          setMoveInfo({
            toUnknown: false,
            toAddress: address,
          });
        }
      },
    }).open();
  };

  return (
    <div className="container my-4">
      <div className="card shadow-sm p-4">
        <StepIndicator currentStep={3} />

        <h2 className="mb-2">주소 입력</h2>
        <p className="text-muted mb-4">
          이사 견적 산출을 위해 출발지와 도착지 정보를 입력해 주세요.
        </p>

        {/* 출발지 */}
        <LocationSection
          title="출발지 정보"
          idPrefix="from"
          right={null}
          addressValue={moveInfo.fromAddress}
          addressDisabled={false}
          onFindAddress={() => openPostcode("from")}
          floorValue={moveInfo.fromFloor}
          onChangeFloor={(v) => setMoveInfo({ fromFloor: v })}
          elevatorChecked={moveInfo.fromElevator}
          onChangeElevator={(v) => setMoveInfo({ fromElevator: v })}
          ladderChecked={moveInfo.fromLadder}
          onChangeLadder={(v) => setMoveInfo({ fromLadder: v })}
          fieldsDisabled={false}
          hint={true}
          bottomNote={null}
        />

        {/* 도착지 */}
        <LocationSection
          title="도착지 정보"
          idPrefix="to"
          right={
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="dest-unknown"
                checked={isDestinationUnknown}
                onChange={(e) => setMoveInfo({ toUnknown: e.target.checked })}
              />
              <label className="form-check-label" htmlFor="dest-unknown">
                도착지 미정
              </label>
            </div>
          }
          addressValue={moveInfo.toAddress}
          addressDisabled={isDestinationUnknown}
          onFindAddress={() => openPostcode("to")}
          floorValue={moveInfo.toFloor}
          onChangeFloor={(v) => setMoveInfo({ toFloor: v })}
          elevatorChecked={moveInfo.toElevator}
          onChangeElevator={(v) => setMoveInfo({ toElevator: v })}
          ladderChecked={moveInfo.toLadder}
          onChangeLadder={(v) => setMoveInfo({ toLadder: v })}
          fieldsDisabled={isDestinationUnknown}
          hint={false}
          bottomNote={
            isDestinationUnknown
              ? "도착지가 미정이면 도착지 정보는 나중에 입력할 수 있어요."
              : null
          }
        />

        {/* 버튼 */}
        <div className="d-flex justify-content-between mt-4">
          <button className="btn btn-outline-secondary px-4" onClick={handlePrev}>
            이전 단계
          </button>

          <button
            className="btn btn-primary px-4"
            disabled={!isValid}
            onClick={handleNext}
          >
            견적 확인하기
          </button>
        </div>
      </div>
    </div>
  );
}
