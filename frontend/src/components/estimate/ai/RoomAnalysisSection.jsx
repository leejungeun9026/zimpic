// 방 1개에 대한 분석 화면을 묶어서 보여주는 컨테이너

import RoomCoverImage from "./RoomCoverImage";
import DetectedItemList from "./DetectedItemList";
import ExtraItemAdder from "./ExtraItemAdder";
import { useState } from "react";

export default function RoomAnalysisSection({
  idx,
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
    <div className="py-3 border-bottom">
      <div className="d-inline-flex align-items-center gap-1 mb-3">
        <h5 className="fw-bold" style={{ fontSize: "18px" }}>
          {idx + 1}. {room.type}
        </h5>
        <span className="badge rounded-pill text-bg-primary bg-opacity-25 text-primary">
          {detectedItems.length}개 분석
        </span>
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
  );
}
