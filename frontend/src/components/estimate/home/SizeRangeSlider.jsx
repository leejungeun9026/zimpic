// 집 평수를 숫자 하나로 입력받는 UI

export default function SizeRangeSlider({ value, onChange }) {
  return (
    <>
      <h5 className="fw-bold mb-2" style={{ fontSize: "18px" }}>
        평수 : <span className="text-primary">{value}</span>평
      </h5>
      <input
        type="range"
        className="form-range custom-range"
        min="5"
        max="50"
        step="1"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />

      <div className="d-flex justify-content-between text-muted small">
        <span className="px-1">5</span>
        <span className="d-none d-md-block">10</span>
        <span className="d-none d-md-block">15</span>
        <span>20</span>
        <span className="d-none d-md-block">25</span>
        <span className="d-none d-md-block">30</span>
        <span>35</span>
        <span className="d-none d-md-block">40</span>
        <span className="d-none d-md-block">45</span>
        <span>50</span>
      </div>

      <style>
        {`
           .custom-range {
             accent-color: var(--bs-primary);
           }
        `}
      </style>
    </>
  );
}
