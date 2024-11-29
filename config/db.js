const sql = require('mssql');
require('dotenv').config();

const config = {
    server: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
        encrypt: false, // Chỉ để false khi làm việc local
        enableArithAbort: true,
        trustServerCertificate: true,
    },
};

sql.connect(config)
  .then(() => console.log("Kết nối thành công"))
  .catch((err) => console.error("Lỗi kết nối:", err));


module.exports = {
    connect: () => sql.connect(config),
    sql,
};