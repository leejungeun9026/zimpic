export default function AddressField({
  label = "주소",
  value,
  placeholder,
  disabled,
  onFindAddress,
}) {
  return (
    <div className="mb-4">
      <label className="form-label fw-semibold">{label}</label>
      <div className="d-flex gap-1">
        <input
          type="text"
          className="form-control rounded-1"
          placeholder={placeholder}
          disabled={disabled}
          value={value}
          onClick={onFindAddress}
          readOnly
        />
        <div className="flex-shrink-0">
          <button
            className="btn btn-dark rounded-1"
            type="button"
            disabled={disabled}
            onClick={onFindAddress}
          >
            <span className="small">
              주소 찾기
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
