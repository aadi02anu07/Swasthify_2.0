import { useState } from "react";
import axios from "axios";
import { Container, Form, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    bp: "",
    sugar: "",
    heartRate: "", // ✅ Added heartRate field
    patientID: "",
    password: ""
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log("Submitting Data:", formData); // 🔍 Debugging log
      await axios.post("https://back1-production-a3f3.up.railway.app/api/auth/signup", formData);
      alert("Patient registered successfully!");
      navigate("/Dashboard");
    } catch (error) {
      console.error("Error registering patient:", error);
    }
  };

  return (
    <Container>
      <h2>Register Patient</h2>
      <Form onSubmit={handleSubmit}>
        <Form.Group>
          <Form.Label>Name</Form.Label>
          <Form.Control type="text" name="name" onChange={handleChange} required />
        </Form.Group>
        <Form.Group>
          <Form.Label>Age</Form.Label>
          <Form.Control type="number" name="age" onChange={handleChange} required />
        </Form.Group>
        <Form.Group>
          <Form.Label>BP</Form.Label>
          <Form.Control type="text" name="bp" onChange={handleChange} required />
        </Form.Group>
        <Form.Group>
          <Form.Label>Sugar</Form.Label>
          <Form.Control type="text" name="sugar" onChange={handleChange} required />
        </Form.Group>
        <Form.Group>
          <Form.Label>Heart Rate</Form.Label>
          <Form.Control type="text" name="heartRate" onChange={handleChange} required />
        </Form.Group>
        <Form.Group>
          <Form.Label>Patient ID</Form.Label>
          <Form.Control type="text" name="patientID" onChange={handleChange} required />
        </Form.Group>
        <Form.Group>
          <Form.Label>Password</Form.Label>
          <Form.Control type="password" name="password" onChange={handleChange} required />
        </Form.Group>
        <Button type="submit">Register</Button>
      </Form>
    </Container>
  );
};

export default Signup;
