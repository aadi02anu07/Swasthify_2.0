import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Container, Form, Button, Alert, Spinner } from "react-bootstrap";
import "../styles/Login.css"; // Import your CSS file

const PatientLogin = () => {
  const [credentials, setCredentials] = useState({ patientID: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await axios.post(
        "https://back1-production-a3f3.up.railway.app/api/auth/patient/login",
        credentials
      );

      if (response.status === 200) {
        alert("Login successful!");
        localStorage.setItem("token", response.data.token); // Store token for authentication
        navigate(`/patient-dashboard/${credentials.patientID}`);
      } else {
        setErrorMessage("Invalid credentials. Please try again.");
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper"> {/* Centers the login box */}
      <Container className="container"> {/* Matches your CSS container class */}
        <h2 className="heading">Patient Login</h2>

        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>} {/* Display error messages */}

        <Form className="form" onSubmit={handleSubmit}>
          <Form.Group>
            <Form.Label>Patient ID</Form.Label>
            <Form.Control 
              className="input"
              type="text" 
              name="patientID" 
              onChange={handleChange} 
              required 
              placeholder="Enter your ID"
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

          <Button className="login-button" type="submit" disabled={loading}>
            {loading ? <Spinner animation="border" size="sm" /> : "Login"}
          </Button>
        </Form>
      </Container>
    </div>
  );
};

export default PatientLogin;
