// rooms 배열을 받아서 RoomCard로 풀어놓고, 추가 버튼 하나 붙이는 컨테이너
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
          ? previewMap.get(firstImageId)
          : "";

        return (
          <RoomCard
            key={room.id}
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
        );
      })}

      <div className="d-flex justify-content-center mb-4">
        <button
          className="btn btn-dark btn-sm px-4"
          onClick={onAddSpace}
          disabled={!canAddMore}
        >
          + 공간 추가하기
        </button>
      </div>
    </>
  );
}
