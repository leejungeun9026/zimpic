import { useEffect, useMemo, useRef, useState } from "react";

export default function RoomCoverImage({ coverUrl, loading, detectedItems = [], activeId = null }) {
  const wrapRef = useRef(null);
  const imgRef = useRef(null);

  // 이미지가 실제로 차지하는 사각형이 어디인지 저장
  const [layout, setLayout] = useState({ imgLeft: 0, imgTop: 0, imgW: 0, imgH: 0 });
  const PADDING = 16;

  //BBOX 좌표를 픽셀로 바꾸기 위해  위치 계산
  const recalc = () => {
    const wrap = wrapRef.current;
    const img = imgRef.current;
    if (!wrap || !img) return;

    const wrapW = wrap.clientWidth;
    const wrapH = wrap.clientHeight;

    const contentW = Math.max(0, wrapW - PADDING * 2);
    const contentH = Math.max(0, wrapH - PADDING * 2);

    const naturalW = img.naturalWidth || 1;
    const naturalH = img.naturalHeight || 1;
    const imgAspect = naturalW / naturalH;

    let drawW = contentW;
    let drawH = contentH;

    if (contentW / contentH > imgAspect) {
      drawH = contentH;
      drawW = contentH * imgAspect;
    } else {
      drawW = contentW;
      drawH = contentW / imgAspect;
    }

    const imgLeft = PADDING + (contentW - drawW) / 2;
    const imgTop = PADDING + (contentH - drawH) / 2;

    setLayout({ imgLeft, imgTop, imgW: drawW, imgH: drawH });
  };

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    // 화면 크기가 변하면 이미지 그려지는 위치도 바뀌니까 자동으로 recalc 다시 돌림
    const ro = new ResizeObserver(() => recalc());
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [coverUrl]);

  const boxes = useMemo(() => {
    return (detectedItems || [])
      .filter((it) => it?.bbox)
      // 체크된 것만 보이게 (체크 해제하면 박스 사라짐)
      .filter((it) => it.checked)
      .map((it) => {
        const { x, y, w, h } = it.bbox; // normalized center-xywh
        const left = layout.imgLeft + (x - w / 2) * layout.imgW;
        const top = layout.imgTop + (y - h / 2) * layout.imgH;
        const width = w * layout.imgW;
        const height = h * layout.imgH;

        return { it, left, top, width, height };
      });
  }, [detectedItems, layout]);

  return (
    <div
      ref={wrapRef}
      className="position-relative w-100 mb-3 d-flex align-items-center justify-content-center"
      style={{
        background: "#F3F6FB",
        borderRadius: 12,
        height: 360,
        border: "1px solid #E6EDF7",
        overflow: "hidden",
      }}
    >
      {!coverUrl ? (
        <div className="text-muted">이미지가 없습니다</div>
      ) : (
        <>
          <img
            ref={imgRef}
            src={coverUrl}
            alt="preview"
            onLoad={recalc}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              padding: PADDING,
              display: "block",
            }}
          />

          {/* Bounding boxes overlay */}
          <div
            className="position-absolute top-0 start-0 w-100 h-100"
            style={{ pointerEvents: "none" }}
          >
            {boxes.map(({ it, left, top, width, height }) => {
              const isActive = activeId != null && it.id === activeId;
              const isDimmed = activeId != null && it.id !== activeId;

              const name = it.name ?? "UNKNOWN";
              const conf = typeof it.confidence === "number" ? ` ${(it.confidence * 100).toFixed(0)}%` : "";
              const label = `${name}${conf}`;

              return (
                <div
                  key={it.id ?? `${name}-${left}-${top}`}
                  style={{
                    position: "absolute",
                    left,
                    top,
                    width,
                    height,
                    border: isActive ? "3px solid #dc3545" : "2px solid #0d6efd",
                    boxShadow: isActive ? "0 0 0 2px rgba(220,53,69,0.2)" : "none",
                    boxSizing: "border-box",
                    borderRadius: 6,
                    opacity: isDimmed ? 0.5 : 1,
                    transition: "opacity 0.15s ease, border 0.15s ease",
                  }}
                >
                  {/* 라벨 */}
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      transform: "translateY(-110%)",
                      background: isActive ? "rgba(220,53,69,0.92)" : "rgba(13,110,253,0.92)",
                      color: "#fff",
                      fontSize: 12,
                      padding: "3px 8px",
                      borderRadius: 8,
                      whiteSpace: "nowrap",
                      maxWidth: 240,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      opacity: isDimmed ? 0.5 : 1,
                      transition: "opacity 0.15s ease",
                    }}
                    title={label}
                  >
                    {label}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {loading && (
        <div
          className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center"
          style={{
            background: "rgba(255,255,255,0.65)",
            backdropFilter: "blur(2px)",
          }}
        >
          <div className="spinner-border text-primary" role="status" />
          <div className="mt-2 fw-semibold">AI가 분석중입니다…</div>
          <div className="text-muted small">잠시만 기다려 주세요</div>
        </div>
      )}
    </div>
  );
}
