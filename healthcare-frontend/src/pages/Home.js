import { Container } from "react-bootstrap";
import { Link } from "react-router-dom";
import "../styles/Home.css";

const Home = () => {
  return (
    <Container className="text-center mt-5">
      <h1>Welcome to Swasthify</h1>
      <h5>Revolutionizing Connected Healthcare</h5>
      <p>
        Swasthify is an innovative healthcare platform designed to bridge the gap between patients, medical professionals, and their loved ones. By enabling real-time health monitoring, it empowers families to stay informed about a patient’s well-being from anywhere in the world. Doctors and nurses can seamlessly register patients, update critical health parameters, and assign a unique patient ID for secure access. With an intuitive interface and insightful health tracking, Swasthify ensures that distance is never a barrier to care.
      </p>
      <div className="button-group mt-4">
        <Link to="/staff-login">
          <button className="login-button">Staff Login</button>
        </Link>
        <Link to="/patient-login">
          <button className="login-button">Patient Login</button>
        </Link>
      </div>
    </Container>
  );
};

export default Home;
