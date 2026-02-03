import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import StepIndicator from "../components/layout/StepIndicator";
import { useEstimateStore } from "../store/estimateStore";
import LocationSection from "../components/estimate/address/LocationSection";

export default function AddressPage() {
  const navigate = useNavigate();

  const moveInfo = useEstimateStore((s) => s.moveInfo);
  const setMoveInfo = useEstimateStore((s) => s.setMoveInfo);

  const calculateResult = useEstimateStore((s) => s.calculateResult);
  const loading = useEstimateStore((s) => s.loading);

  const handlePrev = () => navigate("/AICheckPage");

  const isDestinationUnknown = !!moveInfo.toUnknown;

  // ✅ sample3 방식: 출발지/도착지 각각 wrap ref
  const fromWrapRef = useRef(null);
  const toWrapRef = useRef(null);

  // ✅ sample3 방식: 접기
  const foldDaumPostcode = (type) => {
    const wrap = type === "from" ? fromWrapRef.current : toWrapRef.current;
    if (wrap) wrap.style.display = "none";
  };

  // 도착지 미정이면 도착지 관련 값 초기화
  useEffect(() => {
    if (isDestinationUnknown) {
      setMoveInfo({
        toAddress: "",
        toFloor: 1,
        toElevator: false,
        toLadder: false,
      });
    }
  }, [isDestinationUnknown, setMoveInfo]);

  // 검증
  const isValid =
    !!moveInfo.fromAddress?.trim() &&
    moveInfo.fromFloor > 0 &&
    (isDestinationUnknown ||
      (!!moveInfo.toAddress?.trim() && moveInfo.toFloor > 0));

  const handleNext = async () => {
    if (!isValid || loading) return;

    setMoveInfo({
      fromAddress: (moveInfo.fromAddress ?? "").trim(),
      ...(isDestinationUnknown
        ? { toAddress: "" }
        : { toAddress: (moveInfo.toAddress ?? "").trim() }),
    });

    try {
      await calculateResult();
      navigate("/ResultPage");
    } catch (e) {
      console.error(e);
      alert("견적 계산에 실패했습니다.");
    }
  };

  // ✅ sample3 방식으로 변경: open() -> embed(wrap)
  const openPostcode = (type) => {
    if (!window?.daum?.Postcode) {
      alert("주소 검색 스크립트가 로드되지 않았어요.");
      return;
    }

    const wrap = type === "from" ? fromWrapRef.current : toWrapRef.current;
    if (!wrap) return;

    // 현재 scroll 위치 저장 (sample3)
    const currentScroll = Math.max(
      document.body.scrollTop,
      document.documentElement.scrollTop
    );

    new window.daum.Postcode({
      oncomplete: (data) => {
        // sample3처럼 R/J에 따라 주소 선택
        const addr =
          data.userSelectedType === "R" ? data.roadAddress : data.jibunAddress;

        if (type === "from") {
          setMoveInfo({ fromAddress: (addr || "").trim() });
        } else {
          setMoveInfo({
            toUnknown: false,
            toAddress: (addr || "").trim(),
          });
        }

        // iframe을 넣은 element를 안보이게 한다. (sample3)
        wrap.style.display = "none";

        // scroll 복원 (sample3)
        document.body.scrollTop = currentScroll;
        document.documentElement.scrollTop = currentScroll;
      },

      // iframe 크기 변경 시 wrap 높이 조절 (sample3)
      onresize: (size) => {
        wrap.style.height = size.height + "px";
      },

      width: "100%",
      height: "100%",
    }).embed(wrap);

    // iframe을 넣은 element를 보이게 한다. (sample3)
    wrap.style.display = "block";
  };

  return (
    <div className="container-fluid py-4">
      <div className="page_card">
        <div className="card-body">
          <StepIndicator currentStep={3} />

          <article className="title mb-4">
            <h2 className="fw-bold mb-2">주소 입력</h2>
            <p className="text-muted small">출발지와 도착지 정보를 입력해 주세요.</p>
          </article>

          <section className="mb-4">
            {/* 출발지 */}
            <LocationSection
              title="출발지"
              idPrefix="from"
              right={null}
              addressValue={moveInfo.fromAddress}
              addressDisabled={loading}
              onFindAddress={() => openPostcode("from")}
              addressBelow={
                <div
                  ref={fromWrapRef}
                  style={{
                    display: "none",
                    border: "1px solid #dee2e6",
                    width: "100%",
                    height: 320,
                    marginTop: -38,
                    position: "relative",
                  }}
                >
                  <img
                    src="//t1.daumcdn.net/postcode/resource/images/close.png"
                    alt="접기 버튼"
                    style={{
                      cursor: "pointer",
                      position: "absolute",
                      right: "0px",
                      top: "-1px",
                      zIndex: 1,
                    }}
                    onClick={() => foldDaumPostcode("from")}
                  />
                </div>
              }
              floorValue={moveInfo.fromFloor}
              onChangeFloor={(v) => setMoveInfo({ fromFloor: v })}
              elevatorChecked={moveInfo.fromElevator}
              onChangeElevator={(v) => setMoveInfo({ fromElevator: v })}
              ladderChecked={moveInfo.fromLadder}
              onChangeLadder={(v) => setMoveInfo({ fromLadder: v })}
              fieldsDisabled={loading}
            />
          </section>

          <section>
            {/* 도착지 */}
            <LocationSection
              title="도착지"
              idPrefix="to"
              right={
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="dest-unknown"
                    checked={isDestinationUnknown}
                    onChange={(e) => setMoveInfo({ toUnknown: e.target.checked })}
                    disabled={loading}
                  />
                  <label className="form-check-label" htmlFor="dest-unknown">
                    도착지 미정
                  </label>
                </div>
              }
              addressValue={moveInfo.toAddress}
              addressDisabled={isDestinationUnknown || loading}
              onFindAddress={() => openPostcode("to")}
              addressBelow={
                <div
                  ref={toWrapRef}
                  style={{
                    display: "none",
                    border: "1px solid #dee2e6",
                    width: "100%",
                    height: 320,
                    marginTop: -38,
                    position: "relative",
                  }}
                >
                  <img
                    src="//t1.daumcdn.net/postcode/resource/images/close.png"
                    alt="접기 버튼"
                    style={{
                      cursor: "pointer",
                      position: "absolute",
                      right: "0px",
                      top: "-1px",
                      zIndex: 1,
                    }}
                    onClick={() => foldDaumPostcode("to")}
                  />
                </div>
              }
              floorValue={moveInfo.toFloor}
              onChangeFloor={(v) => setMoveInfo({ toFloor: v })}
              elevatorChecked={moveInfo.toElevator}
              onChangeElevator={(v) => setMoveInfo({ toElevator: v })}
              ladderChecked={moveInfo.toLadder}
              onChangeLadder={(v) => setMoveInfo({ toLadder: v })}
              fieldsDisabled={isDestinationUnknown || loading}
            />
          </section>

          <div className="d-flex justify-content-between mt-4">
            <button
              className="btn btn-lg fs-6 btn-light text-secondary rounded-2"
              onClick={handlePrev}
              disabled={loading}
            >
              이전 단계
            </button>
            <button
              className="ms-auto btn btn-lg fs-6 btn-primary rounded-2"
              disabled={!isValid || loading}
              onClick={handleNext}
            >
              {loading ? "계산 중..." : "견적 확인하기"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
