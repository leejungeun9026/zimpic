// 방 하나에 대한 UI 조작 담당
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
  // 이미지 가져오기 버튼이나 업로드 영역 클릭시 숨겨진 input을 .click()으로 열어주는 방식
  const fileInputRef = useRef(null);
  const firstImageId = room.images?.[0]?.id;

  const openFilePicker = () => fileInputRef.current?.click();

  // 이미지 업로드 처리 (클릭 업로드)
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []).filter((f) =>
      f.type.startsWith("image/")
    );
    if (files.length === 0) return;
    onAddImages(room.id, files);
    e.target.value = "";
  };

  // 드래그 & 드롭 업로드
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
              e.stopPropagation(); // 버튼 클릭이 바깥 div 클릭까지 전파되지 않게 막음
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
