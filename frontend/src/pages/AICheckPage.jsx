// AI 분석을 실행하고 사용자가 '짐 목록'을 확정하는 페이지

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import StepIndicator from "../components/layout/StepIndicator";
import { useEstimateStore } from "../store/estimateStore";

import RoomAnalysisSection from "../components/estimate/ai/RoomAnalysisSection";
import { fetchFurniturePolicy } from "../services/policyApi";

export default function AICheckPage() {
  const navigate = useNavigate();

  const rooms = useEstimateStore((s) => s.rooms);
  const analysisByRoom = useEstimateStore((s) => s.analysisByRoom);
  const loading = useEstimateStore((s) => s.loading);

  const analyzeImages = useEstimateStore((s) => s.analyzeImages);
  const toggleItem = useEstimateStore((s) => s.toggleItem);
  const updateDetectedItem = useEstimateStore((s) => s.updateDetectedItem);
  const addManualItem = useEstimateStore((s) => s.addManualItem);
  const removeManualItem = useEstimateStore((s) => s.removeManualItem);

  // policy를 store에 넣는 액션 (이거 없으면 setFurniturePolicyList is not defined 에러)
  const setFurniturePolicyList = useEstimateStore((s) => s.setFurniturePolicyList);

  // 이미지가 있는 공간만 섹션으로 보여주기
  const roomsWithImages = useMemo(() => {
    return (rooms ?? []).filter((r) => (r.images?.length ?? 0) > 0);
  }, [rooms]);

  // 수동 추가 가능한 짐 목록
  const [furnitureList, setFurnitureList] = useState([]);
  const [extraItemId, setExtraItemId] = useState(null);

  /* ---------------- 이미지 preview 생성 / 해제 ---------------- */
  const coverPreviewByRoomId = useMemo(() => {
    const map = new Map();
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

  // 체크된 아이템이 1개라도 있어야 통과
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
    const furniture = furnitureList.find((f) => f.id === extraItemId);
    if (!furniture) return;

    addManualItem(roomId, furniture);
  };

  useEffect(() => {
    fetchFurniturePolicy()
      .then((data) => {
        const list = data ?? [];
        setFurnitureList(list);

        // store에도 넣어줘야 수동추가(에어컨→실외기 자동생성) 가능
        setFurniturePolicyList(list);

        if (list.length > 0) setExtraItemId(list[0].id);
      })
      .catch((e) => {
        console.error("furniture policy error", e);
        alert("짐 목록을 불러오지 못했습니다.");
      });
  }, [setFurniturePolicyList]);

  const furnitureById = useMemo(() => {
    const map = new Map();
    (furnitureList ?? []).forEach((f) => map.set(f.id, f));
    return map;
  }, [furnitureList]);

  if (roomsWithImages.length === 0) {
    return (
      <div className="container-fluid py-4">
        <div className="page_card">
          <div className="card-body text-center">
            <StepIndicator currentStep={2} />
            <p className="text-muted small">
              업로드된 이미지가 없습니다. Step1에서 이미지를 먼저 등록해주세요.
            </p>
            <div className="my-3">
              <button className="btn btn-primary" onClick={() => navigate("/HomePage")}>
                처음으로
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="page_card">
        <div className="card-body">
          <StepIndicator currentStep={2} />

          <article className="title mb-4">
            <h2 className="fw-bold mb-2">이미지 분석 결과</h2>
            <p className="text-muted small">
              올려주신 이미지에서 이삿짐을 분석했어요. <br />잘못 인식되거나 이삿짐에 포함되지 않는 가구는 체크박스를 해제해주세요.
            </p>
          </article>

          <section className="mb-5">
            <div className="row g-3">
              {roomsWithImages.map((room, idx) => {
                const roomId = room.id;
                const detectedItems = analysisByRoom?.[roomId] ?? [];
                const coverUrl = coverPreviewByRoomId.get(roomId);

                return (
                  <div className="col-12">
                    <RoomAnalysisSection
                      idx={idx}
                      key={roomId}
                      room={room}
                      roomId={roomId}
                      coverUrl={coverUrl}
                      loading={loading}
                      detectedItems={detectedItems}
                      extraOptions={furnitureList}
                      extraItem={extraItemId ?? ""}
                      onChangeExtraItem={setExtraItemId}
                      onAddExtraItem={() => handleAddExtra(roomId)}
                      onToggleItem={toggleItem}
                      onSizeChange={handleSizeChange}
                      onRemoveManualItem={removeManualItem}
                      furnitureById={furnitureById}
                      onUpdateItem={(rid, itemId, patch) =>
                        updateDetectedItem(rid, itemId, patch)
                      }
                    />
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <div className="alert alert-warning rounded-3">
              <div className="fw-semibold mb-2">참고사항</div>
              <ul className="mb-0 small text-muted ps-3" style={{ listStyleType: "disc" }}>
                <li>AI 분석 결과는 업로드된 대표 이미지 기준으로 산출됩니다.</li>
                <li>사진에 보이지 않는 짐은 직접 추가해 주세요.</li>
                <li>짐 크기&middot;개수는 실제 방문 견적 시 조정될 수 있습니다.</li>
                <li>선택하지 않은 항목은 최종 견적에 포함되지 않습니다.</li>
              </ul>
            </div>
          </section>

          <div className="d-flex justify-content-between mt-4">
            <button
              className="btn btn-lg fs-6 btn-light text-secondary rounded-2"
              onClick={() => navigate("/HomePage")}
              disabled={loading}
            >
              이전 단계
            </button>

            <button className="ms-auto btn btn-lg fs-6 btn-primary rounded-2" onClick={handleNext} disabled={loading}>
              다음 단계
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
