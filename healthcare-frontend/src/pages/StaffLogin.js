import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Container, Form, Button, Spinner } from "react-bootstrap";
import "../styles/Login.css"; // Import the same CSS file

const StaffLogin = () => {
  const [credentials, setCredentials] = useState({ staffID: "", password: "" });
  const [loggingIn, setLoggingIn] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoggingIn(true);
    try {
      const response = await axios.post(
        "https://back1-production-a3f3.up.railway.app/api/auth/staff/login",
        credentials
      );
      localStorage.setItem("staffToken", response.data.token); // Store token
      alert("Login successful!");
      navigate("/dashboard"); // Redirect to staff dashboard
    } catch (error) {
      alert("Invalid credentials. Please try again.");
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div className="login-wrapper">
      <Container className="container">
        <h2 className="heading">Staff Login (Doctors/Nurses)</h2>
        <Form className="form" onSubmit={handleSubmit}>
          <Form.Group>
            <Form.Label>Staff ID</Form.Label>
            <Form.Control
              className="input"
              type="text"
              name="staffID"
              onChange={handleChange}
              required
              placeholder="Enter your Staff ID"
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Password</Form.Label>
            <Form.Control
              className="input"
              type="password"
              name="password"
              onChange={handleChange}
              required
              placeholder="Enter your password"
            />
          </Form.Group>
          <Button className="login-button" type="submit" disabled={loggingIn}>
            {loggingIn ? <Spinner animation="border" size="sm" /> : "Login"}
          </Button>
        </Form>
      </Container>
    </div>
  );
};

export default StaffLogin;
