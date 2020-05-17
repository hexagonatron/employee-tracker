const connection = require("./db");

const makeUpdateString = async (tableUpdated, updatedRecord, id) => {
    
    const oldResult = await connection.queryAsync(`SELECT * FROM ?? WHERE id=?`, [tableUpdated, id]);

    let updateString = "";

        for(key in updatedRecord){
            updateString += `Old ${key}: ${oldResult[0][key]}, new ${key}: ${updatedRecord[key]}\n`;
        }

    return updateString;
}

const removeUndefined = (object) => {
    for(key in object){
        if(object[key] === undefined) delete object[key];
    }

    return object;
}

module.exports = {
    addNewEmployeeAndUpdate: async (employee) => {
        const results = await connection.queryAsync("INSERT INTO employee SET ?", employee);
        await connection.queryAsync("UPDATE employee SET manager_id=? WHERE id=?", [results.insertId, results.insertId]);

        return console.log(`Successfully added ${employee.first_name} ${employee.last_name} into database. Their employee ID is ${results.insertId}`);
    },

    addNewEmployee: async (employee) => {
        const results = await connection.queryAsync("INSERT INTO employee SET ?", employee);

        return console.log(`Successfully added ${employee.first_name} ${employee.last_name} into database. Their employee ID is ${results.insertId}`);
    },

    addNewRole: async (role) => {
        const results = await connection.queryAsync("INSERT INTO role SET ?", role);
        return console.log(`Sucessfully added ${role.title} with id ${results.insertId}`);
    },

    addNewDepartment: async (department) => {
        const results = await connection.queryAsync("INSERT INTO department SET ?", department);
        return console.log(`Sucessfully added ${department.name} with id ${results.insertId}`);
    },
    getRolesAsChoices: async () => {
        //Function generates an array based on which roles are in the roles table
        const data = await connection.queryAsync("SELECT role.id,title, name FROM role INNER JOIN department ON role.department_id = department.id");

        maxTitleLen = data.reduce((maxLen, { title }) => title.length > maxLen ? title.length : maxLen, 0);

        return data.map(({ id, title, name }) => {
            return {
                name: `${title}${" ".repeat((maxTitleLen + 2) - title.length)} for ${name} department`,
                value: id
            }
        });
    },
    getDepartmentsAsChoices: async () => {
        const results = await connection.queryAsync("SELECT name, id FROM department ORDER BY name DESC");

        return results.map(({ name, id }) => {
            return {
                name,
                value: id
            };
        })
    },
    updateEmployee: async ({id, first_name, last_name, role_id, manager_id}) => {
        
        const oldResult = await connection.queryAsync("SELECT * FROM employee WHERE id=?", id);
        const employee = removeUndefined({first_name, last_name, role_id, manager_id});

        const updateString = await makeUpdateString("employee", employee, id);

        await connection.queryAsync("UPDATE employee SET ? WHERE id=?", [employee, id]);

        return console.log(`Successfully updated ${oldResult[0].first_name} ${oldResult[0].last_name}.\n${updateString}`);
    },
    updateDepartment: async ({id, name}) => {
        const oldResult = await connection.queryAsync("SELECT * FROM department WHERE id=?", id);
        const department = removeUndefined({name});

        const updateString = await makeUpdateString("department", department, id);

        await connection.queryAsync("UPDATE department SET ? WHERE id=?", [department, id]);

        return console.log(`Sucessfully updated ${oldResult[0].name}\n${updateString}`);
    },
    updateRole: async ({id, title, salary, department_id}) => {
        const oldResult = await connection.queryAsync("SELECT * FROM role WHERE id=?", id);

        const role = removeUndefined({title, salary, department_id});

        const updateString = await makeUpdateString("role", role, id);

        await connection.queryAsync("UPDATE role SET ? WHERE id=?", [role, id]);

        return console.log(`Sucessfully updated ${oldResult[0].title}\n${updateString}`);
    }

}