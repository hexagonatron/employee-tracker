const menus = require("./lib/menus");
const connection = require("./lib/db");

connection.connectAsync().then(_ => {
    return menus.mainMenu.display();
}).then(_ => {
    connection.end();
}).catch(err => {
    console.log(err);
    connection.end();
})