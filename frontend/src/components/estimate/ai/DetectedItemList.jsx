import SkeletonRows from "./SkeletonRows";
import DetectedItemRow from "./DetectedItemRow";

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
    return <div className="text-muted p-3">인식된 짐이 없습니다.</div>;

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
