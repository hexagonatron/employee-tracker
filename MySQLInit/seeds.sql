USE employeedb;

INSERT IGNORE INTO department (id, name) VALUES 
    (1, "Human Resources"), 
    (2, "Engineering"), 
    (3, "Management"), 
    (4, "Services"), 
    (5, "Product Development");

INSERT IGNORE INTO role (id, title, salary, department_id) VALUES 
    (1, "CEO", 2000000, 3),
    (2, "CTO", 1000000, 3),
    (3, "CFO", 1000000, 3),
    (4, "HR Manager", 100000, 1),
    (5, "Engineering Manager", 100000, 2),
    (6, "Facilities Manager", 100000, 4),
    (7, "Product Manager", 100000, 5),
    (8, "Programmer", 50000, 2),
    (9, "Tester", 60000, 2),
    (10, "COO", 250000, 3);

INSERT IGNORE INTO employee (id, first_name, last_name, role_id, manager_id) VALUES
    (1, "Homer", "Iliad", 1, null),
    (2, "Victor", "Hugo", 2, 1),
    (3, "Marcus", "Aurelius", 3, 1),
    (4, "James", "Joyce", 10, 1),
    (5, "Scott", "Fitzgerald", 4, 4),
    (6, "Ernest", "Hemmingway", 5, 4),
    (7, "David Foster", "Wallace", 6, 4),
    (8, "Raymond", "Chandler", 7, 4),
    (9, "Kurt", "Vonnegut", 8, 6),
    (10, "Philip K.", "Dick", 8, 6),
    (11, "Cormac", "McCarthy", 9, 6),
    (12, "John R R", "Tolkein", 9, null);
