const mysql = require("mysql");
const inquirer = require("inquirer");
require("dotenv").config();

const Menu = require("./lib/Menu");

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

const mainMenu = new Menu("Main Menu", "Welcome to the Main menu of this program!!!", "What would you like to do?");

const secondMenu = new Menu("Another Menu", "This is the second menu", "Pick an option", mainMenu);

mainMenu.addAction("Print 1", true, () => {
    return console.log(1);
});

mainMenu.addAction("Print Hello world", true, () => {
    return console.log("Hello World");
});

mainMenu.addAction("Go to the other menu", false, () => {
    return secondMenu.display();
});

secondMenu.addAction("Count to 10", true,  () => {
    return new Promise((res, rej) => {
        let count = 0
        const countToTen = setInterval(() => {
            console.log(count);
            count++

            if(count > 10) {
                clearInterval(countToTen);
                res();
            }
        }, 1000);
    })
}
)


const mainScript = () => {

    mainMenu.display().then(_ => {
        connection.end();
    });
    
}