// src/services/visionApi.js
import axios from "axios";

const API_BASE_URL = "http://localhost:8000";

/**
 * 방 이미지 AI 분석 요청
 * @param {Array} rooms - zustand rooms 상태
 */
export async function analyzeVision(rooms) {
  const formData = new FormData();

  // files 추가 (index가 서버와 매칭됨)
  rooms.forEach((room) => {
    const file = room.images?.[0]?.file;
    if (file) {
      formData.append("files", file);
    }
  });

  // rooms 메타데이터 생성
  const roomsPayload = rooms.map((room, index) => ({
    room_type: mapRoomType(room.type, index),
    file_index: index,
    sort_order: index + 1,
  }));

  formData.append("rooms", JSON.stringify(roomsPayload));

  // 서버 요청
  const response = await axios.post(
    `${API_BASE_URL}/api/vision/`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
}

function mapRoomType(type, index) {
  switch (type) {
    case "거실":
      return "LIVING";
    case "주방":
      return "KITCHEN";
    case "베란다":
      return "BALCONY";
    case "다용도실":
      return "UTILITY";
    case "방":
      return `ROOM${index + 1}`;
    default:
      return "UNKNOWN";
  }
}
