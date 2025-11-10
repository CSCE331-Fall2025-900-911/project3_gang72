/*
 * employeeController.js
 *
 * Provides functions to read employees from the database.
 */

const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool(process.env.DATABASE_URL ? { connectionString: process.env.DATABASE_URL } : undefined);

/**
 * Fetch all employees from the `employee` table and return as an array of objects.
 * Each object: { id, firstName, lastName, password }
 */
async function getAllEmployees() {
    const client = await pool.connect();
    try {
        const query = `SELECT * FROM employee`;
        const res = await client.query(query);
        const employees = res.rows.map((r) => ({
            id: r.employee_id == null ? null : Number(r.employee_id),
            firstName: r.first_name || null,
            lastName: r.last_name || null,
            password: r.password || null,
        }));
        return employees;
    } catch (err) {
        console.error('Error fetching employees', err);
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Express handler to return employees as JSON
 */
async function getEmployeesHandler(req, res) {
    try {
        const employees = await getAllEmployees();
        res.json({ success: true, employees });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}

/**
 * Insert a new employee into the database.
 * Returns the created employee object { id, firstName, lastName, password } on success.
 * Throws on error.
 */
async function addEmployee(firstName, lastName, password) {
    const client = await pool.connect();
    try {
        const insertSql = `INSERT INTO employee (first_name, last_name, password) VALUES ($1, $2, $3) RETURNING employee_id`;
        const res = await client.query(insertSql, [firstName, lastName, password]);
        const id = res.rows[0] && res.rows[0].employee_id ? Number(res.rows[0].employee_id) : null;
        return { id, firstName, lastName, password };
    } finally {
        client.release();
    }
}

/**
 * Express handler to create an employee via POST /api/employees
 * Expects JSON body: { firstName, lastName, password }
 */
async function addEmployeeHandler(req, res) {
    try {
        const { firstName, lastName, password } = req.body || {};
        if (!firstName || !lastName) {
            return res.status(400).json({ success: false, error: 'firstName and lastName are required' });
        }
        const created = await addEmployee(firstName, lastName, password || '');
        // log to server terminal so a click triggers a visible prompt in the backend
        console.log(`New employee created: id=${created.id} firstName=${created.firstName} lastName=${created.lastName}`);
        // return the created employee object
        res.status(201).json(created);
    } catch (err) {
        console.error('Error creating employee', err);
        res.status(500).json({ success: false, error: err.message });
    }
}



module.exports = { getAllEmployees, getEmployeesHandler, addEmployee, addEmployeeHandler };
