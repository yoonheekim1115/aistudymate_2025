import React from "react";
import { useNavigate } from "react-router-dom";
import "./header.css";


export default function Header() {
  const navigate = useNavigate();
  

  return (
    <header className="top-nav">
      <div className="logo" onClick={() => navigate("/")}>
        Mandarlart–Calendar
      </div>

      <div className="nav-right">
        <button
          className="primary-btn"
          onClick={() => {
            localStorage.removeItem("user");  // 로그아웃 실제 기능
            localStorage.removeItem("calendarEvents");
            window.location.href = "/";       // 홈으로 이동
          }}
        >
          로그아웃
        </button>
        <button 
        className="nav-text-btn" onClick={() => navigate("/my_mandalart")}>
          MY 만다라트
        </button>
        <button className="nav-text-btn" onClick={() => navigate("/calendar")}>
          캘린더  
        </button>
      </div>
    </header>
  );
}
