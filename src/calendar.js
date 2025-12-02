import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import Header from "./header";
import "./calendar.css";

export default function CalendarPage() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    // 🔥 MyMandalart에서 저장한 모든 이벤트를 불러오기
    const storedEvents = JSON.parse(localStorage.getItem("calendarEvents") || "[]");

    setEvents(storedEvents);
  }, []);

  return (
    <div className="calendar-page-container">
      <Header />

      <div className="calendar-container">
        <div className="calendar-wrapper">
          <FullCalendar
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            events={events} // 🔥 저장된 이벤트 그 자체
            displayEventEnd={true}
            height="650px"

            headerToolbar={{
              left: "title", 
              center: "",
              right: "reset today prev next",
            }}

            customButtons={{
              reset: {
                text: "reset calendar",
                click: () => {
                  if (window.confirm("캘린더를 초기화하시겠습니까?")) {
                    
                    // 🔥 전체 캘린더 이벤트 초기화
                    localStorage.removeItem("calendarEvents");

                    setEvents([]);
                    alert("캘린더가 초기화되었습니다.");
                  }
                }
              }
            }}
          />

          {events.length === 0 && (
              <p className="empty-message">아직 적용된 만다라트가 없습니다.</p>
          )}

        </div>
      </div>
    </div>
  );
}
