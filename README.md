# **Swasthify – Smart Healthcare Monitoring for Underserved Communities**

A real-time patient health monitoring system designed to empower frontline healthcare workers and provide remote relatives with seamless access to live health updates, ensuring continuous care and peace of mind from anywhere in the world.

---

## 🌐 Live Links
- **Frontend**: [https://swasthify-five.vercel.app/](https://swasthify-five.vercel.app/)
- **Backend**: [https://back1-production-a3f3.up.railway.app/](https://back1-production-a3f3.up.railway.app/)

---

## 📋 Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)
- [Installation and Setup](#installation-and-setup)

---

## 📌 OVERVIEW

Swasthify is an advanced web application designed to facilitate real-time health monitoring for underserved communities. It enables doctors and nurses to securely record and update patient vitals, while providing remote relatives with seamless access to live health data using a unique patient ID.

With an intuitive interface and structured data management, Swasthify ensures efficient patient tracking, enhances medical oversight, and fosters better communication between healthcare providers and families—anytime, anywhere.

---

## 🚀 FEATURES

- Role-based access: Doctors/Nurses vs Relatives  
- Add & View vital signs: BP, Sugar, Heart Rate  
- Unique Patient ID for secure access  
- Clean UI with calming colors and smooth animations  
- Real-time updates for relatives  

---

## 🛠️ TECH STACK

- **Frontend**: React.js, HTML, CSS, Bootstrap  
- **Backend**: Node.js, Express.js, MongoDB  
- **Deployment**: Vercel (Frontend), Railway (Backend)  
- **Version Control**: Git, GitHub  

---

## 📂 FOLDER STRUCTURE

📦 Swasthify  
├── 📁 healthcare-backend  
│   ├── 📁 models  
│   │   ├── Patient.js  
│   │   └── Staff.js  
│   ├── 📁 routes  
│   │   ├── authRoutes.js  
│   │   └── patientRoutes.js  
│   ├── 📁 node_modules  
│   ├── .env  
│   ├── package.json  
│   ├── package-lock.json  
│   └── server.js  
├── 📁 healthcare-frontend  
│   ├── 📁 build  
│   ├── 📁 node_modules  
│   ├── 📁 public  
│   ├── 📁 src  
│   │   ├── 📁 assets  
│   │   ├── 📁 components  
│   │   │   └── Navbar.js  
│   │   ├── 📁 context  
│   │   │   └── PatientContext.js  
│   │   ├── 📁 pages  
│   │   │   ├── Dashboard.js  
│   │   │   ├── Home.js  
│   │   │   ├── Login.js  
│   │   │   ├── PatientDashboard.js  
│   │   │   ├── PatientLogin.js  
│   │   │   ├── StaffLogin.js  
│   │   │   ├── Update.js  
│   │   │   └── signup.js  
│   │   ├── 📁 styles  
│   │   │   ├── Home.css  
│   │   │   ├── Login.css  
│   │   │   ├── Navbar.css  
│   │   ├── App.css  
│   │   ├── App.js  
│   │   ├── index.js  
│   │   └── index.css  
│   ├── package.json  
│   └── package-lock.json  
└ readme.md

---

## ⚙️ INSTALLATION AND SETUP

### ✅ Pre-requisites
- Node.js

### 🔧 Backend Setup
- `npm install` (creates `.env` using `.env.example`)
- `node server.js`

### 💻 Frontend Setup
- `npm install`
- `npm start`

---

## 👨‍⚕️ STAFF LOGIN CREDENTIALS
- **Doctor ID**: `doctor123`
- **Password**: `securepass`

- **Nurse ID**: `nurse123`
- **Password**: `pass123`

---

## 🧑‍💼 PATIENT LOGIN CREDENTIALS

### Patient 1
- **Patient ID**: `ID001`  
- **Password**: `ID001`

### Patient 2
- **Patient ID**: `ID002`  
- **Password**: `ID002`

### Patient 3
- **Patient ID**: `ID003`  
- **Password**: `ID003`
