const mysql = require('mysql2');

const db = mysql.createConnection({
 host: 'localhost',
 user: 'root',
 password: '',
 database: 'enjambrestore_db'
});

db.connect((err)=>{
 if(err){
  console.log("Database gagal konek:", err);
 } else {
  console.log("Database connected!");
 }
});

module.exports = db;