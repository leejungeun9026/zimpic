import { create } from "zustand";

/* ---------------- 초기 상태 ---------------- */
const initialState = {
  /* HomePage */
  basicInfo: {
    size: 15,
    moveType: "normal", // 설계에 있는 값이라 기본 넣어둠(원하면 삭제 가능)
  },

  // ✅ 공간(방/거실/주방 등) + 각 공간의 이미지(File[])
  rooms: [
    {
      id: 1,
      type: "거실",
      images: [], // [{ id, file }]
    },
  ],

  /* 2) AICheckPage */
  // roomId별 AI 분석 결과
  analysisByRoom: {
    // [roomId]: detectedItems[]
  },
  loading: false,

  /* 3) AddressPage */
  moveInfo: {
    fromAddress: "",
    toAddress: "",
    fromFloor: 1,
    toFloor: 1,

    // ✅ 체크박스 형태(둘 다/둘 다 아님 가능)
    fromElevator: false,
    fromLadder: false,
    toElevator: false,
    toLadder: false,

    // ✅ 도착지 미정
    toUnknown: false,
  },

  /* 4) ResultPage */
  result: null,
};

/* ---------------- helpers ---------------- */
const createId = () => Date.now() + Math.floor(Math.random() * 1000);

// (임시) 더미 분석 결과 생성
const mockDetectedItems = () => [
  {
    id: createId(),
    name: "소파",
    checked: true,
    isSpecial: false,
    width: 300,
    height: 200,
    depth: 100,
    count: 1,
  },
  {
    id: createId(),
    name: "에어컨",
    checked: true,
    isSpecial: true,
    width: 300,
    height: 200,
    depth: 100,
    count: 1,
  },
  {
    id: createId(),
    name: "실외기",
    checked: true,
    isSpecial: true,
    width: 300,
    height: 200,
    depth: 100,
    count: 1,
  },
  {
    id: createId(),
    name: "시스템행거",
    checked: true,
    isSpecial: false,
    width: 300,
    height: 200,
    depth: 100,
    count: 1,
  },
];

/* ---------------- store ---------------- */
export const useEstimateStore = create((set, get) => ({
  ...initialState,

  /* ---------- basicInfo ---------- */
  setBasicInfo: (data) =>
    set((state) => ({
      basicInfo: { ...state.basicInfo, ...data },
    })),

  /* ---------- rooms (HomePage) ---------- */
  setRooms: (rooms) => set({ rooms }),

  addRoom: (type = "방") =>
    set((state) => {
      const rooms = state.rooms ?? [];

      const UNIQUE_SPACES = ["거실", "주방", "베란다", "다용도실"];
      const MAX_ROOM_COUNT = 5;

      // 1) 유니크 공간(거실/주방/베란다/다용도실)은 중복 추가 불가
      if (UNIQUE_SPACES.includes(type)) {
        const already = rooms.some((r) => r.type === type);
        if (already) return state;
        return {
          rooms: [...rooms, { id: createId(), type, images: [] }],
        };
      }

      // 2) "방"은 최대 5개
      if (type === "방") {
        const roomCount = rooms.filter((r) => r.type === "방").length;
        if (roomCount >= MAX_ROOM_COUNT) return state;

        return {
          rooms: [...rooms, { id: createId(), type: "방", images: [] }],
        };
      }

      // 3) 그 외 타입이 들어오면 그냥 추가(혹시 몰라 안전)
      return {
        rooms: [...rooms, { id: createId(), type, images: [] }],
      };
    }),

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

  addRoomImages: (roomId, files) =>
    set((state) => ({
      rooms: state.rooms.map((r) => {
        if (r.id !== roomId) return r;
        const newImages = files.map((file) => ({
          id: createId(),
          file,
        }));
        return { ...r, images: [...r.images, ...newImages] };
      }),
    })),

  removeRoomImage: (roomId, imageId) =>
    set((state) => ({
      rooms: state.rooms.map((r) => {
        if (r.id !== roomId) return r;
        return {
          ...r,
          images: r.images.filter((img) => img.id !== imageId),
        };
      }),
    })),

  // ✅ AICheckPage에서 “전체 File[]” 필요할 때
  getAllImageFiles: () => {
    const { rooms } = get();
    return rooms.flatMap((r) => r.images.map((img) => img.file));
  },

  /* ---------- AI 분석 ---------- */
  analyzeImages: async () => {
    const { rooms } = get();
    const hasAnyImage = rooms.some((r) => r.images.length > 0);

    if (!hasAnyImage) {
      set({ loading: false });
      return;
    }

    set({ loading: true });

    // TODO: 서버 붙으면 여기서 FormData로 room별 이미지 보내고 결과 받아서 analysisByRoom 채우기
    setTimeout(() => {
      const next = {};
      rooms.forEach((room) => {
        // 방에 이미지가 있는 방만 분석 결과를 만들자
        if (room.images.length > 0) {
          next[room.id] = mockDetectedItems();
        } else {
          next[room.id] = [];
        }
      });

      set({
        analysisByRoom: next,
        loading: false,
      });
    }, 1200);
  },

  // ✅ 특정 room의 아이템 가져오기(편의)
  getItemsByRoom: (roomId) => {
    const { analysisByRoom } = get();
    return analysisByRoom?.[roomId] ?? [];
  },

  toggleItem: (roomId, itemId) =>
    set((state) => ({
      analysisByRoom: {
        ...state.analysisByRoom,
        [roomId]: (state.analysisByRoom?.[roomId] ?? []).map((item) =>
          item.id === itemId
            ? { ...item, checked: !item.checked }
            : item
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

  // (선택) 수동 추가용 – 설계의 “목록에 없는 짐 추가”
  addManualItem: (roomId, name) =>
    set((state) => {
      const list = state.analysisByRoom?.[roomId] ?? [];
      const newItem = {
        id: createId(),
        name,
        checked: true,
        isSpecial: false,
        width: 300,
        height: 200,
        depth: 100,
        count: 1,
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

  /* ---------- Result 계산 ---------- */
  calculateResult: () => {
    const { basicInfo, analysisByRoom, moveInfo } = get();

    // 체크된 짐 총 개수
    const allCheckedItems = Object.values(analysisByRoom || {})
      .flat()
      .filter((i) => i.checked);

    const itemCount = allCheckedItems.reduce(
      (sum, i) => sum + (i.count ?? 1),
      0
    );

    // 간단한 더미 계산 (서버 붙으면 여기 없애고 API 결과로 세팅하면 됨)
    const basePrice = basicInfo.size * 10000;
    const itemPrice = itemCount * 20000;

    // 층수 비용
    const floorExtra =
      (moveInfo.fromFloor > 3 ? 1 : 0) + (moveInfo.toUnknown ? 0 : (moveInfo.toFloor > 3 ? 1 : 0))
        ? 30000
        : 0;

    // 사다리차 비용: 체크박스 기준
    const ladderUsed = moveInfo.fromLadder || (!moveInfo.toUnknown && moveInfo.toLadder);
    const ladderPrice = ladderUsed ? 290000 : 0;

    // 특수 짐 비용: isSpecial 기준(더미)
    const specialCount = allCheckedItems.filter((i) => i.isSpecial).length;
    const specialPrice = specialCount * 40000;

    const totalPrice = basePrice + itemPrice + floorExtra + ladderPrice + specialPrice;

    set({
      result: {
        totalPrice,
        distanceKm: 12, // 더미
        vehicleText: "5톤 트럭 1대", // 더미
        breakdown: {
          basePrice,
          itemPrice,
          floorExtra,
          ladderPrice,
          specialPrice,
        },
      },
    });
  },

  /* ---------- 전체 초기화 ---------- */
  reset: () => set(initialState),
}));
