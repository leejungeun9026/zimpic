// 방 1개에 대한 분석 화면을 묶어서 보여주는 컨테이너

import RoomCoverImage from "./RoomCoverImage";
import DetectedItemList from "./DetectedItemList";
import ExtraItemAdder from "./ExtraItemAdder";
import { useState } from "react";

export default function RoomAnalysisSection({
  room,
  roomId,
  coverUrl,
  loading,
  detectedItems,
  extraOptions,
  extraItem,
  onChangeExtraItem,
  onAddExtraItem,
  onRemoveManualItem,
  onToggleItem,
  onSizeChange,
  furnitureById,
  onUpdateItem,
}) {
  
  // 사진 위에 BBOX 강조
  const [hoveredId, setHoveredId] = useState(null);



  return (
    <div className="card mb-4">
      <div className="card-body">
        <div className="fw-bold mb-1">{room.type}</div>
        <div className="text-muted small mb-3">
          잘못 인식되거나 이삿짐에 포함되지 않는 가구는 체크박스를 해제해주세요
        </div>

        <RoomCoverImage
          coverUrl={coverUrl}
          loading={loading}
          detectedItems={detectedItems}
          activeId={hoveredId}
        />

        <DetectedItemList
          loading={loading}
          items={detectedItems}
          roomId={roomId}
          onToggle={onToggleItem}
          onSizeChange={onSizeChange}
          onHoverItem={setHoveredId}
          onRemoveManualItem={onRemoveManualItem}
          furnitureById={furnitureById}
          onUpdateItem={onUpdateItem}
        />

        <ExtraItemAdder
          loading={loading}
          options={extraOptions}
          value={extraItem}
          onChange={onChangeExtraItem}
          onAdd={onAddExtraItem}
        />
      </div>
    </div>
  );
}
