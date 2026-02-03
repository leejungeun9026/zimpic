import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { analyzeVision } from "../services/visionApi";
import { requestEstimate } from "../services/estimateApi";

// imageDB 유틸 (경로 확인!)
import {
  saveRoomImage,
  loadRoomImage,
  deleteRoomImage,
  clearAllRoomImages,
} from "../utils/imageDB";

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
      images: [], // [{ id, file }]
    },
  ],

  analysisByRoom: {},
  visionImageIdByRoom: {},

  loading: false,

  // "idle" | "loading" | "done" | "error"
  visionStatus: "idle",

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

const outdoorEnFromAirconEn = (airconNameEn) => {
  if (airconNameEn === "air_conditioner_wall") return "ac_outdoor_wall";
  if (airconNameEn === "air_conditioner_stand") return "ac_outdoor_stand";
  return null;
};

const outdoorFurnitureIdFromAirconEn = (airconNameEn) => {
  if (airconNameEn === "air_conditioner_wall") return 39; // 벽걸이 실외기
  if (airconNameEn === "air_conditioner_stand") return 40; // 스탠드 실외기
  return null;
};

/* persist 적용 */
export const useEstimateStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      /* (필수) 새로고침 후 IndexedDB에서 이미지 복원 */
      hydrateRoomImages: async () => {
        const { rooms } = get();

        const nextRooms = await Promise.all(
          (rooms ?? []).map(async (r) => {
            // partialize에서 hasFile=true로 저장해두면, 없는 방은 굳이 읽지 않게 최적화 가능
            const hasFile = !!(r.images?.[0]?.hasFile);

            if (!hasFile) {
              return { ...r, images: [] };
            }

            const file = await loadRoomImage(r.id).catch(() => null);
            if (!file) return { ...r, images: [] };

            // 복원 시 images는 실제 file을 다시 꽂아줌
            return { ...r, images: [{ id: createId(), file }] };
          })
        );

        set({ rooms: nextRooms });
      },

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
        set((state) => {
          // 방 자체 삭제하면 저장된 이미지도 삭제
          deleteRoomImage(roomId).catch(console.error);

          // 관련 분석도 제거(깔끔)
          const nextAnalysis = { ...(state.analysisByRoom ?? {}) };
          const nextVisionIds = { ...(state.visionImageIdByRoom ?? {}) };
          delete nextAnalysis[roomId];
          delete nextVisionIds[roomId];

          return {
            rooms: state.rooms.filter((r) => r.id !== roomId),
            analysisByRoom: nextAnalysis,
            visionImageIdByRoom: nextVisionIds,
          };
        }),

      updateRoomType: (roomId, type) =>
        set((state) => ({
          rooms: state.rooms.map((r) => (r.id === roomId ? { ...r, type } : r)),
        })),

      // 방당 이미지 1장 고정
      addRoomImages: (roomId, files) =>
        set((state) => {
          const first = files?.[0];
          if (!first) return state;

          // IndexedDB에 파일 저장
          saveRoomImage(roomId, first).catch(console.error);

          return {
            rooms: state.rooms.map((r) => {
              if (r.id !== roomId) return r;
              return { ...r, images: [{ id: createId(), file: first }] };
            }),

            // 이미지 바뀌면 분석 다시 해야 하므로 초기화
            analysisByRoom: {},
            visionImageIdByRoom: {},
            visionStatus: "idle",
          };
        }),

      removeRoomImage: (roomId) =>
        set((state) => {
          // IndexedDB에서도 삭제
          deleteRoomImage(roomId).catch(console.error);

          return {
            rooms: state.rooms.map((r) =>
              r.id === roomId ? { ...r, images: [] } : r
            ),
            analysisByRoom: {},
            visionImageIdByRoom: {},
            visionStatus: "idle",
          };
        }),

      /* ---------- AI 분석 ---------- */
      analyzeImages: async () => {
        const { rooms, visionStatus } = get();
        const roomsWithImage = rooms.filter((r) => r.images?.[0]?.file);
        if (roomsWithImage.length === 0) return;

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

            let lastWallAirconId = null;
            let lastStandAirconId = null;

            analysisByRoom[room.id] = (result.detections || []).map((d) => {
              const nameEn = d?.name_en ?? d?.yolo_class ?? null;
              const outdoor = isOutdoorEn(nameEn);
              const aircon = isAirconEn(nameEn);

              let parentId = null;
              if (aircon) {
                if (nameEn === "air_conditioner_wall")
                  lastWallAirconId = d.detection_id;
                if (nameEn === "air_conditioner_stand")
                  lastStandAirconId = d.detection_id;
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
                autoAdded: outdoor,
                parentId,
              };
            });
          });

          set({
            analysisByRoom,
            visionImageIdByRoom,
            visionStatus: "done",
          });
        } catch (e) {
          console.error("vision error", e);
          alert("이미지 분석에 실패했습니다.");
          set({ visionStatus: "error" });
        } finally {
          const elapsed = Date.now() - start;
          const wait = Math.max(0, MIN_LOADING_MS - elapsed);
          if (wait) await new Promise((r) => setTimeout(r, wait));
          set({ loading: false });
        }
      },

      getItemsByRoom: (roomId) => get().analysisByRoom?.[roomId] ?? [],

      /* ---------- 체크 토글 ---------- */
      toggleItem: (roomId, itemId) =>
        set((state) => {
          const list = state.analysisByRoom?.[roomId] ?? [];
          const target = list.find((it) => it.id === itemId);
          if (!target) return state;

          const nextChecked = !target.checked;

          const targetIsParentAircon = isAirconEn(target?.nameEn);
          const targetIsOutdoor = isOutdoorEn(target?.nameEn);

          if (targetIsParentAircon) {
            const parentId = target.id;
            const nextList = list.map((it) => {
              if (it.id === parentId) return { ...it, checked: nextChecked };
              if (it.parentId === parentId)
                return { ...it, checked: nextChecked };
              return it;
            });

            return {
              analysisByRoom: { ...state.analysisByRoom, [roomId]: nextList },
            };
          }

          if (targetIsOutdoor && target.parentId) {
            const parentId = target.parentId;
            const nextList = list.map((it) => {
              if (it.id === itemId) return { ...it, checked: nextChecked };
              if (nextChecked === true && it.id === parentId) {
                return { ...it, checked: true };
              }
              return it;
            });

            return {
              analysisByRoom: { ...state.analysisByRoom, [roomId]: nextList },
            };
          }

          const nextList = list.map((it) =>
            it.id === itemId ? { ...it, checked: nextChecked } : it
          );

          return {
            analysisByRoom: { ...state.analysisByRoom, [roomId]: nextList },
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

      /* ---------- 수동 추가 ---------- */
      addManualItem: (roomId, furniture) =>
        set((state) => {
          const list = state.analysisByRoom?.[roomId] ?? [];
          const byId = state.furniturePolicyById ?? {};

          const airconNameEn = furniture?.name_en ?? null;
          const isAircon = isAirconEn(airconNameEn);

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
                autoAdded: true,
                parentId,
              });
            }
          }

          return {
            analysisByRoom: { ...state.analysisByRoom, [roomId]: next },
          };
        }),

      /* ---------- 수동 삭제 ---------- */
      removeManualItem: (roomId, itemId) =>
        set((state) => {
          const list = state.analysisByRoom?.[roomId] ?? [];
          const target = list.find((item) => item.id === itemId);
          if (!target?.manual) return state;

          const targetIsAircon = isAirconEn(target.nameEn);

          const next = list.filter((it) => {
            if (it.id === itemId) return false;
            if (targetIsAircon && it.parentId === itemId) return false;
            return true;
          });

          return {
            analysisByRoom: { ...state.analysisByRoom, [roomId]: next },
          };
        }),

      /* ---------- AddressPage ---------- */
      setMoveInfo: (data) =>
        set((state) => ({
          moveInfo: { ...state.moveInfo, ...data },
        })),

      /* ---------- 견적 요청 ---------- */
      calculateResult: async () => {
        set({ loading: true });

        try {
          const {
            basicInfo,
            moveInfo,
            rooms,
            analysisByRoom,
            visionImageIdByRoom,
          } = get();

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

      /* reset: 상태 초기화 + indexedDB 이미지도 같이 삭제 */
      reset: () => {
        clearAllRoomImages().catch(console.error);
        set(initialState);
      },

      /* “처음으로” 같은 버튼에서 localStorage까지 싹 비우고 싶을 때 */
      clearPersist: () => {
        localStorage.removeItem("estimate-store"); // persist name과 동일해야 함
      },
    }),
    {
      name: "estimate-store",
      storage: createJSONStorage(() => localStorage),

      // 제일 중요: rooms.images.file은 저장하지 말고 "있다/없다"만 저장
      partialize: (state) => ({
        basicInfo: state.basicInfo,

        rooms: (state.rooms ?? []).map((r) => ({
          id: r.id,
          type: r.type,
          images: [
            {
              // file은 저장 불가 → 대신 hasFile만
              hasFile: !!(r.images?.[0]?.file),
            },
          ],
        })),

        analysisByRoom: state.analysisByRoom,
        visionImageIdByRoom: state.visionImageIdByRoom,
        visionStatus: state.visionStatus,

        furniturePolicyList: state.furniturePolicyList,
        furniturePolicyById: state.furniturePolicyById,

        moveInfo: state.moveInfo,
        result: state.result,
      }),
    }
  )
);
