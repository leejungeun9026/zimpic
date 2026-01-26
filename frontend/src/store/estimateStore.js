import { create } from "zustand";
import { analyzeVision } from "../services/visionApi";
import { requestEstimate } from "../services/estimateApi";

/* ---------------- 초기 상태 ---------------- */
const initialState = {
  basicInfo: {
    size: 15,
    moveType: "normal",
  },

  rooms: [
    {
      id: 1,
      type: "거실",
      images: [],
    },
  ],

  analysisByRoom: {},
  visionImageIdByRoom: {}, // ✅ 추가
  loading: false,

  moveInfo: {
    fromAddress: "",
    toAddress: "",
    fromFloor: 1,
    toFloor: 1,
    fromElevator: false,
    fromLadder: false,
    toElevator: false,
    toLadder: false,
    toUnknown: false,
  },

  result: null,
};

const createId = () => Date.now() + Math.floor(Math.random() * 1000);

/* ---------------- store ---------------- */
export const useEstimateStore = create((set, get) => ({
  ...initialState,

  /* ---------- basicInfo ---------- */
  setBasicInfo: (data) =>
    set((state) => ({
      basicInfo: { ...state.basicInfo, ...data },
    })),

  /* ---------- rooms ---------- */
  setRooms: (rooms) => set({ rooms }),

  addRoom: (type = "방") =>
    set((state) => ({
      rooms: [...state.rooms, { id: createId(), type, images: [] }],
    })),

  removeRoom: (roomId) =>
    set((state) => ({
      rooms: state.rooms.filter((r) => r.id !== roomId),
    })),

  updateRoomType: (roomId, type) =>
    set((state) => ({
      rooms: state.rooms.map((r) =>
        r.id === roomId ? { ...r, type } : r
      ),
    })),

  // ✅ 방당 이미지 1장 고정: 기존 배열을 새 배열로 덮어씀
  addRoomImages: (roomId, files) =>
    set((state) => ({
      rooms: state.rooms.map((r) => {
        if (r.id !== roomId) return r;
        const first = files?.[0];
        if (!first) return r;
        return { ...r, images: [{ id: createId(), file: first }] };
      }),
    })),

  removeRoomImage: (roomId) =>
    set((state) => ({
      rooms: state.rooms.map((r) =>
        r.id === roomId ? { ...r, images: [] } : r
      ),
    })),

  /* ---------- AI 분석 (서버 연동) ---------- */
  analyzeImages: async () => {
    const { rooms } = get();
    const roomsWithImage = rooms.filter((r) => r.images?.[0]?.file);
    if (roomsWithImage.length === 0) return;

    set({ loading: true });

    try {
      const data = await analyzeVision(roomsWithImage);

      const analysisByRoom = {};
      const visionImageIdByRoom = {};

      data.results.forEach((result, index) => {
        const room = roomsWithImage[index];
        if (!room) return;

        visionImageIdByRoom[room.id] = result.vision_image_id;

        analysisByRoom[room.id] = (result.detections || []).map((d) => ({
          id: d.detection_id,
          furnitureId: d.furniture_id,
          name: d.name_kr,

          checked: true,
          count: 1,

          width: d.guide_size_cm?.width_cm ?? 300,
          depth: d.guide_size_cm?.depth_cm ?? 100,
          height: d.guide_size_cm?.height_cm ?? 200,

          needsDisassembly: !!d.needs_disassembly,
          bbox: d.bbox,
          confidence: d.confidence,
          category: d.category,
        }));
      });

      set({
        analysisByRoom,
        visionImageIdByRoom,
        loading: false,
      });
    } catch (e) {
      console.error("vision error", e);
      set({ loading: false });
      alert("이미지 분석에 실패했습니다.");
    }
  },

  getItemsByRoom: (roomId) => get().analysisByRoom?.[roomId] ?? [],

  toggleItem: (roomId, itemId) =>
    set((state) => ({
      analysisByRoom: {
        ...state.analysisByRoom,
        [roomId]: (state.analysisByRoom?.[roomId] ?? []).map((item) =>
          item.id === itemId ? { ...item, checked: !item.checked } : item
        ),
      },
    })),

  updateDetectedItem: (roomId, itemId, data) =>
    set((state) => ({
      analysisByRoom: {
        ...state.analysisByRoom,
        [roomId]: (state.analysisByRoom?.[roomId] ?? []).map((item) =>
          item.id === itemId ? { ...item, ...data } : item
        ),
      },
    })),

  addManualItem: (roomId, name) =>
    set((state) => {
      const list = state.analysisByRoom?.[roomId] ?? [];
      const newItem = {
        id: createId(),
        furnitureId: null, // ✅ 서버 furniture_id 없으면 견적 요청에서 제외/처리 필요
        name,
        checked: true,
        count: 1,
        width: 300,
        depth: 100,
        height: 200,
        needsDisassembly: false,
        manual: true,
      };
      return {
        analysisByRoom: {
          ...state.analysisByRoom,
          [roomId]: [...list, newItem],
        },
      };
    }),

  /* ---------- AddressPage ---------- */
  setMoveInfo: (data) =>
    set((state) => ({
      moveInfo: { ...state.moveInfo, ...data },
    })),

  /* ---------- 견적 요청 (서버 연동) ---------- */
  calculateResult: async () => {
    const {
      basicInfo,
      moveInfo,
      rooms,
      analysisByRoom,
      visionImageIdByRoom,
    } = get();

    const payload = {
      move_type: basicInfo.moveType === "packing" ? "PACKING" : "NORMAL",
      area: basicInfo.size,

      origin_address: moveInfo.fromAddress,
      origin_floor: moveInfo.fromFloor,
      origin_has_elevator: !!moveInfo.fromElevator,
      origin_use_ladder: !!moveInfo.fromLadder,

      dest_address: moveInfo.toUnknown ? "" : moveInfo.toAddress,
      dest_floor: moveInfo.toUnknown ? 0 : moveInfo.toFloor,
      dest_has_elevator: moveInfo.toUnknown ? false : !!moveInfo.toElevator,
      dest_use_ladder: moveInfo.toUnknown ? false : !!moveInfo.toLadder,

      rooms: rooms
        .map((room, index) => {
          const visionId = visionImageIdByRoom?.[room.id];
          if (!visionId) return null;

          const items = (analysisByRoom?.[room.id] ?? [])
            .filter((i) => i.checked)
            .filter((i) => i.furnitureId != null) // 수동추가(미매핑)는 일단 제외
            .map((i) => ({
              furniture_id: i.furnitureId,
              size_cm: { w_cm: i.width, d_cm: i.depth, h_cm: i.height },
              needs_disassembly: !!i.needsDisassembly,
            }));

          return {
            vision_image_id: visionId,
            sort_order: index,
            items,
          };
        })
        .filter(Boolean),
    };

    const data = await requestEstimate(payload);
    set({ result: data });
  },

  reset: () => set(initialState),
}));
