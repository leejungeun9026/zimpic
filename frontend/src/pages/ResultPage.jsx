import { useNavigate } from "react-router-dom";
import StepIndicator from "../components/layout/StepIndicator";
import { useEstimateStore } from "../store/estimateStore";
import { useEffect, useMemo } from "react";

import ResultSummaryBox from "../components/estimate/result/ResultSummaryBox";
import SelectedInfoTable from "../components/estimate/result/SelectedInfoTable";
import RoomItemsSummary from "../components/estimate/result/RoomItemsSummary";
import PriceBreakdown from "../components/estimate/result/PriceBreakdown";
import ResultFooterActions from "../components/estimate/result/ResultFooterActions";

export default function ResultPage() {
  const navigate = useNavigate();

  const reset = useEstimateStore((s) => s.reset);
  const calculateResult = useEstimateStore((s) => s.calculateResult);

  const basicInfo = useEstimateStore((s) => s.basicInfo);
  const rooms = useEstimateStore((s) => s.rooms);
  const moveInfo = useEstimateStore((s) => s.moveInfo);
  const result = useEstimateStore((s) => s.result);

  const getItemsByRoom = useEstimateStore((s) => s.getItemsByRoom);

  useEffect(() => {
    calculateResult();
  }, [calculateResult]);

  const useLadder = Boolean(
    moveInfo.fromLadder || (!moveInfo.toUnknown && moveInfo.toLadder)
  );

  const distanceKm = result?.distanceKm ?? 12;
  const vehicleText = result?.vehicleText ?? "5톤 트럭 1대";

  const handlePrev = () => navigate("/AddressPage");
  const handleSave = () => alert("저장 기능은 서버 연동 후 제공됩니다 🙂");

  const roomSummaries = useMemo(() => {
    return rooms.map((room) => {
      const items = getItemsByRoom(room.id).filter((i) => i.checked);

      const grouped = {};
      items.forEach((i) => {
        const count = i.count ?? 1;
        grouped[i.name] = (grouped[i.name] || 0) + count;
      });

      const totalCount = Object.values(grouped).reduce((sum, n) => sum + n, 0);
      const specialCount = items.filter((i) => i.isSpecial).length;

      return {
        roomId: room.id,
        roomType: room.type,
        items,
        grouped,
        totalCount,
        specialCount,
        firstImageFile: room.images?.[0]?.file ?? null,
      };
    });
  }, [rooms, getItemsByRoom]);

  const totalItemCount = useMemo(() => {
    return roomSummaries.reduce((sum, r) => sum + r.totalCount, 0);
  }, [roomSummaries]);

  const totalSpecialCount = useMemo(() => {
    return roomSummaries.reduce((sum, r) => sum + r.specialCount, 0);
  }, [roomSummaries]);

  const thumbUrls = useMemo(() => {
    const map = new Map();
    roomSummaries.forEach((r) => {
      if (r.firstImageFile) {
        map.set(r.roomId, URL.createObjectURL(r.firstImageFile));
      }
    });
    return map;
  }, [roomSummaries]);

  useEffect(() => {
    return () => {
      thumbUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [thumbUrls]);

  if (!result) {
    return (
      <div className="container my-4 text-center">
        <p>결과 데이터가 없습니다.</p>
        <button
          className="btn btn-outline-primary"
          onClick={() => navigate("/HomePage")}
        >
          처음으로
        </button>
      </div>
    );
  }

  const moveTypeText = basicInfo.moveType || "포장 이사";
  const sizeText = `${basicInfo.size}평`;

  return (
    <div className="container my-4">
      <div className="card shadow-sm p-4">
        <StepIndicator currentStep={4} />

        {/* 1) 이사 비용 계산 결과 */}
        <div className="mb-4">
          <h3 className="fw-bold mb-2">이사 비용 계산 결과</h3>
          <p className="text-muted mb-3">
            입력하신 정보를 바탕으로 예상 이사 비용을 계산했습니다. 실제 비용은
            업체 견적에 따라 달라질 수 있습니다.
          </p>

          <ResultSummaryBox totalPrice={result.totalPrice} />

          <SelectedInfoTable
            moveTypeText={moveTypeText}
            sizeText={sizeText}
            moveInfo={moveInfo}
            distanceKm={distanceKm}
            useLadder={useLadder}
            totalSpecialCount={totalSpecialCount}
            totalItemCount={totalItemCount}
            vehicleText={vehicleText}
          />
        </div>

        {/* 2) 이삿짐 정보 */}
        <RoomItemsSummary
          roomSummaries={roomSummaries}
          thumbUrls={thumbUrls}
          vehicleText={vehicleText}
        />

        {/* 3) 견적 세부 내역 */}
        <PriceBreakdown
          breakdown={result.breakdown}
          totalPrice={result.totalPrice}
          useLadder={useLadder}
        />

        {/* 4) 하단 버튼 */}
        <ResultFooterActions
          onPrev={handlePrev}
          onSave={handleSave}
          onResetToHome={() => {
            reset();
            navigate("/HomePage");
          }}
        />
      </div>
    </div>
  );
}
