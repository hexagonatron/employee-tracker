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

const removeNullVals = (array) => {
    for(result of array){
        for (key in result){
            if(result[key] == null) {
                result[key] = "-";
            }
        }
    }

    return array;
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
        const data = await connection.queryAsync("SELECT role.id,title, name FROM role LEFT JOIN department ON role.department_id = department.id");

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
    },
    deleteFromDB: async (primaryKeyName, primaryKeyValue, tableName) => {
        
        const results = connection.queryAsync("DELETE FROM ?? WHERE ??=?", [tableName, primaryKeyName, primaryKeyValue]);

        return results;
    },
    selectAll: async (tableName, cols = "*") => {
        const results = await connection.queryAsync("SELECT ?? FROM ??", [cols, tableName]);

        return results;
    },
    selectAllLeftJoin: async (tableOneName, tableTwoName, tableOneForeignKeyName, tableTwoPrimaryKey, cols = "*") => {
        
        let tableTwoAlias;

        //If table two is passed in with a space then alias is assumed
        if(tableTwoName.split(' ').length > 1){
            tableTwoAlias = tableTwoName.split(' ')[1];
            tableTwoName = tableTwoName.split(' ')[0];
        
        }
        const results = await connection.queryAsync("SELECT ?? FROM ?? LEFT JOIN ?? ?? ON ??.??=??.??", [cols, tableOneName, tableTwoName, tableTwoAlias?tableTwoAlias:tableTwoName, tableOneName, tableOneForeignKeyName, tableTwoAlias?tableTwoAlias:tableTwoName, tableTwoPrimaryKey]);

        return results;
    },
    getAllEmployees: async () => {
        const results = await connection.queryAsync(`
        SELECT 
            employee.id AS 'employee ID', 
            CONCAT(employee.first_name, ' ', employee.last_name) AS 'full name',
            CONCAT(manager.first_name, ' ', manager.last_name) AS 'manager name',
            role.title,
            CONCAT('$',FORMAT(role.salary, 0)) AS salary,
            department.name AS department
        FROM employee
        LEFT JOIN employee manager
        ON employee.manager_id=manager.id
        LEFT JOIN role
        ON employee.role_id=role.id
        LEFT JOIN department
        ON role.department_id=department.id `);

        return removeNullVals(results);
    },
    getAllDepartments: async () => {
        const results = await connection.queryAsync(`
        SELECT 
        *
        FROM department`);
        
        return removeNullVals(results);
    },
    getAllRoles: async () => {
        const results = await connection.queryAsync(`
        SELECT 
            role.id,
            role.title,
            CONCAT('$',FORMAT(role.salary, 0)) AS salary,
            department.name AS department
        FROM role
        LEFT JOIN department
        ON role.department_id=department.id
        ORDER BY role.salary DESC
        `);

        return removeNullVals(results);
    },
    getEmployeesByManager: async (id) => {
        const results = await connection.queryAsync(`
    SELECT 
        employee.id AS 'employee ID', 
        CONCAT(employee.first_name, ' ', employee.last_name) AS 'full name',
        role.title,
        CONCAT('$',FORMAT(role.salary, 0)) AS salary,
        department.name AS department,
        CONCAT(manager.first_name, ' ', manager.last_name) AS 'manager name'
    FROM employee
    LEFT JOIN employee manager
    ON employee.manager_id=manager.id
    LEFT JOIN role
    ON employee.role_id=role.id
    LEFT JOIN department
    ON role.department_id=department.id
    WHERE employee.manager_id=?`, id);

        return results;
    },
    getEmployeesByUnderlingCountName: async (name) => {
        const results = await connection.queryAsync(`
        SELECT
            employee.id,
            CONCAT(employee.first_name, " ", employee.last_name) AS employee_name,
            managers.underling_count
        FROM employee
        LEFT JOIN (
            SELECT 
                employee.manager_id AS employee_id, 
                CONCAT(manager.first_name, " ", manager.last_name) AS manager_name,
                COUNT(*) AS underling_count    
            FROM employee
            INNER JOIN employee manager 
            ON manager.id=employee.manager_id
            GROUP BY employee.manager_id) managers
        ON employee.id = managers.employee_id
        WHERE managers.underling_count > 0
        HAVING employee_name
        LIKE ?
        ORDER BY underling_count DESC;`, `%${name}%`);

        return results;

    },
    getOneEmployeeByUnderlingCount: async (id) => {
        const results = await connection.queryAsync(`
        SELECT
            employee.id,
            CONCAT(employee.first_name, " ", employee.last_name) AS employee_name,
            managers.underling_count
        FROM employee
        LEFT JOIN (
            SELECT 
                employee.manager_id AS employee_id, 
                CONCAT(manager.first_name, " ", manager.last_name) AS manager_name,
                COUNT(*) AS underling_count    
            FROM employee
            INNER JOIN employee manager 
            ON manager.id=employee.manager_id
            GROUP BY employee.manager_id) managers
        ON employee.id = managers.employee_id
        WHERE employee.id=?
        ORDER BY underling_count DESC;`, id);

        return results;

    },
    getDepartmentSummary: async (id) => {
        const results = await connection.queryAsync(`
    SELECT 
        employee.id AS 'employee ID', 
        CONCAT(employee.first_name, ' ', employee.last_name) AS 'full name',
        role.title,
        CONCAT('$',FORMAT(role.salary, 0)) AS salary,
        CONCAT(manager.first_name, ' ', manager.last_name) AS 'manager name',
        department.name AS department
    FROM employee
    LEFT JOIN employee manager
    ON employee.manager_id=manager.id
    LEFT JOIN role
    ON employee.role_id=role.id
    LEFT JOIN department
    ON role.department_id=department.id
    WHERE department.id=?`, id);

    return removeNullVals(results);

    },
    getDepartmentSalarySum: async (id) => {
        const results = connection.queryAsync(`
    SELECT 
        department.name AS department_name,
        CONCAT('$',FORMAT(SUM(role.salary),0)) AS salary_sum
    FROM employee
    LEFT JOIN employee manager
    ON employee.manager_id=manager.id
    LEFT JOIN role
    ON employee.role_id=role.id
    LEFT JOIN department
    ON role.department_id=department.id
    WHERE department.id=?;`, id);

    return results;
    }

}