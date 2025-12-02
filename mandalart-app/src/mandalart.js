import React, { useState, useEffect } from "react";
import Header from "./header";
import { useLocation } from "react-router-dom";
import "./mandalart.css";



export default function Mandalart() {
    // 🔥 모달 상태
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCell, setSelectedCell] = useState(null); 
    const [modalData, setModalData] = useState({
    task: "",
    startDate: "",
    endDate: ""
    });
    const [dateWarning, setDateWarning] = useState("");
    const [activeSub, setActiveSub] = useState(null);   // 어떤 서브가 활성화 되었는지
    const [subCells, setSubCells] = useState(null);     // 서브 3x3 데이터
    const [viewMode, setViewMode] = useState(false);
    const [editingSubCell, setEditingSubCell] = useState(null);
    const [subEditValue, setSubEditValue] = useState("");
    const [subMandalarts, setSubMandalarts] = useState({}); // key: "r-c" -> 3x3 배열
    const [originalSubMandalarts, setOriginalSubMandalarts] = useState({});
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem("user"));
    const [isTitleModalOpen, setIsTitleModalOpen] = useState(false);
    const [titleInput, setTitleInput] = useState("");
    

    useEffect(() => {
      console.log("📌 Mandalart 페이지 로드됨 → 기존 저장된 캘린더 데이터 삭제");
      localStorage.removeItem("mandalartData");
    }, [location.pathname]);



    
    const updateSubCell = (row, col, value) => {
      if (!subCells || !activeSub) return;

      const key = `${activeSub.r}-${activeSub.c}`;

      // 3×3 전체를 깊게 복사하면서 해당 셀만 변경
      const newSubs = subCells.map((rArr, ri) =>
        rArr.map((cell, ci) =>
          ri === row && ci === col ? value : cell
        )
      );

      // 화면에 보이는 서브 만다라트 갱신
      setSubCells(newSubs);

      // 이 서브타스크(r-c 위치)의 만다라트도 함께 저장
      setSubMandalarts(prev => ({
        ...prev,
        [key]: newSubs
      }));
    };




    // const location = useLocation();
    // 날짜 더하기
    const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
    };

    // YYYY-MM-DD 포맷
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    
    // 요일 구하기
    const getDayName = (date) => {
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    return days[date.getDay()];
    };

    const adjustDeadlineToWeekday = (date) => {
    const d = new Date(date);
    const day = d.getDay();

    if (day === 6) d.setDate(d.getDate() - 1);   // 토요일 → 금요일
    if (day === 0) d.setDate(d.getDate() - 2);   // 일요일 → 금요일

    return d;
    };

    const openSubMandalart = async (taskData, cellPos) => {
      if (!taskData || !taskData.task) return;

      const subGoal = taskData.task;
      const subStart = taskData.startDate;
      const subEnd = taskData.endDate;
      const key = `${cellPos.r}-${cellPos.c}`;

      // 🔥 이미 이 셀(r,c)의 서브-서브 만다라트를 만든 적이 있으면 그대로 사용
      if (subMandalarts[key]) {
        setSubCells(subMandalarts[key]);
        setActiveSub({
          ...cellPos,
          task: subGoal,
          startDate: subStart,
          endDate: subEnd
        });
        return;
      }

      // 1. 날짜 정제
      const cleanStart = subStart?.split(" ")[0];
      const cleanEnd = subEnd?.split(" ")[0];

      // 2. API에서 sub-subtask 가져오기
      let suggestions = [];
      try {
        const API_BASE = `${window.location.protocol}//${window.location.hostname}:4000`;
        const res = await fetch(`${API_BASE}/suggestion`);
        const data = await res.json();

        suggestions = data[subGoal] || [];
      } catch (err) {
        console.error("Sub-Mandalart API Error:", err);
      }

      // 없으면 빈 값 8개
      if (!suggestions.length) {
        suggestions = Array(8).fill({
          task: "",
          durationDays: 1
        });
      }

      // 3. 날짜 기반 일정 생성
      let schedules = [];

      if (cleanStart && cleanEnd) {
        schedules = calculateTaskSchedule(cleanEnd, suggestions);
      } else {
        schedules = suggestions.map(s => ({
          task: s.task,
          startDate: "",
          endDate: ""
        }));
      }

      // 4. 3x3 초기 레이아웃 생성
      const base = [
        ["", "", ""],
        ["", "", ""],
        ["", "", ""]
      ];

      let index = 0;
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          if (r === 1 && c === 1) continue;

          base[r][c] = schedules[index] || {
            task: "",
            startDate: "",
            endDate: ""
          };

          index++;
        }
      }

      // 중앙 셀은 현재 subTask 그대로
      base[1][1] = {
        task: subGoal,
        startDate: subStart,
        endDate: subEnd
      };

      // 화면 + 저장
      // 최초 로딩 시에만 원본 저장
      if (!originalSubMandalarts[key]) {
        setOriginalSubMandalarts(prev => ({
          ...prev,
          [key]: base
        }));
      }

      // 화면 + 저장
      setSubCells(base);
      setSubMandalarts(prev => ({
        ...prev,
        [key]: base
      }));


      setActiveSub({
        ...cellPos,
        task: subGoal,
        startDate: subStart,
        endDate: subEnd
      });
    };

    // 클릭되지 않은 서브타스크도 저장할 수 있도록 API에서 즉석 생성
const createNew3x3FromAPI = async (task) => {
  try {
    const res = await fetch("http://10.240.8.236:4000/suggestions");
    const data = await res.json();

    const suggestions = data[task] || [];

    const schedules = suggestions.map(s => ({
      task: s.task,
      startDate: "",
      endDate: ""
    }));

    const base = [
      ["", "", ""],
      ["", "", ""],
      ["", "", ""],
    ];

    let idx = 0;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (r === 1 && c === 1) continue;
        base[r][c] = schedules[idx++] || { task: "", startDate: "", endDate: "" };
      }
    }

    return base;
  } catch (err) {
    console.error("API Error:", err);
    return [
      ["", "", ""],
      ["", "", ""],
      ["", "", ""]
    ];
  }
};


    // key = "0-1" 같은 서브 영역
    const getFinal3x3 = (key) => {
      const original = originalSubMandalarts[key];
      const edited = subMandalarts[key];

      // 원본만 있고 수정본 없는 경우 → 원본 그대로
      if (original && !edited) return original;

      // 수정본만 있고 원본 없는 경우(이론상 없음) → 수정본
      if (!original && edited) return edited;

      // 둘 다 없으면 빈값 리턴 (3x3 모두 empty)
      if (!original && !edited) return [
        ["", "", ""],
        ["", "", ""],
        ["", "", ""]
      ];

      // 원본 + 수정본 모두 있는 경우 → 수정된 셀만 반영
      const result = JSON.parse(JSON.stringify(original));

      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const o = original[r][c];
          const e = edited[r][c];

          // task or date가 다르면 수정된 값으로 교체
          if (
            o.task !== e.task ||
            o.startDate !== e.startDate ||
            o.endDate !== e.endDate
          ) {
            result[r][c] = e;
          }
        }
      }

      return result;
    };

    const getOrCreateFinalBlock = async (r, c) => {
  const key = `${r}-${c}`;
  const original = originalSubMandalarts[key];
  const edited = subMandalarts[key];

  // 이미 클릭한 서브타스크 → 기존 방식 활용
  if (original || edited) {
    return getFinal3x3(key);
  }

  // 클릭하지 않은 서브타스크 → API에서 새로 생성
  const taskData = cells[r][c];

  if (!taskData || !taskData.task) {
    return [
      ["", "", ""],
      ["", "", ""],
      ["", "", ""]
    ];
  }

  const newBlock = await createNew3x3FromAPI(taskData.task);
  return newBlock;
};







  const goal = location.state?.goal || "";
  const deadline = location.state?.deadline || "";

  const calculateDDay = (deadline) => {
    const now = new Date();
    const target = new Date(deadline);
    const diffTime = target - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const dday = deadline ? calculateDDay(deadline) : null;

  // 🔥 휴일(주말) 제외한 작업일 계산
const countWorkingDays = (start, end) => {
  let date = new Date(start);
  let count = 0;

  while (date <= end) {
    const day = date.getDay();
    if (day !== 0 && day !== 6) {
      count++;
    }
    date.setDate(date.getDate() + 1);
  }

  return count;
};

// 🔥 주말 제외하고 n일 뒤 날짜 구하기
const addWorkingDays = (date, days) => {
  let result = new Date(date);

  while (days > 0) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();

    // 주말 skip (0=일, 6=토)
    if (day !== 0 && day !== 6) {
      days--;
    }
  }

  return result;
};

const formatFullDate = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const day = days[date.getDay()];
  return `${dateStr} (${day})`;
};



    // ⭐ durationDays 기반 일정 계산 함수
    const calculateTaskSchedule = (deadline, tasks) => {
    if (!deadline || !tasks.length) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 🔥 deadline이 주말이면 금요일로 보정
    const adjustedEnd = adjustDeadlineToWeekday(deadline);
    adjustedEnd.setHours(0, 0, 0, 0);

    // 🔥 실제 작업 가능일수 계산 (주말 제외)
    const totalWorkingDays = countWorkingDays(today, adjustedEnd);


    // 🔥 2. 전체 durationDays 비율 계산
    const totalRatio = tasks.reduce((acc, t) => acc + t.durationDays, 0);

    let currentStart = new Date(today);
    const schedules = [];

    tasks.forEach((task, idx) => {
    let taskDays = Math.max(
      Math.round((task.durationDays / totalRatio) * totalWorkingDays),
      1
    );

    const start = new Date(currentStart);
    let finish = addWorkingDays(start, taskDays - 1);

    // ⭐ 마지막 Task는 adjustedEnd 날짜에 강제 맞추기
    if (idx === tasks.length - 1) {
      finish = new Date(adjustedEnd);
    }

    schedules.push({
      task: task.task,
      startDate: `${formatDate(start)} (${getDayName(start)})`,
      endDate: `${formatDate(finish)} (${getDayName(finish)})`,
    });

    // 다음 작업일로 이동
    currentStart = addWorkingDays(finish, 1);
});


    return schedules;
    };

    const handleSaveMandalart = async () => {
  if (!titleInput.trim()) {
    alert("제목을 입력해주세요!");
    return;
  }

  cells[1][1] = {
    task: goal,
    startDate: null,
    endDate: deadline ? deadline : null
  };

  const finalData = {};

  const positions = [
    [0,0], [0,1], [0,2],
    [1,0],        [1,2],
    [2,0], [2,1], [2,2]
  ];

  // 각 서브타스크 처리
  for (const [r, c] of positions) {
    finalData[`${r}-${c}`] = await getOrCreateFinalBlock(r, c);
  }

  // 중앙 저장
  finalData.center = cells;

  // API 저장용 데이터
  const savePayload = {
    id: Date.now().toString(),
    userId: user?.id || null,
    createdAt: new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }),
    title: titleInput, 
    data: finalData
  };

  try {
    const res = await fetch("http://10.240.8.236:4000/mandalart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(savePayload),
    });

    if (!res.ok) {
      throw new Error("서버 오류 발생");
    }

    alert("만다라트가 성공적으로 저장되었습니다!");
    setIsTitleModalOpen(false);

  } catch (err) {
    console.error(err);
    alert("저장 오류: " + err.message);
  }
};





  // 8개 셀 + 중앙은 별도로 렌더링
  const [cells, setCells] = useState([
    ["", "", ""],
    ["", "", ""],
    ["", "", ""]
  ]);

  const updateCell = (row, col, value) => {
  const newCells = [...cells];
  newCells[row][col] = value;
  setCells(newCells);
};

// 셀 클릭 시 모달을 열고 날짜를 input용으로 정제하는 함수
const openModal = (taskData, cellPos) => {
  setSelectedCell(cellPos);

  // "YYYY-MM-DD (요일)" → "YYYY-MM-DD"
  const cleanStart = taskData.startDate?.split(" ")[0] || "";
  const cleanEnd = taskData.endDate?.split(" ")[0] || "";

  setModalData({
    task: taskData.task,
    startDateRaw: cleanStart,
    endDateRaw: cleanEnd
  });

  setIsModalOpen(true);
};



  // 🔥 (1) 메인 목표 키워드 매칭
  const goalKeywords = {
  "데이터분석": ["데이터", "분석", "eda", "통계", "모델", "머신러닝","시각화", "대시보드", "피처", "인사이트"],
  "AI서비스기획": ["ai", "서비스", "기획", "ux", "프로덕트","와이어프레임", "벤치마킹", "페르소나", "로드맵"],
  "프론트엔드개발학습": ["프론트엔드", "frontend", "html", "css", "자바스크립트","javascript", "react", "비동기", "api", "웹개발"],
  "UXUI디자인학습": ["ux", "ui", "디자인", "피그마", "figma","와이어프레임", "프로토타입", "사용자경험", "퍼소나", "리서치"],
  "파이썬기초학습": ["파이썬", "python", "코딩", "조건문", "반복문","자료구조", "pandas", "numpy", "입문", "기초"],
  "데이터엔지니어링준비": ["데이터엔지니어링", "etl", "데이터파이프라인", "airflow","spark", "sql", "클라우드", "aws", "gcp", "linux"],
  "프로덕트매니저취업준비": ["pm", "프로덕트매니저", "기획", "prd", "지표", "시장조사", "가설검증", "실험설계", "포트폴리오", "서비스기획"],
  "디지털마케팅기초학습": ["디지털마케팅", "마케팅", "seo", "콘텐츠", "sns","cvr", "ctr", "채널분석", "광고", "유입"],
  "퍼포먼스마케팅학습": ["퍼포먼스마케팅", "performance", "광고", "ga", "gsc","페이스북광고", "타겟팅", "세그먼트", "roas", "캠페인"],
  "콘텐츠마케팅기획": ["콘텐츠", "content", "페르소나", "타깃", "기획","카피라이팅", "캘린더", "아이디어", "플랫폼", "브랜딩"],
  "SNS브랜드마케팅": ["sns", "브랜딩", "인스타그램", "숏폼", "릴스", "스토리", "피드", "알고리즘", "인플루언서", "참여율"],
  "마케팅전략기획": ["전략기획", "stp", "4p", "4c", "시장조사","여정지도", "kpi", "캠페인전략", "고객분석", "포지셔닝"]
};


  const findClosestMainGoal = (userGoal) => {
    const lowerGoal = userGoal.toLowerCase();
    let bestMatch = null;
    let bestScore = 0;

    for (const mainGoal in goalKeywords) {
      const keywords = goalKeywords[mainGoal];
      const score = keywords.reduce((acc, kw) => {
        return lowerGoal.includes(kw.toLowerCase()) ? acc + 1 : acc;
      }, 0);

      if (score > bestScore) {
        bestScore = score;
        bestMatch = mainGoal;
      }
    }
    return bestMatch;
  };

  // 🔥 (2) mock 데이터에서 서브태스크 불러오기
  useEffect(() => {
    if (!goal) return;

    const mainGoal = findClosestMainGoal(goal);

    if (!mainGoal) {
      console.warn("유사한 메인 목표를 찾지 못했습니다.");
      return;
    }

    fetch("http://10.240.8.236:4000/suggestions")
      .then((res) => res.json())
      .then((data) => {
        const suggestions = data[mainGoal];

        if (!suggestions) {
          console.warn("해당 목표의 추천 데이터가 없습니다:", mainGoal);
          return;
        }

        // 🔥 (3) 8칸에 자동 채우기
        const schedules = calculateTaskSchedule(deadline, suggestions);

        const updated = [...cells];
        let index = 0;

        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            if (r === 1 && c === 1) continue;

            updated[r][c] = schedules[index] || {
              task: "",
              startDate: "",
              endDate: ""
            };

            index++;
          }
        }

        setCells(updated);

      })
      .catch((err) => console.error("API Error:", err));
  }, [goal]);


  return (
    <div className="mandalart-container">
      <Header />

    <div className="top-right-actions">
      <button
        className="complete-btn"
        onClick={() => {
          setIsTitleModalOpen(true);   // 저장 대신 제목 입력 모달 열기
        }}
      >
        저장
      </button>

     

    </div>


      <main className="mandalart-main">
        <div className={`mandalart-grid main-grid ${activeSub ? "minimized" : ""}`}>
          {cells.map((row, r) =>
            row.map((value, c) => {
              if (r === 1 && c === 1) {
                return (
                  <div key="center" className="mandalart-center-cell">
                    <p className="center-goal">{goal}</p>
                    {deadline && (
                      <>
                        <p className="center-deadline">{deadline}</p>
                        <p className="center-dday">
                          {dday > 0
                            ? `D-${dday}`
                            : dday === 0
                            ? "D-DAY"
                            : `D+${Math.abs(dday)}`}
                        </p>
                      </>
                    )}
                  </div>
                );
              }

              return (
                <div 
                key={`${r}-${c}`} 
                className={`mandalart-cell ${
                  activeSub && activeSub.r === r && activeSub.c === c ? "active-cell" : ""
                }`}
                >
                    <p className="cell-task">{value.task}</p>
                    <p className="cell-date">
                    {value.startDate && value.endDate
                        ? `${value.startDate} ~ ${value.endDate}`
                        : ""}
                    </p>
                    <div className="button-row">
                      <button title="편집하기"
                        className="edit-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal(value, { r, c });
                        }}
                      >
                        ✎
                      </button>

                      <button
                      title="이 목표에 대한 서브 목표 생성하기"
                        className="sub-mandalart-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          openSubMandalart(value, { r, c });
                        }}
                      >
                        ☷
                      </button>
                    </div>
                </div>
              );
            })
          )}
        </div>


        {/* 🔥 서브 만다라트 영역 */}
        {activeSub && subCells && (
          <section className="sub-mandalart-section">
            <div className="sub-mandalart-header">
              <h2 className="sub-mandalart-title">
                {activeSub.task}
              </h2>
              <button
                className="back-btn"
                onClick={() => {
                  setActiveSub(null);
                  setSubCells(null);
                }}
              >
                메인으로 돌아가기
              </button>
            </div>

            <div className="sub-mandalart-grid sub-grid">
              {subCells.map((row, r) =>
                row.map((cell, c) => {
                  if (r === 1 && c === 1) {
                    return (
                      <div key={`sub-center`} className="mandalart-center-cell">
                        <p className="center-goal">{cell.task}</p>
                        <p className="cell-date">
                          {cell.startDate} ~ {cell.endDate}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div key={`sub-${r}-${c}`} className="mandalart-cell">
                      
                      {/* 편집 모드 */}
                      {editingSubCell && editingSubCell.r === r && editingSubCell.c === c ? (
                        <>
                          <input
                            className="cell-task-input"
                            value={subEditValue}
                            onChange={(e) => setSubEditValue(e.target.value)}
                          />

                          <div className="button-row" style={{ marginTop: "8px" }}>
                            <button
                              className="save-btn"
                              onClick={() => {
                                updateSubCell(r, c, {
                                  ...cell,
                                  task: subEditValue
                                });

                                setEditingSubCell(null);
                              }}
                            >
                              저장
                            </button>

                            <button
                              className="cancel-btn"
                              onClick={() => setEditingSubCell(null)}
                            >
                              취소
                            </button>
                          </div>
                        </>
                      ) : (
                        /* 기본 모드 */
                        <>
                          <p className="cell-task">{cell.task || ""}</p>

                          <div className="button-row">
                            <button
                              className="edit-btn"
                              onClick={() => {
                                setEditingSubCell({ r, c });
                                setSubEditValue(cell.task || "");
                              }}
                            >
                              ✎
                            </button>
                          </div>
                        </>
                      )}

                    </div>
                  );


                })
              )}
            </div>
          </section>
        )}



        


      </main>

      {isModalOpen && (
  <div className="modal-overlay">
    <div className="modal">
      <h3>Sub Task 수정</h3>

      <label>Task명</label>
      <input 
        type="text"
        value={modalData.task}
        onChange={(e) => setModalData({...modalData, task: e.target.value })}
      />

      <label>시작 날짜</label>
        <input 
        type="date"
        value={modalData.startDateRaw}
        onChange={(e) => {
            const newStart = e.target.value;
            let newEnd = modalData.endDateRaw;

            // ❗ 시작일이 종료일보다 크면 종료일을 시작일로 보정
            if (newEnd && newStart > newEnd) {
                setDateWarning("⚠️ 시작 날짜는 종료 날짜보다 늦을 수 없습니다.");
                newEnd = newStart;
            } else {
                setDateWarning(""); // 정상 입력이면 경고 제거
            }

            setModalData({
            ...modalData,
            startDateRaw: newStart,
            endDateRaw: newEnd
            });
        }}
        />


        <label>종료 날짜</label>
        <input 
        type="date"
        value={modalData.endDateRaw}
        onChange={(e) => {
            const newEnd = e.target.value;
            let newStart = modalData.startDateRaw;

            // ❗ 종료일이 시작일보다 앞이면 시작일을 종료일로 보정
            if (newStart && newEnd < newStart) {
                setDateWarning("⚠️ 종료 날짜는 시작 날짜보다 빠를 수 없습니다.");
                newStart = newEnd;
            } else {
                setDateWarning("");
            }

            setModalData({
            ...modalData,
            startDateRaw: newStart,
            endDateRaw: newEnd
            });
        }}
        />



      <div className="modal-buttons">
        <button 
          className="save-btn"
          onClick={() => {
            const { r, c } = selectedCell;
            const prev = cells[r][c];

            // 날짜 raw → 요일 포함 full date로 변환
            const formatWithDay = (raw) => {
              if (!raw) return null;

              // raw = "YYYY-MM-DD"
              const [year, month, day] = raw.split("-").map(Number);

              // KST 기준 날짜 생성 (UTC 파싱 방지)
              const date = new Date(year, month - 1, day);

              const days = ["일", "월", "화", "수", "목", "금", "토"];
              const dayName = days[date.getDay()];

              return `${raw} (${dayName})`;
            };


            const updated = {
              task:
                modalData.task !== undefined ? modalData.task : prev.task,

              startDate:
                modalData.startDateRaw
                  ? formatWithDay(modalData.startDateRaw)
                  : prev.startDate,

              endDate:
                modalData.endDateRaw
                  ? formatWithDay(modalData.endDateRaw)
                  : prev.endDate
            };

            updateCell(r, c, updated);
            setIsModalOpen(false);
          }}
        >
          저장
        </button>



        <button 
        className="cancel-btn"
        onClick={() => setIsModalOpen(false)}>
            취소
        </button>
      </div>

      {dateWarning && (
    <p style={{
        color: "#ff4d4f",
        marginTop: "8px",
        fontSize: "13px",
        fontWeight: "600"
    }}>
        {dateWarning}
    </p>
    )}



    </div>
  </div>
)}


{isTitleModalOpen && (
  <div className="modal-overlay">
    <div className="modal">

      <h3>만다라트 제목 설정</h3>

      <input
        type="text"
        className="title-input"
        placeholder="제목을 입력하세요"
        value={titleInput}
        onChange={(e) => setTitleInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSaveMandalart();
        }}
      />

      <div className="modal-buttons">
        <button
          className="save-btn"
          onClick={handleSaveMandalart}
        >
          저장
        </button>

        <button
          className="cancel-btn"
          onClick={() => setIsTitleModalOpen(false)}
        >
          취소
        </button>
      </div>

    </div>
  </div>
)}

    </div>
  );
}
