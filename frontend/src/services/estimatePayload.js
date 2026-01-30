/**
 * /api/estimates/ 요청 payload 생성
 */
export function buildEstimatePayload({
  basicInfo,
  moveInfo,
  rooms,
  analysisByRoom,
}) {
  return {
    move_type: basicInfo.moveType,
    area: basicInfo.area,

    origin_address: moveInfo.originAddress,
    origin_floor: moveInfo.originFloor,
    origin_has_elevator: moveInfo.originHasElevator,
    origin_use_ladder: moveInfo.originUseLadder,

    dest_address: moveInfo.destAddress,
    dest_floor: moveInfo.destFloor,
    dest_has_elevator: moveInfo.destHasElevator,
    dest_use_ladder: moveInfo.destUseLadder,

    rooms: rooms.map((room, index) => {
      const detectedItems = analysisByRoom?.[room.id] ?? [];

      const items = detectedItems
        .filter((it) => it.checked)
        .map((it) => ({
          furniture_id: it.furnitureId,
          size_cm: {
            w_cm: it.width,
            d_cm: it.depth,
            h_cm: it.height,
          },
          needs_disassembly: !!it.needsDisassembly,
        }));

      return {
        vision_image_id: room.visionImageId,
        sort_order: index,
        items,
      };
    }),
  };
}
