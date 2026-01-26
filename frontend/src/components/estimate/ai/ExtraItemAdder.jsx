export default function ExtraItemAdder({
  loading,
  options,
  value,
  onChange,
  onAdd,
}) {
  return (
    <div className="d-flex align-items-center gap-2 mt-3">
      <div className="text-muted small" style={{ whiteSpace: "nowrap" }}>
        목록에 없는 짐이 더 있어요
      </div>

      <select
        className="form-select form-select-sm"
        style={{ maxWidth: 160 }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>

      <button
        className="btn btn-outline-secondary btn-sm"
        onClick={onAdd}
        disabled={loading}
      >
        추가하기
      </button>
    </div>
  );
}
