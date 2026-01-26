import SkeletonRows from "./SkeletonRows";
import DetectedItemRow from "./DetectedItemRow";

export default function DetectedItemList({
  loading,
  items,
  roomId,
  onToggle,
  onSizeChange,
}) {
  if (loading) return <SkeletonRows count={4} />;

  return (
    <div className="list-group">
      {items.map((item) => (
        <DetectedItemRow
          key={item.id}
          roomId={roomId}
          item={item}
          onToggle={onToggle}
          onSizeChange={onSizeChange}
        />
      ))}

      {items.length === 0 && (
        <div className="text-muted p-3">인식된 짐이 없습니다.</div>
      )}
    </div>
  );
}
