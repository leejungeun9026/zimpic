export default function SectionHeader({ title, right }) {
  return (
    <div className="d-flex justify-content-between align-items-center mb-3">
      <div className="d-flex align-items-center gap-2">
        <div
          style={{
            width: 4,
            height: 18,
            background: "var(--bs-primary)",
            borderRadius: 2,
          }}
        />
        <h5 className="fw-semibold text-primary">{title} 정보</h5>
      </div>

      {right ? <div>{right}</div> : null}
    </div>
  );
}
