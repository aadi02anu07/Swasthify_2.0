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
  const existing = await prisma.hospital.findUnique({ where: { email } });
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
  const hospital = await prisma.hospital.findUnique({ where: { email } });
  if (!hospital) throw { status: 401, message: "Invalid credentials." };

  const match = await bcrypt.compare(password, hospital.passwordHash);
  if (!match) throw { status: 401, message: "Invalid credentials." };

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

module.exports = { registerHospital, loginHospital };