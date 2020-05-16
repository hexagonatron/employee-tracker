const inquirer = require("inquirer");

const Menu = require("./classes/Menu");
const Action = require("./classes/Action");
const queries = require("./queries");

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
    return inquirer.prompt([
        {
            name: "first_name",
            message: "What is the employees first name?",
            validate: (val) => val.trim()?true:"Please enter a first name"
        },{
            name: "last_name",
            message: "What is the employees last name?",
            validate: (val) => val.trim()?true:"Please enter a last name"
        },{
            name: "role_id",
            type: "list",
            choices: async () => {
                const data = await connection.queryAsync("SELECT role.id,title, name FROM role INNER JOIN department ON role.department_id = department.id");
        
                maxTitleLen = data.reduce((maxLen, {title}) => title.length > maxLen? title.length: maxLen, 0);
        
                return data.map(({id, title, name}) => {
                    return {
                        name: `${title}${" ".repeat((maxTitleLen + 2) - title.length)} for ${name} department`,
                        value: id
                    }
                });
            },
            message:"Please select their role"
        },{
            name: "manager_selection",
            message:"Who is their manager?",
            type: "list",
            choices: [
                {
                    name: "Choose manager by employee ID",
                    value: 1
                },
                {
                    name: "Select manager from list",
                    value: 2
                },{
                    name: "They're their own manager",
                    value: 4
                },{
                    name: "They don't have a manager",
                    value: 6
                }
            ]
        },{
            name: "manager_id",
            when: ({manager_selection}) => manager_selection === 1,
            message: "Please type the employee ID of their manager",
            type: "number",
            validate: async (id) => {
                const results = await connection.queryAsync("SELECT * FROM employee WHERE id=?", id);
                return results.length? true: "Please enter a valid employee ID";
            }
        },{
            name: "manager_id",
            when: ({manager_selection}) => manager_selection === 3
            
        }
    ]).then(async ({first_name, last_name, role_id, manager_id, manager_selection}) => {

        
        //Monster of a function to handle searching a manager by name
        if(manager_selection == 2){
            manager_id = null;

            while(manager_id == null){
                await inquirer.prompt({
                  message: "What is their managers name? (Leave blank to show all employees)",
                  name: "manager_name"  
                }).then(async ({manager_name}) => {

                    const results = await connection.queryAsync("SELECT id, CONCAT(first_name,' ', last_name) as full_name FROM employee HAVING full_name LIKE ?", [`%${manager_name}%`]);
        
                    if(!results.length){
                        console.log("No employee found, please try again");
                    }else {
                        await inquirer.prompt({
                            message: "Please select their manager",
                            name: "manager",
                            type: "list",
                            choices: () => {
                                const choiceArr = results.map(val => {
                                    return {
                                        name: `id: ${val.id}, ${val.full_name}`,
                                        value: val.id
                                    }
                                })

                                choiceArr.push({name: "Search again", value: false});
            
                                return choiceArr;
                            }
                        }).then(({manager}) => {
                            if(!manager){
                                return
                            } else {
                                manager_id = manager;
                            }
                        });
                    }
                })

            }
        } else if(manager_selection == 4){
            manager_id = null;  
        } else if (manager_selection == 6){
            manager_id = null;
        }

        const newEmployee = {
            first_name, 
            last_name, 
            role_id, 
            manager_id
        }

        if(manager_selection == 4){
            return queries.addNewEmployeeAndUpdate(newEmployee)
        } else {
            return queries.addNewEmployee(newEmployee);
        }
    });
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