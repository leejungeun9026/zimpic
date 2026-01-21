import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import StepIndicator from "../components/layout/StepIndicator";
import { useEstimateStore } from "../store/estimateStore";

export default function AICheckPage() {
  const navigate = useNavigate();

  const {
    images,          // TODO: 추후 preview 포함 구조로 store에서 관리
    detectedItems,
    loading,
    analyzeImages,
    toggleItem,
  } = useEstimateStore();

  const [editingItemId, setEditingItemId] = useState(null);

  /* ---------------- 이미지 preview 생성 / 해제 ---------------- */
  const imagePreviews = useMemo(() => {
    if (images.length === 0) return [];

    return images.map((file) =>
      URL.createObjectURL(file)
    );
  }, [images]);

  // cleanup 전용 effect
  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) =>
        URL.revokeObjectURL(url)
      );
    };
  }, [imagePreviews]);

  /* ---------------- 페이지 진입 시 AI 분석 (1회) ---------------- */
  useEffect(() => {
    if (images.length > 0 && detectedItems.length === 0) {
      analyzeImages();
    }
  }, [images, detectedItems.length, analyzeImages]);

  // 일반 / 특수 가구 분리
  const normalItems = detectedItems.filter((item) => !item.isSpecial);
  const specialItems = detectedItems.filter((item) => item.isSpecial);

  // 체크된 짐 개수
  const checkedCount = detectedItems.filter((item) => item.checked).length;

  // 짐 사이즈 수정 (store 연결 예정)
  const handleSizeChange = (itemId, field, value) => {
    // TODO: store에 updateItemSize(itemId, field, value) 구현 예정
    console.log(`Item ${itemId} ${field} changed to ${value}`);
  };

  /* ---------------- 로딩 화면 ---------------- */
  if (loading) {
    return (
      <div className="container py-5 text-center">
        <StepIndicator currentStep={2} />

        <h3 className="mt-4">AI가 이미지를 분석중입니다</h3>
        <p className="text-muted">
          짐을 인식하고 있어요. 잠시만 기다려 주세요.
        </p>

        <div className="spinner-border text-primary mt-4" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>

        <div
          className="progress mt-4"
          style={{ maxWidth: "400px", margin: "0 auto" }}
        >
          <div
            className="progress-bar progress-bar-striped progress-bar-animated"
            role="progressbar"
            style={{ width: "100%" }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="card shadow-sm p-4">
        <StepIndicator currentStep={2} />

        <h2 className="mb-2">AI 결과 체크</h2>
        <p className="text-muted mb-4">
          이사할 짐을 확인해주세요.
        </p>

        <div className="row g-4">
          {/* 이미지 영역 */}
          <div className="col-md-6">
            <h5 className="mb-3">업로드된 방 사진</h5>
            <div className="card h-100 p-2">
              <div className="d-flex flex-wrap gap-2">
                {imagePreviews.map((src, idx) => (
                  <img
                    key={idx}
                    src={src}
                    alt="room"
                    style={{
                      width: "280px",
                      height: "280px",
                      objectFit: "cover",
                      borderRadius: "8px",
                      border: "1px solid #ddd",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* 짐 리스트 */}
          <div className="col-md-6">
            <h5 className="mb-3">
              인식된 짐 목록 ({checkedCount}개 선택됨)
            </h5>

            {/* 일반 가구 */}
            <div
              className="card mb-3"
              style={{ maxHeight: "400px", overflowY: "auto" }}
            >
              <div className="card-header bg-light">
                <h6 className="mb-0">일반 가구</h6>
              </div>

              <ul className="list-group list-group-flush">
                {normalItems.map((item) => (
                  <li
                    key={item.id}
                    className={`list-group-item ${
                      item.checked ? "" : "opacity-50"
                    }`}
                  >
                    <div className="form-check mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`item-${item.id}`}
                        checked={item.checked}
                        onChange={() => toggleItem(item.id)}
                      />
                      <label
                        className="form-check-label fw-bold"
                        htmlFor={`item-${item.id}`}
                      >
                        {item.name}
                      </label>
                    </div>

                    {item.checked && (
                      <div className="ms-4">
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <small className="text-muted">
                            평균 사이즈 (cm)
                          </small>

                          {editingItemId === item.id ? (
                            <>
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => setEditingItemId(null)}
                              >
                                저장
                              </button>
                              <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => setEditingItemId(null)}
                              >
                                취소
                              </button>
                            </>
                          ) : (
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => setEditingItemId(item.id)}
                            >
                              수정
                            </button>
                          )}
                        </div>

                        <div className="row g-2">
                          {[
                            ["width", "가로"],
                            ["depth", "세로"],
                            ["height", "높이"],
                          ].map(([field, label]) => (
                            <div className="col-4" key={field}>
                              <label className="form-label small">
                                {label}
                              </label>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                defaultValue={item[field] || 0}
                                disabled={editingItemId !== item.id}
                                onChange={(e) =>
                                  handleSizeChange(
                                    item.id,
                                    field,
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* 특수 가구 */}
            {specialItems.length > 0 && (
              <div className="card border-warning">
                <div className="card-header bg-warning bg-opacity-10">
                  <h6 className="mb-0 text-warning">⚠️ 특수 가구</h6>
                  <small className="text-muted">
                    에어컨, 피아노, 붙박이장 등은 추가 비용이 발생할 수 있습니다
                  </small>
                </div>

                <ul className="list-group list-group-flush">
                  {specialItems.map((item) => (
                    <li
                      key={item.id}
                      className={`list-group-item ${
                        item.checked ? "" : "opacity-50"
                      }`}
                    >
                      <div className="form-check mb-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`special-${item.id}`}
                          checked={item.checked}
                          onChange={() => toggleItem(item.id)}
                        />
                        <label
                          className="form-check-label fw-bold"
                          htmlFor={`special-${item.id}`}
                        >
                          {item.name}
                        </label>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* 참고사항 */}
        <h4 className="mt-5">참고사항</h4>
        <div className="card mt-2 bg-light">
          <div className="card-body text-muted small">
            <p className="mb-1">
              • AI가 인식한 짐 목록입니다. 실제와 다를 수 있으니 확인해주세요.
            </p>
            <p className="mb-1">
              • 체크된 항목만 최종 견적에 반영됩니다.
            </p>
            <p className="mb-0">
              • 평균 사이즈가 다르면 수정 버튼을 눌러 직접 입력하세요.
            </p>
          </div>
        </div>

        {/* 버튼 */}
        <div className="d-flex justify-content-between mt-4">
          <button
            className="btn btn-outline-secondary"
            onClick={() => navigate("/HomePage")}
          >
            이전
          </button>

          <button
            className="btn btn-primary"
            onClick={() => navigate("/AddressPage")}
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
}
