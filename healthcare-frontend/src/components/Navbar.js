import { Link } from "react-router-dom";
import logo from "../assets/logo.jpg"; // Ensure the logo is inside "assets" folder
import "../styles/Navbar.css"; // Optional: Create a CSS file for navbar styling

const Navbar = () => {
  return (
    <nav className="navbar">
      <Link to="/">
        <img src={logo} alt="Logo" className="logo" />
      </Link>
    </nav>
  );
};

export default Navbar;
