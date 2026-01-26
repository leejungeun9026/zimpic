export default function RoomCoverImage({ coverUrl, loading }) {
  return (
    <div
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
        <img
          src={coverUrl}
          alt="preview"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            padding: 16,
          }}
        />
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
