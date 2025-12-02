import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./header";
import "./my_mandalart.css";

export default function MyMandalart() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  
  const [list, setList] = useState([]);

  const getTaskColor = (taskName) => {
  if (!taskName) return "#6e8efb";

  const key = taskName.toLowerCase();

  if (key.includes("리서치") || key.includes("벤치마킹")) return "#4f8ef7";
  if (key.includes("정의") || key.includes("설계")) return "#8a6ded";
  if (key.includes("와이어프레임") || key.includes("ux") || key.includes("ui")) return "#2ac1bc";
  if (key.includes("문제") || key.includes("정리")) return "#f6a54d";
  if (key.includes("ai") || key.includes("모델")) return "#52c41a";

  return "#6e8efb";
};


const applyToCalendar = (mandalart) => {
  if (!mandalart || !mandalart.data || !mandalart.data.center) {
    alert("만다라트 데이터가 올바르지 않습니다.");
    return;
  }

  const center = mandalart.data.center;

  // 캘린더에 적용할 대상 → 메인 3×3 중 중앙을 제외한 8개
  const positions = [
    [0,0],[0,1],[0,2],
    [1,0],      [1,2],
    [2,0],[2,1],[2,2],
  ];

  const newEvents = [];

  positions.forEach(([r, c]) => {
    const cell = center[r][c];

    if (!cell || !cell.task) return;
    if (!cell.startDate || !cell.endDate) return;

    // "2025-01-01 (월)" → "2025-01-01"
    const start = cell.startDate.split(" ")[0];
    const end = cell.endDate.split(" ")[0];

    newEvents.push({
      title: cell.task,
      start,
      end,
      mandalartId: mandalart.id, // 어떤 만다라트에서 왔는지 구분 가능
      backgroundColor: getTaskColor(cell.task),
      borderColor: getTaskColor(cell.task),
    });
  });

  // 기존 이벤트 불러오기
  const stored = JSON.parse(localStorage.getItem("calendarEvents") || "[]");

  // 병합
  const merged = [...stored, ...newEvents];

  // 저장
  localStorage.setItem("calendarEvents", JSON.stringify(merged));

  alert("캘린더에 적용되었습니다!");
};



  useEffect(() => {
    async function load() {
      const API_BASE = `${window.location.protocol}//${window.location.hostname}:4000`;
      const res = await fetch(`${API_BASE}/mandalart?userId=${user.id}`);
      const data = await res.json();
      const filtered = data.filter(item => item.userId === user.id);
      setList(filtered);
    }
    load();
  }, []);

  return (
    <div className="mandalart-container">
      <Header />

        <div className="title-area">
            <h2> 
                <span className="highlight-name">{user.name}</span>님의 만다라트
            </h2>
        </div>
      

      {list.length === 0 ? (
        <div className="empty-area">
        {/* <h2>{user.name}님의 만다라트</h2> */}
          <p>아직 만든 만다라트가 없습니다.</p>
          <button onClick={() => navigate("/new_mandalart")}>새 만다라트 만들기</button>
        </div>
      ) : (
        <div className="table-wrapper">
            {/* <h2>{user.name}님의 만다라트</h2> */}
          <table className="mandalart-table">
            <thead>
              <tr>
                <th>No</th>
                <th>제목</th>
                <th>생성일</th>
                <th>보기</th>
                <th>캘린더 적용</th>
              </tr>
            </thead>

            <tbody>
              {list.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>

                  {/* 제목 = 메인 목표 중앙 셀 */}
                  <td>
                    {item.title || "제목 없음"}
                  </td>

                  <td>{item.createdAt}</td>

                  <td>
                    <button 
                      className="view-btn"
                      onClick={() => navigate(`/view_mandalart/${item.id}`)}
                    >
                      열기 →
                    </button>
                  </td>

                  <td>
                    <button 
                      className="view-btn"
                      onClick={() => {
                      applyToCalendar(item);
                      navigate("/calendar");
                      }}
                    >
                      적용 →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
