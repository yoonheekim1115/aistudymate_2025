import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import Header from "./header";
import "./calendar.css";

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [originalColor, setOriginalColor] = useState(null);

  const updateEventColor = (color) => {
    if (!selectedEvent) return;

    // FullCalendar 내부 객체 색 변경
    selectedEvent.setProp("backgroundColor", color);
    selectedEvent.setProp("borderColor", color);

    // 로컬스토리지 반영
    const stored = JSON.parse(localStorage.getItem("calendarEvents") || "[]");
    const updated = stored.map(ev =>
      ev.title === selectedEvent.title &&
      ev.start === selectedEvent.startStr &&
      ev.end === selectedEvent.endStr
        ? { ...ev, backgroundColor: color, borderColor: color }
        : ev
    );

    localStorage.setItem("calendarEvents", JSON.stringify(updated));

    setColorPickerOpen(false);
  };



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

            eventClick={(info) => {
              setSelectedEvent(info.event);
              setOriginalColor(info.event.backgroundColor); 
              setColorPickerOpen(true);
            }}
          />
          {colorPickerOpen && (
            <div className="color-modal-overlay">
              <div className="color-modal">
                <h4>색상 선택</h4>

                <div className="color-options">
                  <div className="color-box red" onClick={() => updateEventColor("#ff4d4f")} />
                  <div className="color-box blue" onClick={() => updateEventColor("#4f8ef7")} />
                  <div className="color-box green" onClick={() => updateEventColor("#52c41a")} />
                  <div className="color-box yellow" onClick={() => updateEventColor("#f6a54d")} />
                  <div className="color-box purple" onClick={() => updateEventColor("#b54afcff")} />
                  {/* <div className="color-box current" style={{ backgroundColor: originalColor }} onClick={() => updateEventColor(originalColor)}/> */}
                </div>

                <button className="color-close" onClick={() => setColorPickerOpen(false)}>
                  닫기
                </button>
              </div>
            </div>
          )}



          {events.length === 0 && (
              <p className="empty-message">아직 적용된 만다라트가 없습니다.</p>
          )}

        </div>
      </div>
    </div>
  );
}
