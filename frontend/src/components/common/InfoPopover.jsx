import { Info } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import Popover from "bootstrap/js/dist/popover";
import { renderToStaticMarkup } from "react-dom/server";

export default function InfoPopover({
  content,
  maxWidth = 340,
  placement = "bottom",
}) {
  const btnRef = useRef(null);
  const popRef = useRef(null);
  const id = useId();

  useEffect(() => {
    if (!btnRef.current || !content) return;

    const html =
      typeof content === "string" ? content : renderToStaticMarkup(content);

    popRef.current?.dispose();

    popRef.current = new Popover(btnRef.current, {
      content: html,
      placement,
      trigger: "manual",
      html: true,
      container: btnRef.current.parentElement,
      sanitize: false,
      template: `
        <div class="popover" role="tooltip" style="pointer-events:auto; z-index:"99999"">
          <div class="popover-arrow"></div>
          <div class="popover-body"></div>
        </div>
      `,
    });

    const getTip = () => popRef.current?.getTipElement?.();

    // ✅ maxWidth 적용
    const onShown = () => {
      const tip = getTip();
      const body = tip?.querySelector(".popover-body");
      if (body) {
        body.style.maxWidth = `${maxWidth}px`;
        body.style.whiteSpace = "normal";
      }
    };
    btnRef.current.addEventListener("shown.bs.popover", onShown);

    // ✅ "바깥 클릭"으로 닫기: mousedown 말고 click 사용 (링크 클릭 방해 줄임)
    const onDocClick = (e) => {
      const tip = getTip();
      const btn = btnRef.current;
      if (!btn) return;

      // 버튼 또는 popover 내부 클릭이면 닫지 않음
      if (btn.contains(e.target) || tip?.contains(e.target)) return;

      popRef.current?.hide();
    };

    // ✅ capture 단계에서 잡아두면 안정적 (상위 컴포넌트 stopPropagation 영향 최소)
    document.addEventListener("click", onDocClick, true);

    // ✅ ESC로 닫기 (선택이지만 UX 좋음)
    const onKeyDown = (e) => {
      if (e.key === "Escape") popRef.current?.hide();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("click", onDocClick, true);
      document.removeEventListener("keydown", onKeyDown);
      btnRef.current?.removeEventListener("shown.bs.popover", onShown);
      popRef.current?.dispose();
      popRef.current = null;
    };
  }, [content, maxWidth, placement]);

  if (!content) return null;

  const toggle = (e) => {
    e.stopPropagation();
    const p = popRef.current;
    if (!p) return;

    const tip = p.getTipElement?.();
    const isShown = !!tip && tip.classList.contains("show");
    isShown ? p.hide() : p.show();
  };

  return (
    <button
      ref={btnRef}
      id={`info-popover-${id}`}
      type="button"
      className="btn btn-sm rounded-circle border-0"
      onClick={toggle}
      aria-label="info"
    >
      <Info size={16} />
    </button>
  );
}
