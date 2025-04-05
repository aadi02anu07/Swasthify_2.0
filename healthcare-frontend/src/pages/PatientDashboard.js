import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Container, Table, Spinner } from "react-bootstrap";

const PatientDashboard = () => {
  const { patientID } = useParams(); // Get patientID from URL
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`https://back1-production-a3f3.up.railway.app/api/patients/${patientID}`)
      .then((response) => {
        setPatient(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching patient data:", error);
        setLoading(false);
      });
  }, [patientID]);

  return (
    <Container className="mt-5">
      <h2>Patient Dashboard</h2>
      {loading ? (
        <Spinner animation="border" />
      ) : patient ? (
        <Table striped bordered hover>
          <tbody>
            <tr>
              <th>Patient ID</th>
              <td>{patient.patientID}</td>
            </tr>
            <tr>
              <th>Name</th>
              <td>{patient.name}</td>
            </tr>
            <tr>
              <th>Age</th>
              <td>{patient.age}</td>
            </tr>
            <tr>
              <th>Blood Pressure</th>
              <td>{patient.bp}</td>
            </tr>
            <tr>
              <th>Sugar Level</th>
              <td>{patient.sugar}</td>
            </tr>
            <tr>
              <th>Heart Rate</th>
              <td>{patient.heartRate}</td>
            </tr>
          </tbody>
        </Table>
      ) : (
        <p>No patient data found.</p>
      )}
    </Container>
  );
};

export default PatientDashboard;
