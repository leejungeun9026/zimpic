// 이사 유형(normal / packing) 중 하나를 선택하게 하는 UI

import { Package2, Truck } from "lucide-react";

export default function MoveTypeSelector({ value, onChange }) {
  return (
    <>
      <div className="subtitle mb-3">
        <h5 className="fw-bold" style={{ fontSize: "18px" }}>이사 유형 선택</h5>
      </div>

      <div className="row g-2">
        <div className="col-12 col-md-6">
          <button
            type="button"
            className={`w-100 h-100 text-start rounded-3 btn move-type-btn p-3 ${value === "normal" ? "selected border-primary" : "border-secondary border-opacity-25"
              }`}
            onClick={() => onChange("normal")}
          >
            <div className="d-flex align-items-center gap-3">
              <div className="icon_wrap icon-box-48 flex-shrink-0 rounded-3">
                <Truck className="mb-1" />
              </div>
              <div className="text">
                <div className="fw-bold">일반 이사</div>
                <div className="text-muted small">
                  직접 짐을 포장하고, 이사업체는 운반만 담당합니다.
                </div>
              </div>
            </div>
          </button>
        </div>

        <div className="col-12 col-md-6">
          <button
            type="button"
            className={`w-100 h-100 text-start rounded-3 btn move-type-btn p-3 ${value === "packing" ? "selected border-primary" : "border-secondary border-opacity-25"
              }`}
            onClick={() => onChange("packing")}
          >
            <div className="d-flex align-items-center gap-3">
              <div className="icon_wrap icon-box-48 flex-shrink-0 rounded-3">
                <Package2 />
              </div>
              <div className="text">
                <div className="fw-bold">포장 이사</div>
                <div className="text-muted small">
                  업체가 모든 짐을 포장, 운반, 정리합니다.
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>

      <style>
        {`
          .move-type-btn {
          transition: all 0.3s;
          }
          .move-type-btn.selected {
            box-shadow: inset 0 0 0 1px var(--bs-primary);
          }
          .move-type-btn .icon_wrap {
            background: rgba(var(--bs-secondary-rgb), 0.2);
          }
          .move-type-btn.selected .icon_wrap {
            background: rgba(var(--bs-primary-rgb), 0.2);
            color: var(--bs-primary);
          }
        `}
      </style>
    </>
  );
}
