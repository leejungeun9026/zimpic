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
      <div className="d-flex gap-2">
        <input
          type="text"
          className="form-control"
          placeholder={placeholder}
          disabled={disabled}
          value={value}
          readOnly
        />
        <button
          className="btn btn-dark"
          style={{ whiteSpace: "nowrap" }}
          type="button"
          disabled={disabled}
          onClick={onFindAddress}
        >
          주소 찾기
        </button>
      </div>
    </div>
  );
}
