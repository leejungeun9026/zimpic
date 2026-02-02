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
  visionImageIdByRoom: {},

  loading: false,

  // ✅ 추가: AI 분석 완료 여부(및 상태) - 무한 재호출 방지용
  // "idle" | "loading" | "done" | "error"
  visionStatus: "idle",

  // 결과 저장용, 수동 추가 시 기준 데이터
  furniturePolicyList: [],
  furniturePolicyById: {},

  moveInfo: {
    fromAddress: "",
    toAddress: null,
    fromFloor: 1,
    toFloor: 1,
    fromElevator: true,
    fromLadder: false,
    toElevator: true,
    toLadder: false,
    toUnknown: false,
  },

  result: null,
};

// 수동 추가 아이템 전용
const createId = () => Date.now() + Math.floor(Math.random() * 1000);

// 에어컨, 실외기 판별
const isAirconEn = (nameEn) =>
  nameEn === "air_conditioner_wall" || nameEn === "air_conditioner_stand";
const isOutdoorEn = (nameEn) =>
  nameEn === "ac_outdoor_wall" || nameEn === "ac_outdoor_stand";

// 에어컨 추가 했을 때 어떤 실외기를 붙일지
const outdoorEnFromAirconEn = (airconNameEn) => {
  if (airconNameEn === "air_conditioner_wall") return "ac_outdoor_wall";
  if (airconNameEn === "air_conditioner_stand") return "ac_outdoor_stand";
  return null;
};

// policy 기준 outdoor furniture id
const outdoorFurnitureIdFromAirconEn = (airconNameEn) => {
  if (airconNameEn === "air_conditioner_wall") return 39; // 벽걸이 실외기
  if (airconNameEn === "air_conditioner_stand") return 40; // 스탠드 실외기
  return null;
};

export const useEstimateStore = create((set, get) => ({
  ...initialState,

  /* policy 세팅 */
  setFurniturePolicyList: (list) =>
    set(() => {
      const safe = Array.isArray(list) ? list : [];
      const byId = {};
      safe.forEach((f) => {
        if (f?.id != null) byId[f.id] = f;
      });
      return {
        furniturePolicyList: safe,
        furniturePolicyById: byId,
      };
    }),

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
      rooms: state.rooms.map((r) => (r.id === roomId ? { ...r, type } : r)),
    })),

  // 방당 이미지 1장 고정
  addRoomImages: (roomId, files) =>
    set((state) => ({
      rooms: state.rooms.map((r) => {
        if (r.id !== roomId) return r;
        const first = files?.[0];
        if (!first) return r;

        // ✅ 새 이미지가 들어오면 기존 분석 결과는 무효가 될 수 있으니 초기화
        return { ...r, images: [{ id: createId(), file: first }] };
      }),
      // ✅ 이미지 바뀌면 분석 다시 해야 하므로 상태 초기화
      analysisByRoom: {},
      visionImageIdByRoom: {},
      visionStatus: "idle",
    })),

  removeRoomImage: (roomId) =>
    set((state) => ({
      rooms: state.rooms.map((r) => (r.id === roomId ? { ...r, images: [] } : r)),
      // ✅ 이미지 제거되면 분석 결과도 무효 처리
      analysisByRoom: {},
      visionImageIdByRoom: {},
      visionStatus: "idle",
    })),

  /* ---------- AI 분석 (서버 연동) ---------- */
  analyzeImages: async () => {
    const { rooms, visionStatus } = get();
    const roomsWithImage = rooms.filter((r) => r.images?.[0]?.file);
    if (roomsWithImage.length === 0) return;

    // ✅ 이미 분석 중이면 중복 호출 방지
    if (visionStatus === "loading") return;

    const MIN_LOADING_MS = 800;
    const start = Date.now();

    set({ loading: true, visionStatus: "loading" });

    try {
      const data = await analyzeVision(roomsWithImage);

      const analysisByRoom = {};
      const visionImageIdByRoom = {};

      (data?.results ?? []).forEach((result, index) => {
        const room = roomsWithImage[index];
        if (!room) return;

        visionImageIdByRoom[room.id] = result.vision_image_id;

        // 에어컨 실외기 순서로 준다는 전제로 에어컨 나오면 id 기억하고 실외기 나오면 parentId로 연결
        let lastWallAirconId = null;
        let lastStandAirconId = null;

        analysisByRoom[room.id] = (result.detections || []).map((d) => {
          const nameEn = d?.name_en ?? d?.yolo_class ?? null;
          const outdoor = isOutdoorEn(nameEn);
          const aircon = isAirconEn(nameEn);

          let parentId = null;
          if (aircon) {
            if (nameEn === "air_conditioner_wall") lastWallAirconId = d.detection_id;
            if (nameEn === "air_conditioner_stand") lastStandAirconId = d.detection_id;
          }

          if (outdoor) {
            if (nameEn === "ac_outdoor_wall") parentId = lastWallAirconId;
            if (nameEn === "ac_outdoor_stand") parentId = lastStandAirconId;
          }

          return {
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
            nameEn,
            autoAdded: outdoor, // 서버가 자동으로 붙여준 실외기 표시
            parentId, // 실외기면 에어컨 id로 연결
          };
        });
      });

      // ✅ 빈 결과(0 detections)여도 'done'으로 처리해야 무한 재호출 안 됨
      set({
        analysisByRoom,
        visionImageIdByRoom,
        visionStatus: "done",
      });
    } catch (e) {
      console.error("vision error", e);
      alert("이미지 분석에 실패했습니다.");

      // ✅ 실패도 error로 마킹해서 페이지가 무한 재호출 안 하게
      set({ visionStatus: "error" });
    } finally {
      const elapsed = Date.now() - start;
      const wait = Math.max(0, MIN_LOADING_MS - elapsed);
      if (wait) await new Promise((r) => setTimeout(r, wait));
      set({ loading: false });
    }
  },

  getItemsByRoom: (roomId) => get().analysisByRoom?.[roomId] ?? [],

  /* ---------- 체크 토글 (부모/자식 동기화 포함) ---------- */
  toggleItem: (roomId, itemId) =>
    set((state) => {
      const list = state.analysisByRoom?.[roomId] ?? [];
      const target = list.find((it) => it.id === itemId);
      if (!target) return state;

      const nextChecked = !target.checked;

      const targetIsParentAircon = isAirconEn(target?.nameEn);
      const targetIsOutdoor = isOutdoorEn(target?.nameEn);

      // 부모 에어컨이면: 자식(실외기=parentId가 부모id인 애들) 같이 토글
      if (targetIsParentAircon) {
        const parentId = target.id;

        const nextList = list.map((it) => {
          if (it.id === parentId) return { ...it, checked: nextChecked };
          if (it.parentId === parentId) return { ...it, checked: nextChecked };
          return it;
        });

        return {
          analysisByRoom: {
            ...state.analysisByRoom,
            [roomId]: nextList,
          },
        };
      }

      // 자식 토글하면 부모도 같이 맞춰주기
      if (targetIsOutdoor && target.parentId) {
        const parentId = target.parentId;

        const nextList = list.map((it) => {
          if (it.id === itemId) return { ...it, checked: nextChecked };
          // 자식 ON이면 부모도 ON, 자식 OFF여도 부모는 유지
          if (nextChecked === true && it.id === parentId) {
            return { ...it, checked: true };
          }
          return it;
        });

        return {
          analysisByRoom: {
            ...state.analysisByRoom,
            [roomId]: nextList,
          },
        };
      }

      // 그 외 일반 아이템 토글
      const nextList = list.map((it) =>
        it.id === itemId ? { ...it, checked: nextChecked } : it
      );

      return {
        analysisByRoom: {
          ...state.analysisByRoom,
          [roomId]: nextList,
        },
      };
    }),

  updateDetectedItem: (roomId, itemId, data) =>
    set((state) => ({
      analysisByRoom: {
        ...state.analysisByRoom,
        [roomId]: (state.analysisByRoom?.[roomId] ?? []).map((item) =>
          item.id === itemId ? { ...item, ...data } : item
        ),
      },
    })),

  /* ---------- 수동 추가 (에어컨이면 실외기 자동 생성까지) ---------- */
  addManualItem: (roomId, furniture) =>
    set((state) => {
      const list = state.analysisByRoom?.[roomId] ?? [];
      const byId = state.furniturePolicyById ?? {};

      const airconNameEn = furniture?.name_en ?? null;
      const isAircon = isAirconEn(airconNameEn);

      // 부모(에어컨/일반) 생성
      const parentId = createId();
      const parentItem = {
        id: parentId,
        furnitureId: furniture.id,
        name: furniture.name_kr,
        nameEn: furniture.name_en ?? null,

        checked: true,
        count: 1,

        width: furniture.width_cm,
        depth: furniture.depth_cm,
        height: furniture.height_cm,

        needsDisassembly: false,
        manual: true,
      };

      // 에어컨이면 실외기(자식)도 자동 생성
      const next = [...list, parentItem];

      if (isAircon) {
        const outdoorId = outdoorFurnitureIdFromAirconEn(airconNameEn);
        const outdoorEn = outdoorEnFromAirconEn(airconNameEn);

        const outdoorFurniture = outdoorId ? byId[outdoorId] : null;

        if (outdoorFurniture && outdoorEn) {
          next.push({
            id: createId(),
            furnitureId: outdoorFurniture.id,
            name: outdoorFurniture.name_kr,
            nameEn: outdoorEn,

            checked: true,
            count: 1,

            width: outdoorFurniture.width_cm,
            depth: outdoorFurniture.depth_cm,
            height: outdoorFurniture.height_cm,

            needsDisassembly: false,

            manual: true,
            autoAdded: true, // 수동추가의 "부속품"이라는 뜻
            parentId, // 부모 에어컨에 연결
          });
        }
      }

      return {
        analysisByRoom: {
          ...state.analysisByRoom,
          [roomId]: next,
        },
      };
    }),

  /* ---------- 수동 삭제 (부모 삭제 시 자식도 같이 삭제) ---------- */
  removeManualItem: (roomId, itemId) =>
    set((state) => {
      const list = state.analysisByRoom?.[roomId] ?? [];
      const target = list.find((item) => item.id === itemId);
      if (!target?.manual) return state; // AI 아이템이면 삭제 안 함

      const targetIsAircon = isAirconEn(target.nameEn);

      // 에어컨(부모) 삭제면 자식(실외기)도 같이 제거
      const next = list.filter((it) => {
        if (it.id === itemId) return false;
        if (targetIsAircon && it.parentId === itemId) return false;
        return true;
      });

      return {
        analysisByRoom: {
          ...state.analysisByRoom,
          [roomId]: next,
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
    set({ loading: true });

    try {
      const { basicInfo, moveInfo, rooms, analysisByRoom, visionImageIdByRoom } = get();

      const payload = {
        move_type: basicInfo.moveType === "packing" ? "PACKING" : "GENERAL",
        area: basicInfo.size,

        origin_address: moveInfo.fromAddress,
        origin_floor: moveInfo.fromFloor,
        origin_has_elevator: !!moveInfo.fromElevator,
        origin_use_ladder: !!moveInfo.fromLadder,

        dest_unknown: !!moveInfo.toUnknown,

        rooms: rooms
          .map((room, index) => {
            const visionId = visionImageIdByRoom?.[room.id];
            if (!visionId) return null;

            const items = (analysisByRoom?.[room.id] ?? [])
              .filter((i) => i.checked)
              .filter((i) => i.furnitureId != null)
              .map((i) => ({
                furniture_id: i.furnitureId,
                size_cm: { w_cm: i.width, d_cm: i.depth, h_cm: i.height },
                needs_disassembly: !!i.needsDisassembly,
              }));

            return {
              vision_image_id: visionId,
              sort_order: index + 1,
              items,
            };
          })
          .filter(Boolean),
      };

      if (moveInfo.toUnknown) {
        payload.dest_address = null;
        payload.dest_floor = null;
        payload.dest_has_elevator = null;
        payload.dest_use_ladder = null;
      } else {
        const addr = (moveInfo.toAddress ?? "").trim();
        payload.dest_address = addr;
        payload.dest_floor = moveInfo.toFloor;
        payload.dest_has_elevator = !!moveInfo.toElevator;
        payload.dest_use_ladder = !!moveInfo.toLadder;
      }

      const data = await requestEstimate(payload);
      set({ result: data, loading: false });
      return data;
    } catch (e) {
      console.error("estimate error", e);
      console.error("estimate error response data:", e?.response?.data);
      set({ loading: false });
      throw e;
    }
  },

  reset: () => set(initialState),
}));
