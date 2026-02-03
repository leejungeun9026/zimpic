import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import StepIndicator from "../components/layout/StepIndicator";
import { useEstimateStore } from "../store/estimateStore";

import MoveTypeSelector from "../components/estimate/home/MoveTypeSelector";
import SizeRangeSlider from "../components/estimate/home/SizeRangeSlider";
import RoomsSection from "../components/estimate/home/RoomsSection";
import { CircleAlert } from "lucide-react";

// 화면에서 선택 가능한 공간 목록
const SPACE_OPTIONS = ["거실", "주방", "베란다", "다용도실", "방"];
const UNIQUE_SPACES = ["거실", "주방", "베란다", "다용도실"];
const MAX_ROOMS = 5; // "방" 최대 5개

export default function HomePage() {
  const navigate = useNavigate();

  const basicInfo = useEstimateStore((s) => s.basicInfo);
  const setBasicInfo = useEstimateStore((s) => s.setBasicInfo);

  const rooms = useEstimateStore((s) => s.rooms);
  const addRoom = useEstimateStore((s) => s.addRoom);
  const removeRoom = useEstimateStore((s) => s.removeRoom);
  const updateRoomType = useEstimateStore((s) => s.updateRoomType);
  const addRoomImages = useEstimateStore((s) => s.addRoomImages);
  const removeRoomImage = useEstimateStore((s) => s.removeRoomImage);

  const { size } = basicInfo;

  /** 현재 선택된 타입 집합 */
  const selectedTypes = useMemo(() => {
    return new Set((rooms ?? []).map((r) => r.type).filter(Boolean));
  }, [rooms]);

  /** 이미 추가된 "방" 개수 */
  const roomCount = useMemo(() => {
    return (rooms ?? []).filter((r) => r.type === "방").length;
  }, [rooms]);

  // preview URL은 "화면에서만" 만든다 (store에는 File만 저장)
  const previewMap = useMemo(() => {
    const map = new Map();
    (rooms ?? []).forEach((room) => {
      (room.images ?? []).forEach((img) => {
        // 1) File/Blob이면 createObjectURL
        if (img?.file instanceof Blob) {
          map.set(img.id, URL.createObjectURL(img.file));
          return;
        }

        // 2) 이미 url이 있으면 그걸 사용 (서버 이미지 등)
        if (typeof img?.url === "string") {
          map.set(img.id, img.url);
          return;
        }

        // 3) 그 외는 그냥 스킵 (잘못된 데이터)
        // console.warn("Invalid image object:", img);
      });
    });
    return map;
  }, [rooms]);

  // cleanup
  useEffect(() => {
    return () => {
      previewMap.forEach((url) => {
        if (typeof url === "string" && url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [previewMap]);

  /**
   * 공간 추가 버튼 로직
   * - 기본은 "방"을 추가 (방은 최대 5개)
   * - 방이 꽉 찼으면, 남아있는 유니크 공간(거실/주방/베란다/다용도실) 중 하나를 추가
   * - 다 없으면 alert
   */
  const handleAddSpace = () => {
    if (roomCount < MAX_ROOMS) {
      addRoom("방");
      return;
    }

    const nextUnique = UNIQUE_SPACES.find((t) => !selectedTypes.has(t));
    if (nextUnique) {
      addRoom(nextUnique);
      return;
    }

    alert(
      "추가할 수 있는 공간이 없습니다. (거실/주방/베란다/다용도실은 1번씩, 방은 최대 5개)"
    );
  };

  /**
   * 타입 변경(드롭다운)에서도 중복 방지
   * - 거실/주방/베란다/다용도실은 중복 선택 불가
   * - 방은 최대 5개
   */
  const handleChangeRoomType = (roomId, nextType) => {
    const currentType = rooms.find((r) => r.id === roomId)?.type;
    if (currentType === nextType) return;

    // 1) 유니크 공간 중복 방지 (다른 카드에 이미 있으면 막기)
    if (UNIQUE_SPACES.includes(nextType)) {
      const usedByOthers = (rooms ?? []).some(
        (r) => r.type === nextType && r.id !== roomId
      );
      if (usedByOthers) {
        alert(`${nextType}은(는) 한 번만 추가할 수 있어요.`);
        return;
      }
    }

    // 2) 방 최대 5개 방지 (현재 방이 아닌데 방으로 바꾸려는 경우)
    if (nextType === "방") {
      const isCurrentlyRoom = currentType === "방";
      if (!isCurrentlyRoom && roomCount >= MAX_ROOMS) {
        alert("방은 최대 5개까지 추가할 수 있어요.");
        return;
      }
    }

    updateRoomType(roomId, nextType);
  };

  // 버튼 disabled 조건: 더 이상 추가할 타입이 없으면 disable
  const canAddMore = useMemo(() => {
    const hasUniqueLeft = UNIQUE_SPACES.some((t) => !selectedTypes.has(t));
    const canAddRoom = roomCount < MAX_ROOMS;
    return hasUniqueLeft || canAddRoom;
  }, [selectedTypes, roomCount]);

  /* 다음 */
  const handleNext = () => {
    if ((rooms ?? []).length === 0) {
      alert("공간을 1개 이상 추가해주세요.");
      return;
    }
    const noImageRooms = (rooms ?? []).filter((r) => (r.images?.length ?? 0) === 0);

    if (noImageRooms.length > 0) {
      const names = noImageRooms
        .map((r, idx) => r.type || `공간 ${r.id ?? idx + 1}`)
        .join(", ");
      alert(`아직 사진이 없는 공간이 있어요: ${names}\n각 공간마다 사진을 1장씩 업로드해주세요.`);
      return;
    }

    navigate("/AICheckPage");
  };

  return (
    <div className="container-fluid py-4">
      <div className="page_card">
        <div className="card-body">
          <StepIndicator currentStep={1} />

          <article className="title mb-5">
            <h2 className="fw-bold mb-2">이사 정보 입력</h2>
            <p className="text-muted small">
              이사 비용 계산에 필요한 정보들을 입력해 주세요.
            </p>
          </article>

          <section className="mb-5">
            {/* 이사 유형 선택 */}
            <MoveTypeSelector
              value={basicInfo.moveType}
              onChange={(moveType) => setBasicInfo({ moveType })}
            />
          </section>

          <section className="mb-5">
            {/* 평수 */}
            <SizeRangeSlider
              value={size}
              onChange={(nextSize) => setBasicInfo({ size: nextSize })}
            />
          </section>

          <section className="mb-4">
            {/* 공간 섹션 */}
            <div className="subtitle mb-3">
              <h5 className="fw-bold mb-1" style={{ fontSize: "18px" }}>공간 선택</h5>
              <p className="text-muted small">
                각 공간(거실, 주방, 베란다, 다용도실)은 한 개씩, 방은 최대 5개 업로드 할 수 있어요.
              </p>
            </div>
            <div className="row g-3">
              {(rooms ?? []).length === 0 ? (
                <div
                  className="col-12"
                >
                  <div className="card bg-light border-0 rounded-3">
                    <div className="card-body py-4 text-center">
                      <CircleAlert size={18} className="mb-2" />
                      <div className="fw-semibold">아직 추가된 공간이 없어요.</div>
                      <div className="small text-muted">
                        + 공간 추가하기 버튼을 눌러 공간을 추가해 주세요.
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <RoomsSection
                  rooms={rooms ?? []}
                  spaceOptions={SPACE_OPTIONS}
                  uniqueSpaces={UNIQUE_SPACES}
                  canAddMore={canAddMore}
                  onAddSpace={handleAddSpace}
                  previewMap={previewMap}
                  onRemoveRoom={removeRoom}
                  onChangeRoomType={handleChangeRoomType}
                  onAddImages={addRoomImages}
                  onRemoveImage={removeRoomImage}
                />
              )}

              {/* rooms가 0일 때도 +추가 버튼은 보여야 해서, 위 분기 밖에 둠 */}
              {(rooms ?? []).length === 0 && (
                <RoomsSection
                  rooms={[]}
                  spaceOptions={SPACE_OPTIONS}
                  uniqueSpaces={UNIQUE_SPACES}
                  canAddMore={canAddMore}
                  onAddSpace={handleAddSpace}
                  previewMap={previewMap}
                  onRemoveRoom={removeRoom}
                  onChangeRoomType={handleChangeRoomType}
                  onAddImages={addRoomImages}
                  onRemoveImage={removeRoomImage}
                />
              )}
            </div>
          </section>

          <section>
            {/* 참고사항 */}
            <div className="alert alert-warning rounded-3">
              <div className="fw-semibold mb-2">주의사항</div>
              <ul className="mb-0 small text-muted ps-3" style={{ listStyleType: "disc" }}>
                <li>공간을 대표하는 전체 사진 1장을 가전과 가구가 잘 보이도록 업로드 해주세요.</li>
                <li>사진이 어둡거나 흔들리면 분석 정확도가 낮아질 수 있어요.</li>
                <li>업로드된 사진은 견적 산출 목적 외에는 사용하지 않아요.</li>
              </ul>
            </div>
          </section>

          <div className="d-flex justify-content-center">
            <button type="button" className="ms-auto btn btn-lg fs-6 btn-primary rounded-2 px-4" onClick={handleNext}>
              다음
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
