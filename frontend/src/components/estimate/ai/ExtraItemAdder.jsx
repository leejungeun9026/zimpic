import { useMemo } from "react";

const CATEGORY_LABEL_KR = {
  GENERAL_APPLIANCE: "생활가전",
  KITCHEN_APPLIANCE: "주방가전",
  GENERAL_FURNITURE: "일반가구",
  SPECIAL_FURNITURE: "특수가구",
};

export default function ExtraItemAdder({
  loading,
  options,
  value,
  onChange,
  onAdd,
}) {

  const grouped = useMemo(() => {
    return (options ?? []).reduce((acc, opt) => {
      const catCode = opt.category ?? "ETC";
      const catLabel = CATEGORY_LABEL_KR[catCode] ?? catCode;
      (acc[catLabel] ||= []).push(opt);
      return acc;
    }, {});
  }, [options]);

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
          {Object.entries(grouped).map(([cat, items]) => (
            <optgroup key={cat} label={cat}>
              {items.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name_kr}
                </option>
              ))}
            </optgroup>
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
