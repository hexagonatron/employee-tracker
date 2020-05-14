const mysql = require("mysql");
const inquirer = require("inquirer");
require("dotenv").config();

const connection = mysql.createConnection({
    host: process.env.DB_IP,

    port: process.env.DB_PORT,

    user: process.env.DB_USERNAME,

    password: process.env.DB_PASSWORD,
    database: "employeedb"
});

connection.connect((err) => {
    if (err) throw err;
    mainScript();
});


const mainScript = () => {
    
}