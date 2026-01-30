import { useEffect, useRef, useState } from "react";

export default function InfoTooltip({ content, maxWidth = 320 }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const closeTimer = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  if (!content) return null;

  const handleEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };

  const handleLeave = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    // 빈 공간 지나가도 안 닫히게 약간의 지연
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <span
      ref={ref}
      className="position-relative d-inline-block"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        type="button"
        className="btn btn-sm rounded-circle border-0"
        style={{
          width: 20,
          height: 20,
          padding: 0,
          background: "#EEF2F7",
          color: "#5A6B8C",
        }}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        !
      </button>

      {open && (
        <div
          className="position-absolute shadow border rounded-3 bg-white"
          style={{
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 1000,
            width: maxWidth,
            padding: "10px 12px",
          }}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
        >
          <div
            style={{
              position: "absolute",
              top: -6,
              left: 10,
              width: 10,
              height: 10,
              background: "white",
              borderLeft: "1px solid #dee2e6",
              borderTop: "1px solid #dee2e6",
              transform: "rotate(45deg)",
            }}
          />
          {content}
        </div>
      )}
    </span>
  );
}