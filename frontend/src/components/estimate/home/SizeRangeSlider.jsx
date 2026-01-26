export default function SizeRangeSlider({ value, onChange }) {
  return (
    <>
      <p className="fw-bold mb-2 mt-4">평수 : {value}평</p>
      <input
        type="range"
        className="form-range"
        min="5"
        max="50"
        step="1"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />

      <div className="d-flex justify-content-between text-muted small px-1">
        <span>5</span><span>10</span><span>15</span><span>20</span><span>25</span>
        <span>30</span><span>35</span><span>40</span><span>45</span><span>50</span>
      </div>
    </>
  );
}
