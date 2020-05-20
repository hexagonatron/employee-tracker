const inquirer = require("inquirer");

const Menu = require("./classes/Menu");
const Action = require("./classes/Action");
const queries = require("./queries");

const connection = require("./db");

const cTable = require("console.table");

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

mainMenu.addAction("View Reports", false, () => {
    return reportsMenu.display();
})

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
            validate: (val) => val.trim() ? true : "Please enter a first name"
        }, {
            name: "last_name",
            message: "What is the employees last name?",
            validate: (val) => val.trim() ? true : "Please enter a last name"
        }, {
            name: "role_id",
            type: "list",
            choices: queries.getRolesAsChoices,
            message: "Please select their role"
        }, {
            name: "manager_selection",
            message: "Who is their manager?",
            type: "list",
            choices: [
                {
                    name: "Choose manager by employee ID",
                    value: 1
                },
                {
                    name: "Select manager from list",
                    value: 2
                }, {
                    name: "They're their own manager",
                    value: 4
                }, {
                    name: "They don't have a manager",
                    value: 6
                }
            ]
        }, {
            name: "manager_id",
            when: ({ manager_selection }) => manager_selection === 1,
            message: "Please type the employee ID of their manager",
            type: "number",
            validate: async (id) => {
                const results = await connection.queryAsync("SELECT * FROM employee WHERE id=?", id);
                return results.length ? true : "Please enter a valid employee ID";
            }
        }
    ]).then(async ({ first_name, last_name, role_id, manager_id, manager_selection }) => {


        //Monster of a function to handle searching a manager by name
        if (manager_selection == 2) {
            manager_id = null;

            while (manager_id == null) {
                await inquirer.prompt({
                    message: "What is their managers name? (Leave blank to show all employees)",
                    name: "manager_name"
                }).then(async ({ manager_name }) => {

                    //Gets names from db using wildcards
                    const results = await connection.queryAsync("SELECT id, CONCAT(first_name,' ', last_name) as full_name FROM employee HAVING full_name LIKE ?", [`%${manager_name}%`]);

                    //If nothing found try again
                    if (!results.length) {
                        console.log("No employee found, please try again");
                    } else {
                        //If results found then generate a list of choices
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

                                choiceArr.push({ name: "Search again", value: false });

                                return choiceArr;
                            }
                        }).then(({ manager }) => {
                            if (!manager) {
                                return
                            } else {
                                manager_id = manager;
                            }
                        });
                    }
                })

            }
        } else if (manager_selection == 4) {
            manager_id = null;
        } else if (manager_selection == 6) {
            manager_id = null;
        }

        //New employee to add to the DB
        const newEmployee = {
            first_name,
            last_name,
            role_id,
            manager_id
        }

        if (manager_selection == 4) {
            //If they're their own manager have to add to the DB first, get the ID then update their manager id with the newly created ID
            return queries.addNewEmployeeAndUpdate(newEmployee)
        } else {
            return queries.addNewEmployee(newEmployee);
        }
    });
});

addMenu.addAction("Add Role", true, () => {
    return inquirer.prompt([
        {
            name: "title",
            message: "What is the job title of the role to add?",
            validate: (input) => input.trim() ? true : "Please enter a job title",
        }, {
            name: "salary",
            message: "What is the salary of the job to add?",
            transformer: (input) => `$${input}`,
            type: "number",
            validate: (input) => typeof input === "number" ? true : "Please enter a number"
        }, {
            name: "department_id",
            message: "Which department does this role belong to?",
            type: "list",
            choices: queries.getDepartmentsAsChoices
        }
    ]).then(async ({ title, salary, department_id }) => {
        const newRole = {
            title,
            salary,
            department_id
        }

        return await queries.addNewRole(newRole);
    })
});

addMenu.addAction("Add Department", true, () => {
    return inquirer.prompt([
        {
            name: "name",
            message: "What is the name of the department to add?",
            validate: (input) => input.trim() ? true : "Please enter a name",
        }
    ]).then(async ({ name }) => {
        const newDepartment = {
            name
        }

        return queries.addNewDepartment(newDepartment);
    })
});


/*
    #####   Update Menu   #####
*/

const updateMenu = new Menu(
    "Update menu",
    null,
    "What would you like to update?",
    mainMenu);

updateMenu.addAction("Update Employee", true, async () => {

    let hasChosenEmployee = false;
    let chosenEmployee;

    while (!hasChosenEmployee) {
        await inquirer.prompt([
            {
                name: "which_employee",
                message: "Which Employee would you like to update? (search by name or type their ID)"
            }
        ]).then(async ({ which_employee }) => {

            if (which_employee.match(/^\d+$/g)) {

                //If entered a number then search based on ID

                const results = await connection.queryAsync(`
                SELECT 
                    employee.*,
                    CONCAT(employee.first_name, ' ', employee.last_name) AS full_name, 
                    role.title, 
                    CONCAT(manager.first_name, " ", manager.last_name) AS manager_name 
                FROM employee 
                LEFT JOIN role 
                ON role_id=role.id 
                LEFT JOIN department 
                ON department_id= department.id 
                LEFT JOIN employee manager 
                ON employee.manager_id= manager.id 
                WHERE employee.id=?`, which_employee);

                if (!results.length) {
                    console.log(`No employee found with ID ${which_employee}. Please try again`);
                } else {

                    await inquirer.prompt(
                        {
                            message: `Update ${results[0].full_name}?`,
                            name: "confirm",
                            type: "confirm"
                        }
                    ).then(({ confirm }) => {
                        if (confirm) {
                            hasChosenEmployee = true;
                            chosenEmployee = results[0];
                        }
                    });
                }

            } else {
                const results = await connection.queryAsync(`
            SELECT 
                employee.*,
                CONCAT(employee.first_name, ' ', employee.last_name) AS full_name, 
                role.title, 
                CONCAT(manager.first_name, " ", manager.last_name) AS manager_name 
            FROM employee 
            LEFT JOIN role 
            ON role_id=role.id 
            LEFT JOIN department 
            ON department_id= department.id 
            LEFT JOIN employee manager 
            ON employee.manager_id= manager.id
            HAVING full_name 
            LIKE ?`, `%${which_employee}%`);

                if (!results.length) {
                    console.log(`No employee found with search term ${which_employee}. Please try again`);
                } else {

                    await inquirer.prompt(
                        {
                            message: `Who would you like to update?`,
                            name: "employee_choice",
                            type: "list",
                            choices: () => {
                                const choices = results.map(val => {
                                    return {
                                        name: `ID: ${val.id}, ${val.full_name}`,
                                        value: val
                                    }
                                })
                                choices.push({
                                    name: "Search again",
                                    value: false
                                })

                                return choices;
                            }
                        }
                    ).then(({ employee_choice }) => {

                        if (employee_choice) {
                            hasChosenEmployee = true;
                            chosenEmployee = employee_choice;
                        }
                    });
                }
            }
        })
    }

    await inquirer.prompt([
        {
            message: `What would you like to update for ${chosenEmployee.full_name}?`,
            type: "checkbox",
            name: "updates",
            choices: [
                {
                    name: `First Name.   Current value: ${chosenEmployee.first_name}`,
                    value: "first_name"
                }, {
                    name: `Last name.    Current value: ${chosenEmployee.last_name}`,
                    value: "last_name"
                }, {
                    name: `Role.         Current role: ${chosenEmployee.title == null ? "No role" : chosenEmployee.title}`,
                    value: "role_id"
                }, {
                    name: `Manager.      Current manager: ${chosenEmployee.manager_name === null ? "No manager" : chosenEmployee.manager_name}`,
                    value: "manager_id"
                }
            ]
        }, {
            name: "first_name",
            when: ({ updates }) => updates.includes("first_name"),
            message: `New first name for ${chosenEmployee.full_name}`,
            validate: (val) => val.trim() ? true : "Please enter a first name"
        }, {
            name: "last_name",
            when: ({ updates }) => updates.includes("last_name"),
            message: `New last name for ${chosenEmployee.full_name}`,
            validate: (val) => val.trim() ? true : "Please enter a last name"
        }, {
            name: "role_id",
            when: ({ updates }) => updates.includes("role_id"),
            message: `Select a new role for ${chosenEmployee.full_name}`,
            type: "list",
            choices: queries.getRolesAsChoices
        }, {
            name: "manager_selection",
            when: ({ updates }) => updates.includes("manager_id"),
            message: `Who is ${chosenEmployee.full_name}'s new manager?`,
            type: "list",
            choices: [
                {
                    name: "Choose manager by employee ID",
                    value: 1
                },
                {
                    name: "Select manager from list",
                    value: 2
                }, {
                    name: "They're their own manager",
                    value: 4
                }, {
                    name: "They don't have a manager",
                    value: 6
                }
            ]
        }, {
            name: "manager_id",
            when: ({ manager_selection }) => manager_selection === 1,
            message: "Please type the employee ID of their manager",
            type: "number",
            validate: async (id) => {
                const results = await connection.queryAsync("SELECT * FROM employee WHERE id=?", id);
                return results.length ? true : "Please enter a valid employee ID";
            }
        }
    ]).then(async ({ updates, first_name, last_name, role_id, manager_selection, manager_id }) => {
        if (updates.includes("manager_id") && manager_selection == 2) {

            let hasSelectedManager = false;

            while (!hasSelectedManager) {
                await inquirer.prompt({
                    message: "What is their managers name? (Leave blank to show all employees)",
                    name: "manager_name"
                }).then(async ({ manager_name }) => {

                    //Gets names from db using wildcards
                    const results = await connection.queryAsync("SELECT id, CONCAT(first_name,' ', last_name) as full_name FROM employee HAVING full_name LIKE ?", [`%${manager_name}%`]);

                    //If nothing found try again
                    if (!results.length) {
                        console.log("No employee found, please try again");
                    } else {
                        //If results found then generate a list of choices
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

                                choiceArr.push({ name: "Search again", value: false });

                                return choiceArr;
                            }
                        }).then(({ manager }) => {
                            if (manager) {
                                manager_id = manager;
                                hasSelectedManager = true;
                            }
                        });
                    }
                })


            }


        } else if (manager_selection === 6) {
            manager_id = null;
        } else if (manager_selection === 4) {
            manager_id = chosenEmployee.id;
        }

        const updatedEmployee = {
            id: chosenEmployee.id,
            first_name,
            last_name,
            role_id,
            manager_id
        }
        return queries.updateEmployee(updatedEmployee);
    });



});

updateMenu.addAction("Update Department", true, async () => {

    let hasChosenDepartment = false;
    let chosenDepartment;

    while (!hasChosenDepartment) {
        await inquirer.prompt([
            {
                name: "which_department",
                message: "Which Department would you like to update? (search by name or type their ID)"
            }
        ]).then(async ({ which_department }) => {

            if (which_department.match(/^\d+$/g)) {

                //If entered a number then search based on ID

                const results = await connection.queryAsync(`
                SELECT *
                FROM department 
                WHERE id=?`, which_department);

                if (!results.length) {
                    console.log(`No department found with ID ${which_department}. Please try again`);
                } else {

                    await inquirer.prompt(
                        {
                            message: `Update ${results[0].name}?`,
                            name: "confirm",
                            type: "confirm"
                        }
                    ).then(({ confirm }) => {
                        if (confirm) {
                            hasChosenDepartment = true;
                            chosenDepartment = results[0];
                        }
                    });
                }

            } else {
                const results = await connection.queryAsync(`
            SELECT *
            FROM department
            WHERE name 
            LIKE ?`, `%${which_department}%`);

                if (!results.length) {
                    console.log(`No department found with search term ${which_department}. Please try again`);
                } else {

                    await inquirer.prompt(
                        {
                            message: `Which department would you like to update?`,
                            name: "department_choice",
                            type: "list",
                            choices: () => {
                                const choices = results.map(val => {
                                    return {
                                        name: `ID: ${val.id}, ${val.name}`,
                                        value: val
                                    }
                                })
                                choices.push({
                                    name: "Search again",
                                    value: false
                                })

                                return choices;
                            }
                        }
                    ).then(({ department_choice }) => {

                        if (department_choice) {
                            hasChosenDepartment = true;
                            chosenDepartment = department_choice;
                        }
                    });
                }
            }
        })
    }

    await inquirer.prompt([
        {
            name: "name",
            message: `What is the new name of ${chosenDepartment.name}`,
            validate: (val) => val.trim() ? true : "Please enter a department name"
        }
    ]).then(async ({ name }) => {
        const updatedDepartment = {
            id: chosenDepartment.id,
            name
        }

        return await queries.updateDepartment(updatedDepartment);
    })

});

updateMenu.addAction("Update Role", true, async () => {
    let hasChosenRole = false;
    let chosenRole;

    while (!hasChosenRole) {
        await inquirer.prompt([
            {
                name: "which_role",
                message: "Which Role would you like to update? (search by name or type their ID)"
            }
        ]).then(async ({ which_role }) => {

            //If haven't typed anything then prompt again
            if (which_role.match(/^\d+$/g)) {

                //If entered a number then search based on ID

                const results = await connection.queryAsync(`
                SELECT
                    role.*,
                    department.name
                FROM role
                LEFT JOIN department
                ON department_id = department.id 
                WHERE role.id=?`, which_role);

                if (!results.length) {
                    console.log(`No roles found with ID ${which_role}. Please try again`);
                } else {

                    await inquirer.prompt(
                        {
                            message: `Update ${results[0].title}?`,
                            name: "confirm",
                            type: "confirm"
                        }
                    ).then(({ confirm }) => {
                        if (confirm) {
                            hasChosenRole = true;
                            chosenRole = results[0];
                        }
                    });
                }

            } else {
                const results = await connection.queryAsync(`
            SELECT
                role.*,
                department.name
            FROM role
            LEFT JOIN department
            ON department_id = department.id
            WHERE title 
            LIKE ?`, `%${which_role}%`);

                if (!results.length) {
                    console.log(`No role found with search term ${which_role}. Please try again`);
                } else {

                    await inquirer.prompt(
                        {
                            message: `Which role would you like to update?`,
                            name: "role_choice",
                            type: "list",
                            choices: () => {
                                const choices = results.map(val => {
                                    return {
                                        name: `ID: ${val.id}, ${val.title}`,
                                        value: val
                                    }
                                })
                                choices.push({
                                    name: "Search again",
                                    value: false
                                })

                                return choices;
                            }
                        }
                    ).then(({ role_choice }) => {

                        if (role_choice) {
                            hasChosenRole = true;
                            chosenRole = role_choice;
                        }
                    });
                }
            }
        })
    }

    await inquirer.prompt([
        {
            message: `What would you like to update for ${chosenRole.title}?`,
            type: "checkbox",
            name: "updates",
            choices: [
                {
                    name: `Role title.   Current value: ${chosenRole.title}`,
                    value: "title"
                }, {
                    name: `Salary.       Current value: ${chosenRole.salary}`,
                    value: "salary"
                }, {
                    name: `Department.   Current department: ${chosenRole.name}`,
                    value: "department_id"
                }
            ]
        }, {
            name: "title",
            when: ({ updates }) => updates.includes("title"),
            message: `New title for ${chosenRole.title}`,
            validate: (val) => val.trim() ? true : "Please enter a title"
        }, {
            name: "salary",
            when: ({ updates }) => updates.includes("salary"),
            message: `New salary for ${chosenRole.title}`,
            type: "number",
            validate: (val) => val > 0 ? true : "Please enter a salary greater than 0"
        }, {
            name: "department_id",
            when: ({ updates }) => updates.includes("department_id"),
            message: `Pick a new department for ${chosenRole.title}`,
            type: "list",
            choices: queries.getDepartmentsAsChoices
        }
    ]).then(async ({ title, salary, department_id }) => {
        const updatedRole = {
            id: chosenRole.id,
            title,
            salary,
            department_id,
        }

        return await queries.updateRole(updatedRole);
    })
});


/*
    #####   Delete Menu   #####
*/

const deleteMenu = new Menu(
    "Delete menu",
    null,
    "What would you like to do?",
    mainMenu);

deleteMenu.addAction("Delete an Employee", true, async () => {

    let hasChosenEmployee = false;
    let chosenEmployee;

    while (!hasChosenEmployee) {
        await inquirer.prompt([
            {
                name: "which_employee",
                message: "Which Employee would you like to delete? (search by name or type their ID)"
            }
        ]).then(async ({ which_employee }) => {


            if (which_employee.match(/^\d+$/g)) {

                //If entered a number then search based on ID

                const results = await connection.queryAsync(`
                SELECT 
                    employee.*,
                    CONCAT(employee.first_name, ' ', employee.last_name) AS full_name, 
                    role.title, 
                    CONCAT(manager.first_name, " ", manager.last_name) AS manager_name 
                FROM employee 
                LEFT JOIN role 
                ON role_id=role.id 
                LEFT JOIN department 
                ON department_id= department.id 
                LEFT JOIN employee manager 
                ON employee.manager_id= manager.id 
                WHERE employee.id=?`, which_employee);

                if (!results.length) {
                    console.log(`No employee found with ID ${which_employee}. Please try again`);
                } else {

                    await inquirer.prompt(
                        {
                            message: `Are you sure you want to delete ${results[0].full_name}?`,
                            name: "confirm",
                            type: "confirm"
                        }
                    ).then(({ confirm }) => {
                        if (confirm) {
                            hasChosenEmployee = true;
                            chosenEmployee = results[0];
                        }
                    });
                }

            } else {
                const results = await connection.queryAsync(`
            SELECT 
                employee.*,
                CONCAT(employee.first_name, ' ', employee.last_name) AS full_name, 
                role.title, 
                CONCAT(manager.first_name, " ", manager.last_name) AS manager_name 
            FROM employee 
            LEFT JOIN role 
            ON role_id=role.id 
            LEFT JOIN department 
            ON department_id= department.id 
            LEFT JOIN employee manager 
            ON employee.manager_id= manager.id
            HAVING full_name 
            LIKE ?`, `%${which_employee}%`);

                if (!results.length) {
                    console.log(`No employee found with search term ${which_employee}. Please try again`);
                } else {

                    await inquirer.prompt([
                        {
                            message: `Who would you like to delete?`,
                            name: "employee_choice",
                            type: "list",
                            choices: () => {
                                const choices = results.map(val => {
                                    return {
                                        name: `ID: ${val.id}, ${val.full_name}`,
                                        value: val
                                    }
                                })
                                choices.push({
                                    name: "Search again",
                                    value: false
                                });

                                return choices;
                            }
                        }, {
                            message: (answers) => `Are you sure you want to delete ID: ${answers.employee_choice.id}, ${answers.employee_choice.full_name}?`,
                            type: "confirm",
                            name: "confirm",
                            when: (answers) => answers.employee_choice
                        }
                    ]).then(({ employee_choice, confirm }) => {

                        if (!confirm) {
                            hasChosenEmployee = true;
                            return
                        }

                        if (employee_choice) {
                            hasChosenEmployee = true;
                            chosenEmployee = employee_choice;
                        }
                    });
                }
            }
        })
    }//End While

    //If an employee was chosesn, i.e. they didn't choose to exit
    if (chosenEmployee) {
        const results = await queries.deleteFromDB("id", chosenEmployee.id, "employee");

        return console.log(`${chosenEmployee.full_name} Has been deleted from the database`);

    }



});

deleteMenu.addAction("Delete a Department", true, async () => {

    let hasChosenDepartment = false;
    let chosenDepartment;

    while (!hasChosenDepartment) {
        await inquirer.prompt([
            {
                name: "which_department",
                message: "Which Department would you like to delete? (search by name or type their ID)"
            }
        ]).then(async ({ which_department }) => {

            //If haven't typed anything then prompt again
            if (which_department.match(/^\d+$/g)) {

                //If entered a number then search based on ID

                const results = await connection.queryAsync(`
                SELECT *
                FROM department 
                WHERE id=?`, which_department);

                if (!results.length) {
                    console.log(`No department found with ID ${which_department}. Please try again`);
                } else {

                    await inquirer.prompt(
                        {
                            message: `Delete ${results[0].name}?`,
                            name: "confirm",
                            type: "confirm"
                        }
                    ).then(({ confirm }) => {
                        if (confirm) {
                            hasChosenDepartment = true;
                            chosenDepartment = results[0];
                        } else {
                            hasChosenDepartment = true;
                            chosenDepartment = "exit";
                        }
                    });
                }

            } else {
                const results = await connection.queryAsync(`
            SELECT *
            FROM department
            WHERE name 
            LIKE ?`, `%${which_department}%`);

                if (!results.length) {
                    console.log(`No department found with search term ${which_department}. Please try again`);
                } else {

                    await inquirer.prompt(
                        {
                            message: `Which department would you like to delete?`,
                            name: "department_choice",
                            type: "list",
                            choices: () => {
                                const choices = results.map(val => {
                                    return {
                                        name: `ID: ${val.id}, ${val.name}`,
                                        value: val
                                    }
                                })
                                choices.push({
                                    name: "Search again",
                                    value: false
                                })

                                choices.push({
                                    name: "Exit without deleting",
                                    value: "exit"
                                })

                                return choices;
                            }
                        }
                    ).then(({ department_choice }) => {

                        if (department_choice) {
                            hasChosenDepartment = true;
                            chosenDepartment = department_choice;
                        }
                    });
                }
            }
        })
    }

    if (chosenDepartment === "exit") return;

    const result = await queries.deleteFromDB("id", chosenDepartment.id, "department");

    return console.log(`Sucessfully deleted ${chosenDepartment.name}`);


});

deleteMenu.addAction("Delete a Role", true, async () => {
    let hasChosenRole = false;
    let chosenRole;

    while (!hasChosenRole) {
        await inquirer.prompt([
            {
                name: "which_role",
                message: "Which Role would you like to delete? (search by name or type a role ID)"
            }
        ]).then(async ({ which_role }) => {

            if (which_role.match(/^\d+$/g)) {

                //If entered a number then search based on ID

                const results = await connection.queryAsync(`
                SELECT
                    role.*,
                    department.name
                FROM role
                LEFT JOIN department
                ON department_id = department.id 
                WHERE role.id=?`, which_role);

                if (!results.length) {
                    console.log(`No roles found with ID ${which_role}. Please try again`);
                } else {

                    await inquirer.prompt(
                        {
                            message: `Are you sure you want to delete the ${results[0].title} role?`,
                            name: "confirm",
                            type: "confirm"
                        }
                    ).then(({ confirm }) => {
                        if (confirm) {
                            hasChosenRole = true;
                            chosenRole = results[0];
                        } else {
                            hasChosenRole = true;
                            chosenRole = "exit";
                        }
                    });
                }

            } else {
                const results = await connection.queryAsync(`
            SELECT
                role.*,
                department.name
            FROM role
            LEFT JOIN department
            ON department_id = department.id
            WHERE title 
            LIKE ?`, `%${which_role}%`);

                if (!results.length) {
                    console.log(`No role found with search term ${which_role}. Please try again`);
                } else {

                    await inquirer.prompt([
                        {
                            message: `Which role would you like to delete?`,
                            name: "role_choice",
                            type: "list",
                            choices: () => {
                                const choices = results.map(val => {
                                    return {
                                        name: `ID: ${val.id}, ${val.title}`,
                                        value: val
                                    }
                                })
                                choices.push({
                                    name: "Search again",
                                    value: false
                                })

                                choices.push({
                                    name: "Exit without deleting",
                                    value: "exit"
                                })

                                return choices;
                            }
                        }, {
                            message: (answers) => `Are you sure you want to delete the ${answers.role_choice.title} role?`,
                            name: "confirm",
                            type: "confirm"
                        }
                    ]).then(({ role_choice, confirm }) => {

                        if (!confirm) {
                            hasChosenRole = true;
                            chosenRole = "exit";
                            return;
                        }

                        if (role_choice) {
                            hasChosenRole = true;
                            chosenRole = role_choice;
                        }
                    });
                }
            }
        })
    }

    if (chosenRole === "exit") return;

    const result = await queries.deleteFromDB("id", chosenRole.id, "role");

    return console.log(`Sucessfully deleted the role ${chosenRole.title}`);




});

/*
    #####   View Menu   #####
*/
reportsMenu = new Menu(
    "Reports Menu",
    null,
    "Which report would you like to view?",
    mainMenu);

reportsMenu.addAction("View all employees", true, async () => {
    const results = await queries.getAllEmployees();

    return console.table(results);
});

reportsMenu.addAction("View departments", true, async () => {
    const results = await queries.getAllDepartments();

    return console.table(results);
});

reportsMenu.addAction("View roles", true, async () => {
    const results = await queries.getAllRoles();

    return console.table(results);
});

reportsMenu.addAction("View employees by manager", true, async () => {

    let chosenManager;

    await inquirer.prompt({
        name: "manager_choice",
        message: "Which manager's employees would you like to view? (search by id or name)"
    }).then(async ({ manager_choice }) => {


        if (manager_choice.match(/^\d+$/g)) {
            const result = await queries.getOneEmployeeByUnderlingCount(manager_choice);

            console.log(result);

            if (result.length == 0) {
                return console.log(`No employee found with id ${manager_choice}`);
            }

            if (result[0].underling_count === null) {
                return console.log(`${result[0].employee_name} (ID: ${result[0].id}) Doesn't manage anybody.`);
            }

            madeChoice = true;
            chosenManager = result[0];
        } else {
            const result = await queries.getEmployeesByUnderlingCountName(manager_choice);

            if (result.length == 0) return console.log(`No employee found with name ${manager_choice}`);

            await inquirer.prompt([{
                name: "manager_object",
                message: "Who's manager report would you like to view?",
                type: "list",
                choices: async () => {

                    const queryResults = await queries.getEmployeesByUnderlingCountName(manager_choice);

                    const array = queryResults.map((val) => {
                        let obj = {
                            name: val.employee_name,
                            value: val
                        }
                        return obj;
                    });

                    array.push({
                        name: "exit",
                        value: false
                    })

                    return array;
                }
            }]).then( ({manager_object}) => {

                if(manager_object.underling_count === null){
                    chosenManager = false;
                    console.log(`${manager_object.employee_name} doesn't manage anyone`);
                    return
                }

                return chosenManager = manager_object;

            })
        }
    });

    if(!chosenManager) return;

    const results = await queries.getEmployeesByManager(chosenManager.id);

    console.log(`\nEmployees managed by ${chosenManager.employee_name}\n`);
    console.table(results);
});

reportsMenu.addAction("View department summary", true, async () => {
    await inquirer.prompt({
        name:"department_id",
        message: "Which department would you like a report for?",
        type:"list",
        choices: queries.getDepartmentsAsChoices
    }).then( async ({department_id}) => {

        const results = await queries.getDepartmentSummary(department_id);

        const sum = await queries.getDepartmentSalarySum(department_id);

        console.log("\n");
        console.table(results);
        // console.table(sum);
        console.log(`\nTotal salary sum for all employees in department: ${sum[0].salary_sum}\n`);


    })
});



module.exports = {
    mainMenu,
    addMenu,
    updateMenu,
    deleteMenu,
    reportsMenu
};