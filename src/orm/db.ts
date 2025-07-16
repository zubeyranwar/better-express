const ormType = process.env.ORM_TYPE || 'prisma';

// if (ormType === 'prisma') {
//     module.exports = require('./prisma/db');
// } else if (ormType === 'drizzle') {
//     module.exports = require('./drizzle/db');
// } else {
//     throw new Error(`Unsupported ORM_TYPE: ${ormType}`);
// }
