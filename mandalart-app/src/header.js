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
        className="nav-text-btn" onClick={() => navigate("/my_mandalart")}>
          MY만다라트
        </button>
        <button className="nav-text-btn" onClick={() => navigate("/calendar")}>
          캘린더
        </button>
        <button
          className="primary-btn" onClick={() => navigate("/new_mandalart")}>
          새 만다라트 만들기
        </button>
      </div>
    </header>
  );
}
