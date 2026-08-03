const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.hospital.updateMany({ data: { verified: true } })
  .then(r => { console.log('Updated:', r.count, 'hospital(s) set to verified=true'); })
  .catch(e => { console.error('Error:', e.message); })
  .finally(() => p.$disconnect());
