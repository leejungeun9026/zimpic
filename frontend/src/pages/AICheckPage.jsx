import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import StepIndicator from "../components/layout/StepIndicator";
import { useEstimateStore } from "../store/estimateStore";

import RoomAnalysisSection from "../components/estimate/ai/RoomAnalysisSection";

export default function AICheckPage() {
  const navigate = useNavigate();

  const rooms = useEstimateStore((s) => s.rooms);
  const analysisByRoom = useEstimateStore((s) => s.analysisByRoom);
  const loading = useEstimateStore((s) => s.loading);

  const analyzeImages = useEstimateStore((s) => s.analyzeImages);
  const toggleItem = useEstimateStore((s) => s.toggleItem);
  const updateDetectedItem = useEstimateStore((s) => s.updateDetectedItem);
  const addManualItem = useEstimateStore((s) => s.addManualItem);

  // ✅ 이미지가 있는 공간만 섹션으로 보여주기
  const roomsWithImages = useMemo(() => {
    return (rooms ?? []).filter((r) => (r.images?.length ?? 0) > 0);
  }, [rooms]);

  // (임시) "목록에 없는 짐" 드롭다운용
  const EXTRA_ITEM_OPTIONS = ["침대", "냉장고", "세탁기", "전자레인지", "책상", "의자"];
  const [extraItem, setExtraItem] = useState(EXTRA_ITEM_OPTIONS[0]);

  /* ---------------- 이미지 preview 생성 / 해제 ---------------- */
  const coverPreviewByRoomId = useMemo(() => {
    const map = new Map(); // roomId -> url
    roomsWithImages.forEach((room) => {
      const first = room.images?.[0]?.file;
      if (first) map.set(room.id, URL.createObjectURL(first));
    });
    return map;
  }, [roomsWithImages]);

  useEffect(() => {
    return () => {
      coverPreviewByRoomId.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [coverPreviewByRoomId]);

  /* ---------------- 페이지 진입 시 AI 분석 (1회) ---------------- */
  useEffect(() => {
    const hasAnyImage = (rooms ?? []).some((r) => (r.images?.length ?? 0) > 0);
    if (!hasAnyImage) return;

    const hasAnyResult = Object.keys(analysisByRoom ?? {}).length > 0;
    if (!hasAnyResult) analyzeImages?.();
  }, [rooms, analysisByRoom, analyzeImages]);

  // ✅ 다음 단계: "체크된 아이템이 전체에서 1개라도" 있어야 통과
  const totalCheckedCount = useMemo(() => {
    return Object.values(analysisByRoom ?? {})
      .flat()
      .filter((i) => i?.checked).length;
  }, [analysisByRoom]);

  const handleNext = () => {
    if (totalCheckedCount === 0) {
      alert("견적에 포함할 짐을 최소 1개 이상 선택해주세요.");
      return;
    }
    navigate("/AddressPage");
  };

  const handleSizeChange = (roomId, itemId, field, value) => {
    const num = Number(value);
    updateDetectedItem(roomId, itemId, { [field]: Number.isFinite(num) ? num : 0 });
  };

  const handleAddExtra = (roomId) => {
    addManualItem(roomId, extraItem);
  };

  // ✅ 이미지가 있는 공간이 없으면 방어 (로딩보다 먼저)
  if (roomsWithImages.length === 0) {
    return (
      <div className="container py-4">
        <div className="card shadow-sm p-4">
          <StepIndicator currentStep={2} />
          <p className="text-muted mb-0">
            업로드된 이미지가 없습니다. Home에서 이미지를 먼저 등록해주세요.
          </p>
          <div className="mt-3">
            <button className="btn btn-primary" onClick={() => navigate("/HomePage")}>
              Home으로
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="card shadow-sm p-4">
        <StepIndicator currentStep={2} />

        <h2 className="mb-2 fw-bold">이미지 분석 결과</h2>
        <p className="text-muted mb-4 small">
          입력하신 정보를 바탕으로 예상 이사 비용을 계산했습니다. 실제 비용은 업체 견적에 따라 달라질 수 있습니다.
        </p>

        <div className="mb-3">
          <h5 className="mb-1 fw-bold">분석 목록</h5>
        </div>

        {/* ✅ room별 섹션 반복 */}
        {roomsWithImages.map((room) => {
          const roomId = room.id;
          const detectedItems = analysisByRoom?.[roomId] ?? [];
          const coverUrl = coverPreviewByRoomId.get(roomId);

          return (
            <RoomAnalysisSection
              key={roomId}
              room={room}
              roomId={roomId}
              coverUrl={coverUrl}
              loading={loading}
              detectedItems={detectedItems}
              extraOptions={EXTRA_ITEM_OPTIONS}
              extraItem={extraItem}
              onChangeExtraItem={setExtraItem}
              onAddExtraItem={() => handleAddExtra(roomId)}
              onToggleItem={toggleItem}
              onSizeChange={handleSizeChange}
            />
          );
        })}

        {/* 버튼 */}
        <div className="d-flex justify-content-between mt-4">
          <button
            className="btn btn-outline-secondary px-4"
            onClick={() => navigate("/HomePage")}
            disabled={loading}
          >
            이전 단계
          </button>

          <button className="btn btn-primary px-4" onClick={handleNext} disabled={loading}>
            다음 단계
          </button>
        </div>
      </div>
    </div>
  );
}
