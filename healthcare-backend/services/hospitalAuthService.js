const bcrypt  = require("bcryptjs");
const prisma  = require("../config/db");
const { generateRegistrationCode } = require("../utils/idGen");
const { generateAccessToken, generateRefreshToken } = require("../utils/jwt");
const { saveRefreshToken } = require("../config/redis");

/**
 * Register a new hospital.
 * Generates a unique registrationCode that the hospital shares with its staff.
 */
const registerHospital = async ({ name, city, state, phone, email, password }) => {
  const existing = await prisma.hospital.findFirst({ where: { email } });
  if (existing) throw { status: 409, message: "A hospital with this email already exists." };

  // Ensure the registration code is unique (extremely unlikely collision but safe)
  let registrationCode;
  let taken = true;
  while (taken) {
    registrationCode = generateRegistrationCode();
    taken = await prisma.hospital.findUnique({ where: { registrationCode } });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const hospital = await prisma.hospital.create({
    data: { name, city, state, phone, email, passwordHash, registrationCode },
    select: {
      id: true, name: true, city: true, state: true,
      email: true, registrationCode: true, verified: true, createdAt: true,
    },
  });

  return hospital;
};

/**
 * Hospital admin login.
 * Returns short-lived access token + long-lived refresh token.
 */
const loginHospital = async ({ email, password }) => {
  const hospital = await prisma.hospital.findFirst({ where: { email } });
  if (!hospital) throw { status: 401, message: "Invalid credentials." };

  const match = await bcrypt.compare(password, hospital.passwordHash);
  if (!match) throw { status: 401, message: "Invalid credentials." };

  // Block unverified hospitals — verified is set manually by the platform admin
  if (!hospital.verified) {
    throw {
      status: 403,
      message: "Your hospital account is pending verification. Please contact support at aadi02anu07@gmail.com.",
    };
  }

  const payload = {
    id:   hospital.id,
    type: "hospital",
    name: hospital.name,
  };

  const accessToken  = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  await saveRefreshToken(hospital.id, refreshToken);

  return {
    accessToken,
    refreshToken,
    hospital: {
      id:               hospital.id,
      name:             hospital.name,
      city:             hospital.city,
      registrationCode: hospital.registrationCode,
      verified:         hospital.verified,
    },
  };
};

/**
 * Rotate the hospital's registration code.
 * Generates a new unique code, persists it, and returns it.
 * The old code is immediately invalidated — any staff trying to register with it
 * will receive "Invalid hospital registration code."
 */
const rotateRegistrationCode = async (hospitalId) => {
  // Generate a new unique code (collision loop for safety)
  let newCode;
  let taken = true;
  while (taken) {
    newCode = generateRegistrationCode();
    taken = await prisma.hospital.findUnique({ where: { registrationCode: newCode } });
  }

  const hospital = await prisma.hospital.update({
    where: { id: hospitalId },
    data:  { registrationCode: newCode },
    select: { id: true, name: true, registrationCode: true },
  });

  return hospital;
};

module.exports = { registerHospital, loginHospital, rotateRegistrationCode };