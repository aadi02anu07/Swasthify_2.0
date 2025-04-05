import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Container, Table, Button, Spinner, Modal, Form } from "react-bootstrap";

const Dashboard = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const navigate = useNavigate();

  // Check if staff is authenticated
  useEffect(() => {
    const token = localStorage.getItem("staffToken");
    if (!token) {
      navigate("/staff-login"); // Redirect to login if not authenticated
    }
  }, [navigate]);

  // Fetch patient data
  useEffect(() => {
    axios
      .get("https://back1-production-a3f3.up.railway.app/api/patients/")
      .then((response) => {
        setPatients(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching patients:", error);
        setLoading(false);
      });
  }, []);

  const handleEditClick = (patient) => {
    setSelectedPatient(patient);
    setShowModal(true);
  };

  const handleSaveChanges = () => {
    axios
      .put(
        `https://back1-production-a3f3.up.railway.app/api/patients/update/${selectedPatient.patientID}`,
        selectedPatient
      )
      .then(() => {
        alert("Patient details updated successfully!");
        setShowModal(false);
        setPatients((prev) =>
          prev.map((p) =>
            p.patientID === selectedPatient.patientID ? selectedPatient : p
          )
        );
      })
      .catch((error) => {
        console.error("Error updating patient details:", error);
      });
  };

  const handleDelete = (patientID) => {
    if (window.confirm("Are you sure you want to delete this patient?")) {
      axios
        .delete(
          `https://back1-production-a3f3.up.railway.app/api/patients/delete/${patientID}`
        )
        .then(() => {
          alert("Patient deleted successfully!");
          setPatients((prev) => prev.filter((p) => p.patientID !== patientID));
        })
        .catch((error) => {
          console.error("Error deleting patient:", error);
        });
    }
  };

  const handleChange = (e) => {
    setSelectedPatient({ ...selectedPatient, [e.target.name]: e.target.value });
  };

  return (
    <Container className="mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Patient Dashboard</h1>
        <Button variant="primary" onClick={() => navigate("/signup")}>
          Patient Sign Up
        </Button>
      </div>
      {loading ? (
        <Spinner animation="border" />
      ) : (
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Patient ID</th>
              <th>Name</th>
              <th>Age</th>
              <th>BP</th>
              <th>Sugar</th>
              <th>Heart Rate</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((patient) => (
              <tr key={patient.patientID}>
                <td>{patient.patientID}</td>
                <td>{patient.name}</td>
                <td>{patient.age}</td>
                <td>{patient.bp}</td>
                <td>{patient.sugar}</td>
                <td>{patient.heartRate}</td>
                <td>
                  <Button
                    variant="warning"
                    className="m-1"
                    onClick={() => handleEditClick(patient)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    className="m-1"
                    onClick={() => handleDelete(patient.patientID)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* Edit Patient Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Patient Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPatient && (
            <Form>
              <Form.Group>
                <Form.Label>Blood Pressure</Form.Label>
                <Form.Control
                  type="text"
                  name="bp"
                  value={selectedPatient.bp}
                  onChange={handleChange}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Sugar</Form.Label>
                <Form.Control
                  type="text"
                  name="sugar"
                  value={selectedPatient.sugar}
                  onChange={handleChange}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Heart Rate</Form.Label>
                <Form.Control
                  type="text"
                  name="heartRate"
                  value={selectedPatient.heartRate}
                  onChange={handleChange}
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveChanges}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Dashboard;
