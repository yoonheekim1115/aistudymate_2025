import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./home";
import GoalInput from "./new_mandalart";
import Mandalart from "./mandalart";
import MyMandalart from "./my_mandalart";
import CalendarPage from "./calendar";
import Header from "./header";
import ViewMandalart from "./view_mandalart";

function App() {
  const user = JSON.parse(localStorage.getItem("user"));
  return (
    <Router>
      {/* <Header user={user} /> */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/new_mandalart" element={<GoalInput />} />
        <Route path="/mandalart" element={<Mandalart />} />
        <Route path="/my_mandalart" element={<MyMandalart />} />
        <Route path="/view_mandalart/:id" element={<ViewMandalart />} />
        <Route path="/calendar" element={<CalendarPage />} />
      </Routes>
    </Router>
  );
}

export default App;
