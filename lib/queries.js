const connection = require("./db");

module.exports = {
    addNewEmployeeAndUpdate: async (employee) => {
        const results = await connection.queryAsync("INSERT INTO employee SET ?", employee);
        await connection.queryAsync("UPDATE employee SET manager_id=? WHERE id=?", [results.insertId, results.insertId]);

        console.log(`Successfully added ${employee.first_name} ${employee.last_name} into database. Their employee ID is ${results.insertId}`);
    },

    addNewEmployee: async (employee) => {
        const results = await connection.queryAsync("INSERT INTO employee SET ?", employee);

        console.log(`Successfully added ${employee.first_name} ${employee.last_name} into database. Their employee ID is ${results.insertId}`);
    }


}