import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { PatientProvider } from "./context/PatientContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <PatientProvider>
    <ToastContainer />
    <App />
  </PatientProvider>
);
