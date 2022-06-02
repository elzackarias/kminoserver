const mysql = require('mysql');

const mysqlConnection = mysql.createConnection({
  host: 'localhost',
  user: 'pepe',
  password: 'Cg3zmXarDIgJP2xa',
  database: 'kmino',
  multipleStatements: true,
  insecureAuth : true
});

mysqlConnection.connect(function (err) {
  if (err) {
    console.error(err);
    return;
  } else {
    console.log('db is connected');
  }
});

module.exports = mysqlConnection;