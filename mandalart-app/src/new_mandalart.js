import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./header";
import "./new_mandalart.css";

export default function GoalInput() {
  const [goal, setGoal] = useState("");
  const [showDeadline, setShowDeadline] = useState(false);
  const [deadline, setDeadline] = useState("");
  const [minDeadline, setMinDeadline] = useState(""); // 🔥 선택 가능한 최소 마감일
  const [requiredDays, setRequiredDays] = useState(null); // 🔥 최소 소요일

  const navigate = useNavigate();

  // 날짜 포맷
  const formatDate = (date) => date.toISOString().split("T")[0];

  // 주말 제외한 작업일 계산
  const addWorkingDays = (start, days) => {
    let result = new Date(start);
    while (days > 0) {
      result.setDate(result.getDate() + 1);
      const day = result.getDay();
      if (day !== 0 && day !== 6) days--;
    }
    return result;
  };

  // 목표 입력 후 Enter → 최소 작업일 계산 & deadline 입력창 표시
  const handleGoalEnter = async (e) => {
    if (e.key !== "Enter" || goal.trim() === "") return;

    // 1. mock API 불러오기
    const API_BASE = `${window.location.protocol}//${window.location.hostname}:4000`;
    const res = await fetch(`${API_BASE}/suggestions`);
    const data = await res.json();

    // 2. 목표 키워드 기반 매칭
    const goalKeywords = {
      "데이터분석": ["데이터", "분석", "EDA", "모델", "머신러닝", "통계"],
      "AI서비스기획": ["AI", "서비스", "기획", "UX", "AI서비스", "프로덕트"]
    };

    const lowerGoal = goal.toLowerCase();
    let bestMatch = null;
    let bestScore = 0;

    for (const mainGoal in goalKeywords) {
      const keywords = goalKeywords[mainGoal];
      const score = keywords.reduce(
        (acc, kw) => (lowerGoal.includes(kw.toLowerCase()) ? acc + 1 : acc),
        0
      );
      if (score > bestScore) {
        bestMatch = mainGoal;
        bestScore = score;
      }
    }

    if (!bestMatch) return alert("해당 목표에 맞는 서브 태스크를 찾지 못했습니다.");

    // 3. 최소 필요 작업일 계산 (durationDays 총합)
    const tasks = data[bestMatch];
    const totalDays = tasks.reduce((acc, t) => acc + t.durationDays, 0);

    // 4. 오늘 기준 최소 선택 가능 날짜 계산 (주말 제외)
    const today = new Date();
    const minDate = addWorkingDays(today, totalDays);

    // 상태 업데이트
    setRequiredDays(totalDays);
    setMinDeadline(formatDate(minDate));
    setShowDeadline(true);
  };

  const handleNext = () => {
    if (!deadline.trim()) return;
    navigate("/mandalart", { state: { goal, deadline } });
  };

  return (
    <div className="goal-container">
      <Header />

      <main className="goal-main">
        <h1 className="goal-title">최종 목표를 입력하세요.</h1>
        <div className = "goal-input-wrapper">
          <input
            type="text"
            className="goal-input-bar"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="최종 목표를 입력해주세요"
            onKeyDown={handleGoalEnter}
          />

          <button 
          className="goal-submit-btn" 
           onClick={() => handleGoalEnter({ key: "Enter" })}
          >
            ↩
          </button>
        </div>

        {/* 🔥 최소 필요 작업일 표시 */}
        {requiredDays && (
          <p className="goal-description">
            💡 해당 목표는 최소 <b>{requiredDays}일</b>이 필요합니다.
          </p>
        )}

        {/* 🔥 deadline 입력 섹션 */}
        {showDeadline && (
          <div className="deadline-section fade-in">
            <h2 className="deadline-title">마감 일자는 언제인가요?</h2>

            <input
              type="date"
              className="deadline-input"
              value={deadline}
              // min={minDeadline}      
              onChange={(e) => setDeadline(e.target.value)}
            />

            <button className="primary-btn next-btn" onClick={handleNext}>
              다음
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
