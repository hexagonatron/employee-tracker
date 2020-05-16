const Menu = require("./classes/Menu");
const Action = require("./classes/Action");

const connection = require("./db");

/*
    #####   Main Menu   #####
*/

const mainMenu = new Menu("Main Menu",
    "Welcome to the employee manager!!!",
    "What would you like to do?",
    null);

mainMenu.addAction("Add an Employee, Department or Role", false, () => {
    return addMenu.display();
});

mainMenu.addAction("Update an Employee, Department or Role", false, () => {
    return updateMenu.display();
});

mainMenu.addAction("Delete an Employee, Department or Role", false, () => {
    return deleteMenu.display();
});

/*
    #####   Add Menu   #####
*/

const addMenu = new Menu(
    "Add menu", 
    null,
    "What would you like to add?", 
    mainMenu);

addMenu.addAction("Add Employee", true, () => {
    //ADD
});

addMenu.addAction("Add Department", true, () => {
    //ADD
});

addMenu.addAction("Add Role", true, () => {
    //ADD
});


/*
    #####   Update Menu   #####
*/

const updateMenu = new Menu(
    "Update menu", 
    null, 
    "What would you like to update?", 
    mainMenu);

updateMenu.addAction("Update Employee", true, () => {
    //UPDATE
});

updateMenu.addAction("Update Department", true, () => {
    //UPDATE
});

updateMenu.addAction("Update Role", true, () => {
    //UPDATE
});


/*
    #####   Delete Menu   #####
*/

const deleteMenu = new Menu(
    "Delete menu", 
    null, 
    "What would you like to delete?", 
    mainMenu);

deleteMenu.addAction("Delete Employee", true, () => {
    //Delete
});

deleteMenu.addAction("Delete Department", true, () => {
    //Delete
});

deleteMenu.addAction("Delete Role", true, () => {
    //Delete
});

//View Reports Menu
reportsMenu = new Menu(
    "Reports Menu", 
    null, 
    "Which report would you like to view?",
    mainMenu);

module.exports = {mainMenu, 
    addMenu, 
    updateMenu, 
    deleteMenu, 
    reportsMenu};