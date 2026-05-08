const bcrypt = require("bcryptjs");
const prisma = require("../config/db");
const { generateAccessToken, generateRefreshToken } = require("../utils/jwt");
const { saveRefreshToken } = require("../config/redis");

/**
 * Register a new staff member.
 * Staff must provide their hospital's registrationCode to join.
 * This is how we tie staff to a specific hospital without an admin manually adding each person.
 */
const registerStaff = async ({ staffID, name, role, password, registrationCode }) => {
  // Validate that the hospital code exists
  const hospital = await prisma.hospital.findUnique({ where: { registrationCode } });
  if (!hospital) {
    throw { status: 404, message: "Invalid hospital registration code." };
  }

  const existing = await prisma.staff.findUnique({ where: { staffID } });
  if (existing) {
    throw { status: 409, message: "A staff member with this ID already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const staff = await prisma.staff.create({
    data: {
      staffID,
      name,
      role,
      passwordHash,
      hospitalId: hospital.id,
    },
    select: {
      id: true, staffID: true, name: true, role: true, createdAt: true,
      hospital: { select: { id: true, name: true, city: true } },
    },
  });

  return staff;
};

/**
 * Staff login.
 */
const loginStaff = async ({ staffID, password }) => {
  const staff = await prisma.staff.findUnique({
    where:   { staffID },
    include: { hospital: { select: { id: true, name: true } } },
  });
  if (!staff) throw { status: 401, message: "Invalid credentials." };

  const match = await bcrypt.compare(password, staff.passwordHash);
  if (!match) throw { status: 401, message: "Invalid credentials." };

  const payload = {
    id:         staff.id,
    type:       "staff",
    role:       staff.role,
    hospitalId: staff.hospitalId,
    name:       staff.name,
  };

  const accessToken  = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  await saveRefreshToken(staff.id, refreshToken);

  return {
    accessToken,
    refreshToken,
    staff: {
      id:       staff.id,
      staffID:  staff.staffID,
      name:     staff.name,
      role:     staff.role,
      hospital: staff.hospital,
    },
  };
};

module.exports = { registerStaff, loginStaff };