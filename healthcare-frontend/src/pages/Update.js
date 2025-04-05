import { useState } from "react";
import axios from "axios";
import { Container, Form, Button } from "react-bootstrap";

const Update = () => {
  const [patientID, setPatientID] = useState("");
  const [formData, setFormData] = useState({ bp: "", sugar: "", age: "" });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`https://back1-production-a3f3.up.railway.app/api/auth/update/${patientID}`, formData);
      setMessage("Patient data updated successfully!");
    } catch (error) {
      setMessage("Error updating patient data. Please try again.");
    }
  };

  return (
    <Container>
      <h2>Update Patient Data</h2>
      {message && <p>{message}</p>}
      <Form onSubmit={handleSubmit}>
        <Form.Group>
          <Form.Label>Patient ID</Form.Label>
          <Form.Control type="text" value={patientID} onChange={(e) => setPatientID(e.target.value)} required />
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
          <Form.Label>Age</Form.Label>
          <Form.Control type="text" name="age" onChange={handleChange} required />
        </Form.Group>
        <Button type="submit">Update</Button>
      </Form>
    </Container>
  );
};

export default Update;
