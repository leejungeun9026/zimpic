export default function ExtraItemAdder({
  loading,
  options,
  value,
  onChange,
  onAdd,
}) {
  return (
    <div className="d-flex align-items-center flex-wrap gap-2 mt-3">
      <div className="text-nowrap">
        목록에 없는 짐이 더 있어요!
      </div>
      <div className="d-flex gap-1">
        <select
          className="form-select form-select-sm"
          style={{ maxWidth: 160 }}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={loading}
        >
          {options.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.name_kr}
            </option>
          ))}
        </select>
        <button
          className="btn btn-dark btn-sm"
          onClick={onAdd}
          disabled={loading || !value}
        >
          짐 추가하기
        </button>
      </div>
    </div>
  );
}
