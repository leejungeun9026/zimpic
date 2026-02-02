export default function AddressField({
  value,
  disabled,
  onFindAddress,
  title
}) {
  return (
    <div className="mb-4">
      <p className="form-label fw-semibold" htmlFor="">{title} 주소</p>
      <div className="d-flex gap-1">
        <input
          type="text"
          className="form-control rounded-1"
          placeholder="도로명 주소"
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
