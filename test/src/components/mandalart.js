// MandalartCalendar.js
// Usage:
// import MandalartCalendar from "./MandalartCalendar";
// import "./mandalart.css";
// <MandalartCalendar />

import React, { useEffect, useMemo, useState } from "react";

/** Types */
///** @typedef {{center: string, rings: string[], children?: Record<number, MandalGrid>, notes?: string}} MandalGrid */

/** Date utils */
const fmt = (d) => d.toISOString().slice(0, 10);
const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
const addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1);
const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

function monthMatrix(viewDate) {
  const start = startOfMonth(viewDate);
  const end = endOfMonth(viewDate);
  const startDay = (start.getDay() + 6) % 7; // Monday=0
  const cells = [];
  for (let i = 0; i < startDay; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() - (startDay - i));
    cells.push(d);
  }
  for (let i = 1; i <= end.getDate(); i++) {
    const d = new Date(start);
    d.setDate(i);
    cells.push(d);
  }
  while (cells.length % 7 !== 0 || cells.length < 42) {
    const d = new Date(cells[cells.length - 1]);
    d.setDate(d.getDate() + 1);
    cells.push(d);
  }
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** Storage */
function useLocalStorageMap(key, initial) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);
  return [state, setState];
}

/** Normalizers */
function normalizeGrid(grid) {
  const safe = grid || {};
  const rings = Array.isArray(safe.rings) ? safe.rings.slice(0, 8) : [];
  while (rings.length < 8) rings.push("");
  return {
    center: typeof safe.center === "string" ? safe.center : "",
    rings,
    notes: typeof safe.notes === "string" ? safe.notes : "",
    children: typeof safe.children === "object" ? safe.children : undefined,
  };
}
function normalizeMaybeGrid(grid) {
  return grid ? normalizeGrid(grid) : { center: "", rings: Array(8).fill(""), notes: "" };
}

/** Suggestions */
function suggestRingTasks(centerText) {
  const t = (centerText || "").toLowerCase().trim();
  const presets = [
    { match: /study|공부|시험|토익|toeic|토플|toefl|자격|cert|수능|sat|act/, items: ["학습 범위 정의","교재/자료 선정","주간 학습 계획","기출 분석","오답노트 구축","모의고사 일정","피드백 루프","점검/휴식"] },
    { match: /english|영어|회화|스피킹|ielts/, items: ["목표 레벨 정의","단어장 큐레이션","듣기 루틴","말하기 섀도잉","쓰기 템플릿","문법 보완","원어민 피드백","주간 테스트"] },
    { match: /project|프로젝트|런칭|출시|서비스|앱|웹|사이트/, items: ["요구사항 정리","기획서 스케치","UI 와이어프레임","기술 스택 결정","MVP 범위 확정","개발 일정 수립","QA/버그리스트","릴리즈/회고"] },
    { match: /design|디자인|ui|ux|브랜딩|로고|figma/, items: ["레퍼런스 리서치","무드보드 제작","컬러/타이포 가이드","컴포넌트 셋업","핵심 화면 설계","프로토타입","유저 테스트","디자인 시스템"] },
    { match: /exercise|운동|헬스|피트니스|다이어트|diet|몸만들기/, items: ["목표 체중/체지방","식단 계획","유산소 루틴","근력 루틴","자세 교정","주간 측정","회복/스트레칭","치팅/리셋"] },
    { match: /job|취업|이직|resume|이력서|포트폴리오|면접/, items: ["타깃 역할 정의","이력서 업데이트","포트폴리오 보강","링크드인 정비","채용공고 수집","모의 인터뷰","레퍼런스 확보","지원/팔로업"] },
    { match: /sales|영업|마케팅|광고|ad|캠페인/, items: ["시장/페르소나","메시지/포지셔닝","채널 선정","콘텐츠 캘린더","크리에이티브 제작","예산/입찰","성과 지표","리포트/피봇"] },
    { match: /coding|개발|코딩|리팩토링|refactor|테스트/, items: ["기술부채 목록","테스트 커버리지","모듈 분리","성능 프로파일","비동기/에러처리","DX 개선","문서화","코드리뷰 라운드"] },
  ];
  for (const p of presets) if (p.match.test(t)) return p.items;
  return ["목표 정의/스코프","리서치/자료수집","세부 작업 분해","타임라인/마일스톤","필요 자원/협업","리스크/대응책","진척도 점검","회고/개선"];
}
function nextEmptyRingIndex(rings) {
  const len = Array.isArray(rings) ? rings.length : 0;
  for (let i = 0; i < Math.max(8, len); i++) if (!rings[i]) return i;
  return -1;
}

/** Modal */
function Modal({ open, onClose, children, title }) {
  if (!open) return null;
  return (
    <div className="mdr-modal" role="dialog" aria-modal="true">
      <div className="mdr-modal__backdrop" onClick={onClose} />
      <div className="mdr-modal__content" role="document">
        <div className="mdr-modal__header">
          <h3 className="mdr-title-sm">{title}</h3>
          <button className="mdr-icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="mdr-modal__body">{children}</div>
        <div className="mdr-modal__footer">
          <button className="mdr-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

/** 3×3 Grid (equal sized squares, no separate preview box) */
function Grid3x3({ grid, onChange, onOpenChild, readOnly, mirrorCenterToMiddle = true }) {
  const safe = normalizeGrid(grid);
  const setCenter = (v) => onChange({ ...safe, center: v });
  const setRing = (i, v) => {
    const rings = safe.rings.slice();
    rings[i] = v;
    const next = { ...safe, rings };
    // 부모 링 → 자식 center 동기화
    if (safe.children && safe.children[i]) next.children = { ...(safe.children || {}), [i]: { ...safe.children[i], center: v } };
    onChange(next);
  };

  const suggestions = useMemo(() => suggestRingTasks(safe.center), [safe.center]);
  const applySuggestion = (text) => { const idx = nextEmptyRingIndex(safe.rings); if (idx !== -1) setRing(idx, text); };
  const fillAll = () => {
    const rings = safe.rings.slice();
    let j = 0;
    for (let i = 0; i < 8; i++) if (!rings[i] && j < suggestions.length) rings[i] = suggestions[j++];
    onChange({ ...safe, rings });
  };

  const RingCell = ({ i }) => (
    <div className="mdr-cell">
      <textarea
        className="mdr-textarea mdr-textarea--cell"
        value={safe.rings[i] || ""}
        onChange={(e) => setRing(i, e.target.value)}
        placeholder={`Goal ${i + 1}`}
        disabled={!!readOnly}
      />
      {onOpenChild && (
        <button
          className="mdr-icon-btn mdr-cell__expand"
          onClick={(ev) => { ev.stopPropagation(); onOpenChild(i); }}
          title="Open sub-grid"
          aria-label={`Open sub-grid for Goal ${i + 1}`}
        >＋</button>
      )}
    </div>
  );

  return (
    <div className="mdr-editor">
      {/* 핵심과제 입력 + 토글 (미리보기 영역 제거) */}
      <div className="mdr-centerbar">
        <label className="mdr-label">핵심과제</label>
        <input
          className="mdr-input"
          value={safe.center}
          onChange={(e) => setCenter(e.target.value)}
          placeholder="가운데 핵심과제를 입력하세요"
          disabled={!!readOnly}
        />
        <label className="mdr-switch mdr-mt-sm">
          <input
            type="checkbox"
            checked={mirrorCenterToMiddle}
            onChange={() => { /* 표시 토글만 사용: 중앙칸은 아래 grid에서 반영 */ }}
            readOnly
          />
          <span>만다라트 가운데 칸에 반영</span>
        </label>

        {/* 추천 칩 */}
        <div className="mdr-suggests">
          <div className="mdr-suggests__head">
            <span className="mdr-help">추천 세부과제</span>
            <button className="mdr-btn mdr-btn--secondary mdr-btn--xs" onClick={fillAll}>모두 채우기</button>
          </div>
          <div className="mdr-suggests__chips">
            {suggestions.map((s, i) => (
              <button key={i} className="mdr-chip" type="button" onClick={() => applySuggestion(s)}>{s}</button>
            ))}
          </div>
        </div>
      </div>

      {/* 3×3: 9칸 모두 동일 크기 */}
      <div className="mdr-3x3">
        <RingCell i={0} />
        <RingCell i={1} />
        <RingCell i={2} />
        <RingCell i={3} />

        <div className="mdr-cell mdr-cell--center">
          <textarea
            className="mdr-textarea mdr-textarea--cell"
            value={mirrorCenterToMiddle ? (safe.center || "") : ""}
            onChange={(e) => setCenter(e.target.value)}
            placeholder="Center"
            disabled={!!readOnly}
          />
        </div>

        <RingCell i={4} />
        <RingCell i={5} />
        <RingCell i={6} />
        <RingCell i={7} />
      </div>

      {/* Notes */}
      <div className="mdr-field">
        <label className="mdr-label">Notes</label>
        <textarea
          className="mdr-textarea"
          placeholder="추가 메모"
          value={safe.notes || ""}
          onChange={(e) => onChange({ ...safe, notes: e.target.value })}
        />
      </div>
    </div>
  );
}

/** Wrapper with child modal (kept as before) */
function MandalEditor({ value, onChange }) {
  const [active, setActive] = useState(null);

  const ensureChild = (i) => {
    const has = value.children?.[i];
    const nextChild = has || { center: value.rings?.[i] || "", rings: Array(8).fill("") };
    const children = { ...(value.children || {}), [i]: nextChild };
    const merged = { ...value, children };
    onChange(merged);
    return nextChild;
  };

  return (
    <>
      <Grid3x3
        grid={value}
        onChange={onChange}
        onOpenChild={(i) => setActive(i)}
        mirrorCenterToMiddle={true}
      />

      <Modal
        open={active != null}
        onClose={() => setActive(null)}
        title={`세부 만다라트 - Goal ${active != null ? active + 1 : ""}`}
      >
        {active != null && (
          <Grid3x3
            grid={value.children?.[active] || ensureChild(active)}
            onChange={(g) => {
              const prev = value.children?.[active];
              const nextChildren = { ...(value.children || {}), [active]: g };
              let next = { ...value, children: nextChildren };
              // 자식 center → 부모 링
              if ((g.center ?? "") !== (prev?.center ?? "")) {
                const rings = (value.rings || []).slice();
                while (rings.length < 8) rings.push("");
                rings[active] = g.center || "";
                next.rings = rings;
              }
              onChange(next);
            }}
            mirrorCenterToMiddle={true}
          />
        )}
      </Modal>
    </>
  );
}

/** Day planner & Calendar */
function DayPlanner({ open, date, value, onClose, onSave }) {
  const [local, setLocal] = useState(() => normalizeMaybeGrid(value));
  const [showEmpty, setShowEmpty] = useState(!!value);

  useEffect(() => {
    setLocal(normalizeMaybeGrid(value));
    setShowEmpty(!!value);
  }, [value, open]);

  const doSave = () => {
    const has = local && (local.center || (local.rings || []).some(Boolean) || local.notes);
    onSave(has ? local : null);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric", weekday: "short" })}
    >
      <div className="mdr-row mdr-row--between mdr-row--wrap mdr-gap-sm mdr-mb-sm">
        <label className="mdr-switch">
          <input type="checkbox" checked={showEmpty} onChange={(e) => setShowEmpty(e.target.checked)} />
          <span>Generate Mandalart</span>
        </label>
        <button className="mdr-btn mdr-btn--secondary" onClick={() => setLocal({ center: "", rings: Array(8).fill(""), notes: "" })}>Clear</button>
      </div>

      {(showEmpty || (local && (local.center || (local.rings || []).some(Boolean) || local.notes))) && (
        <MandalEditor value={local} onChange={setLocal} />
      )}

      <div className="mdr-modal__footer mdr-mt-sm">
        <button className="mdr-btn mdr-btn--ghost" onClick={onClose}>Close</button>
        <button className="mdr-btn" onClick={doSave}>Save</button>
      </div>
    </Modal>
  );
}

function MonthHeader({ date, onPrev, onNext, onToday, onNew }) {
  return (
    <div className="mdr-toolbar">
      <div className="mdr-row mdr-gap-xs mdr-align-center">
        <div className="mdr-icon">📅</div>
        <h2 className="mdr-title-md">{date.toLocaleDateString(undefined, { year: "numeric", month: "long" })}</h2>
      </div>
      <div className="mdr-row mdr-gap-xs">
        <button className="mdr-icon-btn" onClick={onPrev} aria-label="Previous month">◀</button>
        <button className="mdr-icon-btn" onClick={onNext} aria-label="Next month">▶</button>
        <button className="mdr-btn mdr-btn--secondary" onClick={onToday}>Today</button>
        <button className="mdr-btn" onClick={onNew}>New Mandalart</button>
      </div>
    </div>
  );
}

function DayCell({ date, inMonth, today, hasPlan, onClick }) {
  const classes = [
    "mdr-day",
    inMonth ? "" : "is-out",
    today ? "is-today" : "",
    hasPlan ? "has-plan" : "",
  ].join(" ");

  return (
    <button className={classes} onClick={onClick} aria-label={date.toDateString()}>
      <div className="mdr-day__head">
        <span className="mdr-day__num">{date.getDate()}</span>
      </div>
    </button>
  );
}


export default function MandalartCalendar() {
  const [viewDate, setViewDate] = useState(new Date());
  const [selected, setSelected] = useState(null);
  const [plans, setPlans] = useLocalStorageMap("mandalart-plans:v4", {}); // v4: equal cells + no preview

  const weeks = useMemo(() => monthMatrix(viewDate), [viewDate]);

  const handleSave = (grid) => {
    if (!selected) return;
    const key = fmt(selected);
    setPlans((prev) => {
      const next = { ...prev };
      if (grid) next[key] = grid; else delete next[key];
      return next;
    });
    setSelected(null);
  };

  return (
    <div className="mdr-app">
      <MonthHeader
        date={viewDate}
        onPrev={() => setViewDate((d) => addMonths(d, -1))}
        onNext={() => setViewDate((d) => addMonths(d, 1))}
        onToday={() => setViewDate(new Date())}
        onNew={() => setSelected(new Date())}
      />

      <div className="mdr-card">
        <div className="mdr-weekdays">
          {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => <div key={d} className="mdr-weekday">{d}</div>)}
        </div>
        <div className="mdr-grid">
          {weeks.flat().map((d, idx) => {
            const key = fmt(d);
            const inMonth = d.getMonth() === viewDate.getMonth();
            const today = sameDay(d, new Date());
            const hasPlan = !!plans[key];
            return (
              <DayCell
                key={idx}
                date={d}
                inMonth={inMonth}
                today={today}
                hasPlan={hasPlan}
                onClick={() => setSelected(d)}
              />
            );
          })}
        </div>
      </div>

      <DayPlanner
        open={!!selected}
        date={selected || new Date()}
        value={selected ? plans[fmt(selected)] || null : null}
        onClose={() => setSelected(null)}
        onSave={handleSave}
      />
    </div>
  );
}
