const { body } = require("express-validator");

const registerHospitalRules = [
  body("name").trim().notEmpty().withMessage("Hospital name is required."),
  body("city").trim().notEmpty().withMessage("City is required."),
  body("state").trim().notEmpty().withMessage("State is required."),
  body("email").isEmail().normalizeEmail().withMessage("Valid email is required."),
  body("password")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters.")
    .matches(/[A-Z]/).withMessage("Must contain at least one uppercase letter.")
    .matches(/[0-9]/).withMessage("Must contain at least one number."),
];

const loginHospitalRules = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email is required."),
  body("password").notEmpty().withMessage("Password is required."),
];

const registerStaffRules = [
  body("staffID").trim().notEmpty().withMessage("Staff ID is required."),
  body("name").trim().notEmpty().withMessage("Name is required."),
  body("role").isIn(["doctor", "nurse", "admin"]).withMessage("Role must be doctor, nurse, or admin."),
  body("password")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters.")
    .matches(/[A-Z]/).withMessage("Must contain at least one uppercase letter.")
    .matches(/[0-9]/).withMessage("Must contain at least one number."),
  body("registrationCode").trim().notEmpty().withMessage("Hospital registration code is required."),
];

const loginStaffRules = [
  body("staffID").trim().notEmpty().withMessage("Staff ID is required."),
  body("password").notEmpty().withMessage("Password is required."),
];

const registerPatientRules = [
  body("name").trim().notEmpty().withMessage("Name is required."),
  body("dob")
    .isISO8601().withMessage("Date of birth must be a valid date (YYYY-MM-DD).")
    .custom((val) => {
      if (new Date(val) >= new Date()) throw new Error("Date of birth must be in the past.");
      return true;
    }),
  body("bloodGroup")
    .optional()
    .isIn(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
    .withMessage("Invalid blood group."),
  body("gender")
    .optional()
    .isIn(["male", "female", "other"])
    .withMessage("Gender must be male, female, or other."),
  body("phone").optional().isMobilePhone().withMessage("Invalid phone number."),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters."),
];

const loginPatientRules = [
  body("patientID").trim().notEmpty().withMessage("Patient ID is required."),
  body("password").notEmpty().withMessage("Password is required."),
];

module.exports = {
  registerHospitalRules, loginHospitalRules,
  registerStaffRules,    loginStaffRules,
  registerPatientRules,  loginPatientRules,
};