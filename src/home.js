import React, { useState } from "react";
import Header from "./header";
import "./home.css";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const savedUser = JSON.parse(localStorage.getItem("user"));
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [user, setUser] = useState(savedUser);
  const navigate = useNavigate();



  const handleLogin = async () => {
    // 🔥 json-api 연동 예시
    const API_BASE = `${window.location.protocol}//${window.location.hostname}:4000`;
    const res = await fetch(`${API_BASE}/users`);
    const users = await res.json();

    const match = users.find(
      (u) => u.id === id && u.password === pw
    );

    if (!match) {
      alert("아이디 또는 비밀번호를 확인해주세요.");
      return;
    }

    localStorage.setItem("user", JSON.stringify(match));
    setUser(match);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  const handleKeyDown = (e) => {
  if (e.key === "Enter") {
    handleLogin();
  }

};


  return (
    <div className="home-container">
      {user && <Header />}

      <main className="main-section">
        <div className="content-box">
          {/* 🔥 로그인 안 된 경우 */}
          {!user && (
            // <h1>Mandarlart–Calendar</h1>
            <div className="login-box">
              <h2>로그인</h2>
              <input
                type="text"
                placeholder="아이디"
                value={id}
                onChange={(e) => setId(e.target.value)}
              />
              <input
                type="password"
                placeholder="비밀번호"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button className="primary-btn" onClick={handleLogin}>
                로그인
              </button>
            </div>
          )}

          {/* 🔥 로그인 된 경우 기존 Home UI */}
          {user && (
            <>
              <p className="subtitle">{user.name}님, 최종 목표를 입력해 주세요</p>
              <h1 className="title">Mandarlart–Calendar</h1>
              <p className="description">어떻게 시작해야 할지 막막한 일잘러를 위한 캘린더</p>

              {/* <div className="button-group">
                <button className="primary-btn">내 만다라트 보기</button>
                <button className="primary-btn">내 캘린더 보기</button>
              </div> */}

              <button
                className="new-mandalart-btn" onClick={() => navigate("/new_mandalart")}>
                새 만다라트 만들기
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
