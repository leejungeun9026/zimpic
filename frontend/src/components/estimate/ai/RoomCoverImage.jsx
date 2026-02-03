import { useEffect, useMemo, useRef, useState } from "react";

export default function RoomCoverImage({ coverUrl, loading, detectedItems = [], activeId = null }) {
  const wrapRef = useRef(null);
  const imgRef = useRef(null);

  // 이미지가 실제로 차지하는 사각형이 어디인지 저장
  const [layout, setLayout] = useState({ imgLeft: 0, imgTop: 0, imgW: 0, imgH: 0 });

  //BBOX 좌표를 픽셀로 바꾸기 위해  위치 계산
  const recalc = () => {
    const wrap = wrapRef.current;
    const img = imgRef.current;
    if (!wrap || !img) return;

    const wrapW = wrap.clientWidth;
    const wrapH = wrap.clientHeight;

    const contentW = Math.max(0, wrapW);
    const contentH = Math.max(0, wrapH);

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

    const imgLeft = (contentW - drawW) / 2;
    const imgTop = (contentH - drawH) / 2;

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
      className="position-relative w-100 h-auto d-flex align-items-center justify-content-center rounded-2 border bg-light overflow-hidden"
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
            className="w-100 d-block"
            style={{ maxWidth: "480px" }}
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
              // const conf = typeof it.confidence === "number" ? ` ${(it.confidence * 100).toFixed(0)}%` : "";
              // const label = `${name}${conf}`;
              const label = `${name}`;

              return (
                <div
                  key={it.id ?? `${name}-${left}-${top}`}
                  className="position-absolute"
                  style={{
                    left,
                    top,
                    width,
                    height,
                    border: isActive ? "3px solid var(--bs-primary)" : "3px solid #000",
                    boxShadow: isActive ? "0 0 10px 5px rgba(255, 255, 255, 0.5)" : "none",
                    boxSizing: "border-box",
                    borderRadius: 6,
                    opacity: isDimmed ? 0.5 : 1,
                    transition: "all 0.15s ease",
                  }}
                >
                  {/* 라벨 */}
                  <div
                    className="position-absolute left-0 top-0 py-1 px-2 ms-1 rounded-top-1 text-white text-nowrap overflow-hidden"
                    style={{
                      transform: "translateY(-100%)",
                      background: isActive ? "var(--bs-primary)" : "#000",
                      maxWidth: 240,
                      textOverflow: "ellipsis",
                      opacity: isDimmed ? 0.5 : 1,
                      transition: "all 0.15s ease",
                      fontSize: "12px"
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
