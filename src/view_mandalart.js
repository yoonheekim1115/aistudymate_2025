import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "./header";
import "./view_mandalart.css";
import { useNavigate } from "react-router-dom";


export default function ViewMandalart() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [activeSub, setActiveSub] = useState(null); // 클릭한 서브타스크 위치
  const [subCells, setSubCells] = useState(null);
  const navigate = useNavigate();

  // ⭐ 모든 블록의 중앙 칸을 자동 보정해주는 함수
const normalizeBlocks = (data) => {
  const positions = [
    "0-0","0-1","0-2",
    "1-0",      "1-2",
    "2-0","2-1","2-2"
  ];

  positions.forEach(pos => {
    let block = data[pos];
    let main = data.center;

    if (!block) return;

    const [r, c] = pos.split("-").map(Number);

    // 메인 3x3의 해당 셀(Task 정보)
    const mainTask = main[r][c];

    // 블록 중앙 셀이 없으면 보정
    if (!block[1][1] || !block[1][1].task) {
      block[1][1] = {
        task: mainTask.task || "",
        startDate: mainTask.startDate || "",
        endDate: mainTask.endDate || ""
      };
    }
  });

  return data;
};



  useEffect(() => {
    async function load() {
      try {
        const API_BASE = `${window.location.protocol}//${window.location.hostname}:4000`;
        const res = await fetch(`${API_BASE}/mandalart?id=${id}`);
        const json = await res.json();
        const normalized = normalizeBlocks(json[0].data); 
        setData({ ...json[0], data: normalized });
      } catch (err) {
        console.error("조회 실패:", err);
      }
    }
    load();
  }, [id]);

  if (!data) return <div>Loading...</div>;

  console.log("api data: ", data);

  // 3×3 블록 9개를 9×9로 합치는 함수
  const buildNineByNine = (data) => {
    const big = Array.from({ length: 9 }, () => Array(9).fill(null));

    const order = [
      ["0-0", "0-1", "0-2"],
      ["1-0", "center", "1-2"],
      ["2-0", "2-1", "2-2"]
    ];

    for (let br = 0; br < 3; br++) {
      for (let bc = 0; bc < 3; bc++) {
        const key = order[br][bc];
        const block = data[key]; // 3×3 블록 (center 포함)

        if (!block) continue;

        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            big[br * 3 + r][bc * 3 + c] = block[r][c];
          }
        }
      }
    }

    return big;
  };

 const full9x9 = buildNineByNine(data.data);

 const colorMap = {
  centerMain: "#6f82ffb4", 
  subMain: "#e9efff", 
  blockCenter: "#e9efff",
  default: "#ffffff" 
};


const getMainCellColor = (r, c) => {
  const blockR = Math.floor(r / 3);
  const blockC = Math.floor(c / 3);
  const cellR = r % 3;
  const cellC = c % 3;

  // 중앙 큰 블록(메인 목표 구역)
  if (blockR === 1 && blockC === 1) {
    // 중앙 셀
    if (cellR === 1 && cellC === 1) return colorMap.centerMain;
    // 주변 8칸
    return colorMap.subMain;
  }

  // 주변 서브 블록의 중앙만 색준다
  if (cellR === 1 && cellC === 1) {
    return colorMap.blockCenter;
  }

  return colorMap.default;
};






  return (
    <div className="mandalart-container">
      <Header />

      <main className="mandalart-main">
        {/* <h2>{data.title}</h2> */}

        {/* ⭐ 9×9 전체 만다라트 렌더링 */}
        <div className="mandalart-grid-9x9">
          {full9x9.map((row, r) =>
            row.map((cell, c) => (
          <div 
            key={`${r}-${c}`} 
            className={`
              view-mandalart-cell
              ${(r % 3 === 0 && r !== 0) ? "bold-top" : ""}
              ${(r % 3 === 2 && r !== 8) ? "bold-bottom" : ""}
              ${(c % 3 === 0 && c !== 0) ? "bold-left" : ""}
              ${(c % 3 === 2 && c !== 8) ? "bold-right" : ""}
              ${activeSub && activeSub.r === r && activeSub.c === c ? "active-cell" : ""}
            `}
            style={{ backgroundColor: getMainCellColor(r, c) }}
          >
                <p className="cell-task">{cell?.task || ""}</p>
                <p className="cell-date">
                  {cell?.startDate && cell?.endDate
                    ? `${cell.startDate} ~ ${cell.endDate}`
                    : ""}
                </p>

              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
