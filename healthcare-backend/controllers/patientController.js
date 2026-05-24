const prisma = require("../config/db");

/**
 * GET /api/patients/search?name=<query>&limit=10
 *
 * Search patients by name (case-insensitive, partial match).
 * Returns a lightweight list of { patientID, name } for the autocomplete dropdown.
 * Staff-only — the route guard is applied in patientRoutes.js.
 */
const searchPatients = async (req, res, next) => {
  try {
    const { name = "", limit = 10 } = req.query;

    const trimmed = name.trim();
    if (!trimmed || trimmed.length < 2) {
      return res.status(200).json({ patients: [] });
    }

    const take = Math.min(parseInt(limit) || 10, 20);

    const patients = await prisma.patient.findMany({
      where: {
        name: {
          contains:   trimmed,
          mode:       "insensitive",
        },
      },
      select: {
        patientID: true,
        name:      true,
        gender:    true,
        bloodGroup: true,
      },
      orderBy: { name: "asc" },
      take,
    });

    return res.status(200).json({ patients });
  } catch (err) {
    next(err);
  }
};

module.exports = { searchPatients };
