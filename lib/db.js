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

//Adding async query function to make calls easier
connection.queryAsync = function(query, params){
    return new Promise((res, rej) => {
        this.query(query, params, (err, data) => {
            if (err) return rej(err);

            res(data);
        })
    })
}
    

module.exports = connection;