import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import StaffLogin from "./pages/StaffLogin";
import PatientLogin from "./pages/PatientLogin";
import Dashboard from "./pages/Dashboard";
import PatientDashboard from "./pages/PatientDashboard";
import Home from "./pages/Home";
import Signup from "./pages/signup";
import Navbar from "./components/Navbar"; // Import Navbar
import "./App.css";

function App() {
  return (
    <Router>
      <Navbar /> {/* Navbar always visible */}
      <Routes>
        <Route path="/" element={<Home />} /> {/* Home with login options */}
        <Route path="/staff-login" element={<StaffLogin />} />
        <Route path="/patient-login" element={<PatientLogin />} />
        <Route path="/dashboard" element={<Dashboard />} /> {/* Staff Dashboard */}
        <Route path="/patient-dashboard/:patientID" element={<PatientDashboard />} /> {/* Patient Dashboard */}
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </Router>
  );
}

export default App;
