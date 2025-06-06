const pool = require("../config/db");

const createOvertimeRequest = async (fullName, employeeId, jobTitle, date, startTime, endTime, reason) => {
  const query = `
    INSERT INTO overtime_requests (full_name, employee_id, job_title, date, start_time, end_time, reason, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'Pending')
    RETURNING *;
  `;
  const values = [fullName, employeeId, jobTitle, date, startTime, endTime, reason];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error("Error creating overtime request in database:", error);
    throw error;
  }
};

const getOvertimeRequests = async (employeeId) => {
  const query = `
    SELECT * FROM overtime_requests
    WHERE employee_id = $1;
  `;
  const values = [employeeId];

  try {
    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error("Error fetching overtime requests from database:", error);
    throw error;
  }
};

module.exports = {
  createOvertimeRequest,
  getOvertimeRequests,
};