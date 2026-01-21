import { create } from "zustand";

/* ---------------- 초기 상태 ---------------- */
const initialState = {
  /* 1️⃣ HomePage */
  basicInfo: {
    size: 15,
  },

  // HomePage에서 업로드한 이미지 (File[])
  images: [],

  /* 2️⃣ AICheckPage */
  detectedItems: [],
  loading: false,

  /* 3️⃣ AddressPage */
  moveInfo: {
    fromAddress: "",
    toAddress: "",
    fromFloor: 1,
    toFloor: 1,
    fromElevator: true, // ✅ 기본 true
    toElevator: true,   // ✅ 기본 true
  },

  /* 4️⃣ ResultPage */
  result: null,
};

/* ---------------- store ---------------- */
export const useEstimateStore = create((set, get) => ({
  ...initialState,

  /* ---------- HomePage ---------- */
  setBasicInfo: (data) =>
    set((state) => ({
      basicInfo: { ...state.basicInfo, ...data },
    })),

  setImages: (files) => set({ images: files }),

  /* ---------- AI 분석 ---------- */
  analyzeImages: async () => {
    set({ loading: true });

    // 🔹 나중에 실제 AI API 호출 위치
    setTimeout(() => {
      set({
        detectedItems: [
          {
            id: 1,
            name: "침대",
            checked: true,
            isSpecial: false,
            width: 200,
            depth: 150,
            height: 50,
          },
          {
            id: 2,
            name: "소파",
            checked: true,
            isSpecial: false,
            width: 180,
            depth: 80,
            height: 90,
          },
          {
            id: 3,
            name: "냉장고",
            checked: true,
            isSpecial: true,
            width: 90,
            depth: 80,
            height: 180,
          },
          {
            id: 4,
            name: "책상",
            checked: false,
            isSpecial: false,
            width: 120,
            depth: 60,
            height: 75,
          },
        ],
        loading: false,
      });
    }, 1500);
  },

  toggleItem: (id) =>
    set((state) => ({
      detectedItems: state.detectedItems.map((item) =>
        item.id === id
          ? { ...item, checked: !item.checked }
          : item
      ),
    })),

  updateDetectedItem: (id, data) =>
    set((state) => ({
      detectedItems: state.detectedItems.map((item) =>
        item.id === id ? { ...item, ...data } : item
      ),
    })),

  /* ---------- AddressPage ---------- */
  setMoveInfo: (data) =>
    set((state) => ({
      moveInfo: { ...state.moveInfo, ...data },
    })),

  /* ---------- Result 계산 ---------- */
  calculateResult: () => {
    const { basicInfo, detectedItems, moveInfo } = get();

    const basePrice = basicInfo.size * 10000;

    const itemPrice =
      detectedItems.filter((i) => i.checked).length * 20000;

    const floorExtra =
      moveInfo.fromFloor > 3 || moveInfo.toFloor > 3
        ? 30000
        : 0;

    const totalPrice = basePrice + itemPrice + floorExtra;

    set({
      result: {
        totalPrice,
        breakdown: {
          basePrice,
          itemPrice,
          floorExtra,
        },
      },
    });
  },

  /* ---------- 전체 초기화 ---------- */
  reset: () => set(initialState),
}));
