import { useNavigate } from "react-router-dom";
import StepIndicator from "../components/layout/StepIndicator";
import { useEstimateStore } from "../store/estimateStore";
import { useEffect, useState } from "react";

// 공간 타입 옵션
const SPACE_OPTIONS = ["방1", "거실", "주방", "서재"];

export default function HomePage() {
  const navigate = useNavigate();
  const {setImages} = useEstimateStore();

  // zustand에서 가져오기
  const {
    basicInfo,
    setBasicInfo,
  } = useEstimateStore();

  const { size } = basicInfo;

  const [roomCount, setRoomCount] = useState(1);
  const [rooms, setRooms] = useState([
    { id: 0, type: "공용공간", images: [] }
  ]);

  // 이미지 URL 메모리 해제
  useEffect(() => {
    return () => {
      rooms.forEach(room => {
        room.images.forEach(img => URL.revokeObjectURL(img.preview));
      });
    };
  }, [rooms]);

  // 방 개수 증가
  const handleRoomCountIncrease = () => {
    if (roomCount >= 10) return;
    const newRoomCount = roomCount + 1;
    setRoomCount(newRoomCount);
    setRooms([...rooms, { id: newRoomCount, type: "방1", images: [] }]);
  };

  // 방 개수 감소
  const handleRoomCountDecrease = () => {
    if (roomCount <= 1) return;
    const newRoomCount = roomCount - 1;
    setRoomCount(newRoomCount);
    // 마지막 방 제거
    const lastRoom = rooms[rooms.length - 1];
    lastRoom.images.forEach(img => URL.revokeObjectURL(img.preview));
    setRooms(rooms.slice(0, -1));
  };

  // 방 타입 변경
  const handleRoomTypeChange = (roomId, newType) => {
    setRooms(rooms.map(room => 
      room.id === roomId ? { ...room, type: newType } : room
    ));
  };

  // 이미지 업로드
  const handleImageUpload = (roomId, e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map((file, index) => ({
      id: Date.now() + index,
      file,
      preview: URL.createObjectURL(file),
    }));
    
    setRooms(rooms.map(room => 
      room.id === roomId 
        ? { ...room, images: [...room.images, ...newImages] }
        : room
    ));
  };

  // 이미지 삭제
  const handleImageDelete = (roomId, imageId) => {
    setRooms(rooms.map(room => {
      if (room.id === roomId) {
        const imageToDelete = room.images.find(img => img.id === imageId);
        if (imageToDelete) {
          URL.revokeObjectURL(imageToDelete.preview);
        }
        return { ...room, images: room.images.filter(img => img.id !== imageId) };
      }
      return room;
    }));
  };

  // 다음 버튼 클릭
  const handleNext = () => {
    const allImages = rooms.flatMap(room =>
      room.images.map(img => img.file)
    );

    if (allImages.length === 0) {
      alert("이미지를 최소 1장 이상 업로드해주세요.");
      return;
    }

    setImages(allImages); // ✅ store에 File[] 저장
    navigate("/AICheckPage");
  };
  return (
    <div className="container py-4">
      <div className="card shadow-sm p-4">
        <StepIndicator currentStep={1} />

        <h2 className="mb-2">평수 및 이미지 업로드</h2>
        <p className="text-muted mb-4">
          평수와 방 개수, 방 사진을 넣어주세요.
        </p>

        {/* 평수 */}
        <div className="card mb-4 p-3">
          <p className="fw-bold mb-2">평수 : {size}평</p>

          <input
            type="range"
            className="form-range"
            min="5"
            max="50"
            step="1"
            value={size}
            onChange={(e) =>
              setBasicInfo({ size: Number(e.target.value) })
            }
          />

          <div className="d-flex justify-content-between text-muted small">
            <span>5평</span>
            <span>15평</span>
            <span>25평</span>
            <span>35평</span>
            <span>50평</span>
          </div>
        </div>

        {/* 방 개수 */}
        <div className="card mb-4 p-3">
          <h5 className="mb-2">방 개수</h5>

          <div className="d-flex align-items-center gap-3">
            <button
              className="btn btn-outline-secondary rounded-circle"
              onClick={handleRoomCountDecrease}
              disabled={roomCount <= 1}
            >
              −
            </button>

            <span className="fw-bold">{roomCount}개</span>

            <button
              className="btn btn-outline-secondary rounded-circle"
              onClick={handleRoomCountIncrease}
              disabled={roomCount >= 10}
            >
              +
            </button>
          </div>
        </div>

        {/* 이미지 업로드 카드들 */}
        {rooms.map((room) => (
          <div key={room.id} className="card mb-4 p-3">
            {/* 공용공간은 타입 고정, 나머지는 선택 가능 */}
            {room.id === 0 ? (
              <h5 className="mb-3">{room.type}</h5>
            ) : (
              <div className="mb-3">
                <label className="form-label fw-bold">공간 타입 선택</label>
                <div className="d-flex flex-wrap gap-2">
                  {SPACE_OPTIONS.map(option => (
                    <div key={option} className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name={`room-type-${room.id}`}
                        id={`${room.id}-${option}`}
                        checked={room.type === option}
                        onChange={() => handleRoomTypeChange(room.id, option)}
                      />
                      <label className="form-check-label" htmlFor={`${room.id}-${option}`}>
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <input
              type="file"
              className="form-control mb-3"
              multiple
              accept="image/*"
              onChange={(e) => handleImageUpload(room.id, e)}
            />

            {/* 업로드된 이미지 미리보기 */}
            {room.images.length > 0 && (
              <div className="mt-3">
                <p className="fw-bold mb-2">업로드된 사진 ({room.images.length}장)</p>
                <div className="row g-2">
                  {room.images.map((img) => (
                    <div key={img.id} className="col-6 col-md-4">
                      <div className="position-relative">
                        <img
                          src={img.preview}
                          alt={`${room.type}`}
                          className="img-thumbnail"
                          style={{
                            width: "100%",
                            height: "150px",
                            objectFit: "cover",
                          }}
                        />
                        <button
                          className="btn btn-danger btn-sm position-absolute top-0 end-0 m-1"
                          onClick={() => handleImageDelete(room.id, img.id)}
                          style={{ fontSize: "12px", padding: "2px 6px" }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* 참고사항 */}
        <h4 className="mt-5">참고사항</h4>
        <div className="card mt-2 bg-light">
          <div className="card-body text-muted small">
            <p className="mb-1">• 방 전체가 나오도록 사진을 업로드해 주세요.</p>
            <p className="mb-1">• 어두운 사진이나 흔들린 사진은 분석 정확도가 떨어질 수 있습니다.</p>
          </div>
        </div>

        {/* 버튼 */}
        <div className="d-flex justify-content-center mt-4">
          <button
            className="btn btn-primary"
            onClick={handleNext}
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
}