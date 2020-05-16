require("dotenv").config();
const mysql = require("mysql");

//Initialise DB Connection
const connection = mysql.createConnection({
    host: process.env.DB_IP,

    port: process.env.DB_PORT,

    user: process.env.DB_USERNAME,

    password: process.env.DB_PASSWORD,
    database: "employeedb"
});

//Adding an Async function to the object so I can use it in main script
connection.connectAsync = function(){
    return new Promise((res, rej) => {
        this.connect((err) => {
            if(err) return rej(err);
            res();
        });
    });
};
    

module.exports = connection;