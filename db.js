const mysql = require('mysql2');
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'seu_usuario',
  password: 'sua_senha',
  database: 'psicologo_db'
});
module.exports = connection;