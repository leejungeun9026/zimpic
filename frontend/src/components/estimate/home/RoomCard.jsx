// 방 하나에 대한 UI 조작 담당
import { ImageUp, X } from "lucide-react";
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
    <div className="card border-secondary border-opacity-10 rounded-4">
      <div className="card-header p-3 pb-0 bg-transparent border-0">
        <div className="row">
          <div className="col-6 col-sm-4">
            <select
              className="form-select"
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
          </div>
          <div className="col-auto ms-auto">
            <button
              className="btn btn-danger btn-sm"
              onClick={() => onRemoveRoom(room.id)}
            >
              공간 삭제
            </button>
          </div>
        </div>
      </div>
      <div className="card-body">
        <input
          ref={fileInputRef}
          type="file"
          className="d-none"
          multiple
          accept=".jpg"
          onChange={handleImageUpload}
        />

        {room.images.length === 0 ? (
          <div
            className="border-2 border-primary bg-primary bg-opacity-10 rounded-3 p-4 text-center mb-3"
            style={{ borderStyle: "dashed", cursor: "pointer" }}
            onClick={openFilePicker}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <h6 className="fw-semibold text-primary mb-1">
              <ImageUp />
            </h6>
            <div className="small">이미지를 여기로 끌어다 놓거나<br /> 이미지 가져오기로 업로드 해주세요.</div>
            <div className="small text-muted mt-2">파일 형식 : jpg</div>

            <button
              type="button"
              className="btn btn-primary btn-sm mt-2"
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
            className="position-relative d-flex justify-content-center h-auto bg-light rounded-2"
          >
            <div className="img_wrap border overflow-hidden w-100 h-auto" style={{ maxWidth: "300px" }}>
              <img className="w-100"
                src={previewUrl}
              />
            </div>
            <div className="button_wrap position-absolute top-0 end-0 mt-2 me-2 ">
              <button
                className="icon-box-24 rounded-1 border-0 text-white"
                style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                onClick={() => onRemoveImage(room.id, firstImageId)}
              >
                <X size={25} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div >
  );
}
