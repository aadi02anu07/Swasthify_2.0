import { Container, Form, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import "../styles/Login.css";

const Login = () => {
  return (
    <Container className="text-center mt-5">
      <h2>Login</h2>
      <Form>
        <Form.Group controlId="formBasicEmail">
          <Form.Label>Email address</Form.Label>
          <Form.Control type="email" placeholder="Enter email" />
        </Form.Group>

        <Form.Group controlId="formBasicPassword" className="mt-3">
          <Form.Label>Password</Form.Label>
          <Form.Control type="password" placeholder="Password" />
        </Form.Group>

        <Button type="submit" className="login-button mt-4">
          Login
        </Button>
      </Form>

      <p className="mt-3">
        Don't have an account? <Link to="/signup">Sign up here</Link>
      </p>
    </Container>
  );
};

export default Login;
