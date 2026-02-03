// rooms 배열을 받아서 RoomCard로 풀어놓고, 추가 버튼 하나 붙이는 컨테이너
import { Plus } from "lucide-react";
import RoomCard from "./RoomCard";

export default function RoomsSection({
  rooms,
  canAddMore,
  onAddSpace,
  previewMap,
  spaceOptions,
  uniqueSpaces,
  onRemoveRoom,
  onChangeRoomType,
  onAddImages,
  onRemoveImage,
}) {
  return (
    <>
      {(rooms ?? []).map((room) => {
        const firstImageId = room.images?.[0]?.id;
        const previewUrl = firstImageId
          ? (previewMap.get(firstImageId) ?? null)
          : null;

        return (
          <div className="col-12" key={room.id}>
            <RoomCard
              room={room}
              rooms={rooms}
              spaceOptions={spaceOptions}
              uniqueSpaces={uniqueSpaces}
              previewUrl={previewUrl}
              onRemoveRoom={onRemoveRoom}
              onChangeRoomType={onChangeRoomType}
              onAddImages={onAddImages}
              onRemoveImage={onRemoveImage}
            />
          </div>
        );
      })}

      <div className="col-12">
        <div className="text-center">
          <button
            className="btn btn-dark"
            onClick={onAddSpace}
            disabled={!canAddMore}
          >
            <div className="d-flex align-items-center gap-1">
              <Plus size={16} strokeWidth={2.5} />
              공간 추가하기
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
