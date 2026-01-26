import { useRef } from "react";

export default function RoomCard({
  room,
  rooms,
  spaceOptions,
  uniqueSpaces,
  previewUrl,
  onRemoveRoom,
  onChangeRoomType,
  onAddImages,
  onRemoveImage,
}) {
  const fileInputRef = useRef(null);
  const firstImageId = room.images?.[0]?.id;

  const openFilePicker = () => fileInputRef.current?.click();

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []).filter((f) =>
      f.type.startsWith("image/")
    );
    if (files.length === 0) return;
    onAddImages(room.id, files);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []).filter((f) =>
      f.type.startsWith("image/")
    );
    if (files.length === 0) return;
    onAddImages(room.id, files);
  };

  return (
    <div className="card mb-4 p-3">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <select
          className="form-select w-auto"
          value={room.type}
          onChange={(e) => onChangeRoomType(room.id, e.target.value)}
        >
          {spaceOptions.map((opt) => {
            const isUnique = uniqueSpaces.includes(opt);
            const usedByOthers =
              isUnique && rooms.some((r) => r.type === opt && r.id !== room.id);

            return (
              <option key={opt} value={opt} disabled={usedByOthers}>
                {opt}
                {usedByOthers ? " (이미 추가됨)" : ""}
              </option>
            );
          })}
        </select>

        <button
          className="btn btn-outline-danger btn-sm"
          onClick={() => onRemoveRoom(room.id)}
        >
          삭제
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="d-none"
        multiple
        accept="image/*"
        onChange={handleImageUpload}
      />

      {room.images.length === 0 ? (
        <div
          className="border rounded-3 p-4 text-center mb-3"
          style={{ borderStyle: "dashed", background: "#fafafa" }}
          onClick={openFilePicker}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <div className="text-muted fw-semibold">
            이 공간에 있는 모든 짐이 한 장에 보이게 찍어주세요
          </div>
          <div className="small text-muted">(부분 사진 여러 장 X)</div>

          <button
            type="button"
            className="btn btn-dark btn-sm mt-2"
            onClick={(e) => {
              e.stopPropagation();
              openFilePicker();
            }}
          >
            이미지 가져오기
          </button>
        </div>
      ) : (
        <div
          className="position-relative d-flex justify-content-center"
          style={{ height: 340, background: "#F3F6FB", borderRadius: 12 }}
        >
          <img
            src={previewUrl}
            alt=""
            style={{ width: "100%", objectFit: "contain", padding: 16 }}
          />
          <button
            className="btn btn-danger btn-sm position-absolute top-0 end-0 m-2"
            onClick={() => onRemoveImage(room.id, firstImageId)}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
