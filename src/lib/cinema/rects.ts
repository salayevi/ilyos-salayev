/**
 * Document-absolute geometry, measured on change rather than per frame.
 *
 * Everything that wants to know "where am I relative to the viewport" needs a
 * rect, and `getBoundingClientRect()` inside an animation loop forces the
 * browser to flush layout on every tick. But an element's position in the
 * *document* only moves when something reflows — a resize, a font swapping in,
 * an image arriving and pushing the page down.
 *
 * So measure then, cache the document-absolute top, and derive the viewport
 * position each frame from the one `scrollY` the ticker already read. No
 * layout in the loop at all.
 */

export type Measured = {
  /** Distance from the top of the document. */
  top: number;
  height: number;
};

type Handle = { el: HTMLElement; box: Measured };

export class RectBook {
  private handles: Handle[] = [];
  private ro: ResizeObserver | null = null;
  private onChange: (() => void) | null = null;
  private pending = 0;

  constructor(onChange?: () => void) {
    this.onChange = onChange ?? null;
    if (typeof ResizeObserver !== "undefined") {
      // One observer for every tracked element. Any size change anywhere can
      // move everything below it, so a single change re-measures the lot —
      // cheap, because it happens on reflow rather than on frames.
      this.ro = new ResizeObserver(() => this.scheduleRemeasure());
    }
    if (typeof window !== "undefined") {
      window.addEventListener("resize", this.scheduleRemeasure, { passive: true });
      window.addEventListener("load", this.scheduleRemeasure);
    }
  }

  /**
   * Tracks `el` and returns a live box that stays current. Callers hold the
   * object, never a copy of its fields.
   */
  observe(el: HTMLElement): { box: Measured; release: () => void } {
    const handle: Handle = { el, box: { top: 0, height: 0 } };
    this.handles.push(handle);
    this.ro?.observe(el);
    measureInto(handle);

    return {
      box: handle.box,
      release: () => {
        const i = this.handles.indexOf(handle);
        if (i >= 0) this.handles.splice(i, 1);
        this.ro?.unobserve(el);
      },
    };
  }

  /** Longest scroll the document currently allows. */
  get maxScroll() {
    if (typeof document === "undefined") return 0;
    return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  }

  remeasure = () => {
    for (const handle of this.handles) measureInto(handle);
    this.onChange?.();
  };

  /**
   * Coalesces a burst of reflows into one measurement. A resize fires dozens
   * of times per drag and every handle would otherwise be re-read each time.
   */
  private scheduleRemeasure = () => {
    if (this.pending) return;
    this.pending = requestAnimationFrame(() => {
      this.pending = 0;
      this.remeasure();
    });
  };

  dispose() {
    if (this.pending) cancelAnimationFrame(this.pending);
    this.ro?.disconnect();
    this.handles = [];
    if (typeof window !== "undefined") {
      window.removeEventListener("resize", this.scheduleRemeasure);
      window.removeEventListener("load", this.scheduleRemeasure);
    }
  }
}

function measureInto(handle: Handle) {
  const rect = handle.el.getBoundingClientRect();
  handle.box.top = rect.top + window.scrollY;
  handle.box.height = rect.height;
}
