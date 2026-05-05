const express = require("express");
const router  = express.Router();

const { addPatient, getAllPatients, getPatient, updatePatient, deletePatient } = require("../controllers/patientController");
const { verifyToken, staffOnly, doctorOnly } = require("../middleware/authMiddleware");
const { addPatientRules, updatePatientRules, patientIDParamRules } = require("../middleware/validators/patientValidators");
const validate = require("../middleware/validate");

// Public (any valid token)
router.get("/:patientID",           verifyToken,               patientIDParamRules, validate, getPatient);

// Staff only
router.post("/add",                 verifyToken, staffOnly,    addPatientRules,     validate, addPatient);
router.get("/",                     verifyToken, staffOnly,                                   getAllPatients);
router.put("/update/:patientID",    verifyToken, staffOnly,    updatePatientRules,  validate, updatePatient);

// Doctor only
router.delete("/delete/:patientID", verifyToken, doctorOnly,  patientIDParamRules, validate, deletePatient);

module.exports = router;