import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "./header";
import "./mandalart.css";
import { useNavigate } from "react-router-dom";


export default function ViewMandalart() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [activeSub, setActiveSub] = useState(null); // 클릭한 서브타스크 위치
  const [subCells, setSubCells] = useState(null);
  const navigate = useNavigate();


  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`http://10.240.8.236:4000/mandalart?id=${id}`);
        const json = await res.json();
        setData(json[0]);
      } catch (err) {
        console.error("조회 실패:", err);
      }
    }
    load();
  }, [id]);

  if (!data) return <div>Loading...</div>;

  console.log("api data: ", data);

  const center = data.data.center;
  const positions = [
    [0,0],[0,1],[0,2],
    [1,0],      [1,2],
    [2,0],[2,1],[2,2]
  ];
  
  const centerCell = data.data.center[1][1];

  const openSub = (r, c) => {
  const key = `${r}-${c}`;
  let block = data.data[key];

  if (!block) return;

  // 🔥 메인 3x3에서 클릭한 셀(서브 목표)을 가져옴
  const mainTask = data.data.center[r][c];

  // 🔥 서브 3×3 중앙칸에 서브 목표가 없으면 강제로 채움
  if (!block[1][1] || !block[1][1].task) {
    // 깊은 복사해서 block 수정
    block = block.map(row => row.map(cell => ({ ...cell })));

    block[1][1] = {
      task: mainTask.task || "",
      startDate: mainTask.startDate || "",
      endDate: mainTask.endDate || ""
    };
  }

  setActiveSub({
    r,
    c,
    title: block[1][1].task || ""
  });

  setSubCells(block);
};


  return (
    <div className="mandalart-container">
      <Header />

    <div className="top-right-actions">
      <button 
        className="back-list-btn"
        onClick={() => navigate("/my_mandalart")}
      >
        목록으로 돌아가기
      </button>
    </div>


      {/* 타이틀 */}
      <div style={{ width: "100%", textAlign: "center", marginTop: "20px" }}>
        {/* <h2 style={{ fontWeight: 700 }}>
          {data.title || "제목 없음"} 
          <span style={{ fontSize: "14px", color: "#8592a5", marginLeft: "8px" }}>
            만다르트 생성일자: {data.createdAt}
          </span>
        </h2> */}
      </div>

      <main className="mandalart-main">
        {/* ---- 메인 3x3 ---- */}
        <div className={`mandalart-grid main-grid ${activeSub ? "minimized" : ""}`}>
          {center.map((row, r) =>
            row.map((cell, c) => {
              // 중앙 목표
              if (r === 1 && c === 1) {
                return (
                  <div key="center" className="mandalart-center-cell">
                    <p className="center-goal">{cell.task}</p>
                    <p className="center-date">{cell.startDate} ~ {cell.endDate}</p>
                  </div>
                );
              }

              // 일반 셀
              const mainTask = cell;

              return (
                <div
                key={`${r}-${c}`}
                className={`mandalart-cell ${
                    activeSub && activeSub.r === r && activeSub.c === c ? "active-cell" : ""
                }`}
                onClick={() => openSub(r, c)}
                >

                  <p className="cell-task">{mainTask.task}</p>
                  <p className="cell-date">
                    {mainTask.startDate && mainTask.endDate
                      ? `${mainTask.startDate} ~ ${mainTask.endDate}`
                      : ""}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* ---- 서브 3x3 ---- */}
        {activeSub && subCells && (
          <section className="sub-mandalart-section">
            <div className="sub-mandalart-header">
              <h2 className="sub-mandalart-title">{activeSub.title}</h2>

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
                // 중앙 셀
                if (r === 1 && c === 1) {
                    return (
                    <div key={`center-${r}-${c}`} className="mandalart-center-cell">
                        <p className="center-goal">{cell?.task || ""}</p>
                        <p className="cell-date">
                        {cell?.startDate && cell?.endDate
                            ? `${cell.startDate} ~ ${cell.endDate}`
                            : ""}
                        </p>
                    </div>
                    );
                }

                // 일반 셀
                return (
                    <div key={`sub-${r}-${c}`} className="mandalart-cell">
                    <p className="cell-task">{cell?.task || ""}</p>
                    <p className="cell-date">
                        {cell?.startDate && cell?.endDate
                        ? `${cell.startDate} ~ ${cell.endDate}`
                        : ""}
                    </p>
                    </div>
                );
                })
            )}
            </div>

          </section>
        )}

      </main>
    </div>
  );
}
