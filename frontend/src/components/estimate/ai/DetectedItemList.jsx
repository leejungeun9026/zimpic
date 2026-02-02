import { CircleAlert } from "lucide-react";
import DetectedItemRow from "./DetectedItemRow";
import SkeletonRows from "./SkeletonRows";

export default function DetectedItemList({
  loading,
  items,
  roomId,
  onToggle,
  onSizeChange,
  onHoverItem,
  onRemoveManualItem,
  furnitureById,
  onUpdateItem,
}) {
  if (loading) return <SkeletonRows count={4} />;
  if (!items || items.length === 0)
    return (
      <div className="bg-secondary bg-opacity-10 rounded-2 mt-3 p-3 text-center">
        <CircleAlert size={18} />
        <p className="small text-muted">인식된 이삿짐이 없어요.</p>
      </div>
    );

  const getFurniturePolicy = (furnitureId) => {
    if (!furnitureById) return undefined;
    if (typeof furnitureById.get === "function")
      return furnitureById.get(furnitureId);
    return furnitureById[furnitureId];
  };

  return (
    <div className="list-group">
      {items.map((item) => (
        <div
          key={item.id}
          onMouseEnter={() => onHoverItem?.(item.id)}
          onMouseLeave={() => onHoverItem?.(null)}
        >
          <DetectedItemRow
            roomId={roomId}
            item={item}
            onToggle={onToggle}
            onSizeChange={onSizeChange}
            onRemoveManualItem={onRemoveManualItem}
            furniturePolicy={getFurniturePolicy(item.furnitureId)}
            onUpdateItem={onUpdateItem}
          />
        </div>
      ))}
    </div>
  );
}
