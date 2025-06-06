require("dotenv").config();
const { Client } = require("pg");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid"); 

// Database connection configuration
const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5235,
});

const users = [
  {
    userid: uuidv4(),
    firstname: "Chrissy",
    lastname: "Smith",
    emailaddress: "chrissy@example.com",
    password: "pass22",
    role: "Admin",
    eligibleshifts: null
  },
  {
    userid: uuidv4(),
    firstname: "Lewis",
    lastname: "Luwi",
    emailaddress: "lewis@example.com",
    password: "Loui000",
    role: "Admin",
    eligibleshifts: JSON.stringify(["morning", "afternoon"])
  },
  {
    userid: uuidv4(),
    firstname: "Vanessa",
    lastname: "Doe",
    emailaddress: "vanessa@example.com",
    password: "pass123",
    role: "Agent",
    eligibleshifts: null
  },
];

// Function to seed the database
const seedUsers = async () => {
  try {
    await client.connect();
    console.log("Connected to the database");

    // Deleting existing users (Prevent duplicates)
    await client.query("DELETE FROM users");
    console.log("Existing users cleared");

    // Insert each user into the database
    for (const user of users) {
      // Hash the password
      const hashedPassword = await bcrypt.hash(user.password, 12);

      const query = `
        INSERT INTO users (
          userid, firstname, lastname, emailaddress,
          passwordhash, role, eligibleshifts, createddate, updateddate
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      `;
      const values = [
        user.userid,
        user.firstname,
        user.lastname,
        user.emailaddress,
        hashedPassword,
        user.role,
        user.eligibleshifts
      ];

      await client.query(query, values);
      console.log(`Inserted user: ${user.firstname} ${user.lastname}`);
    }

    console.log("3 users seeded successfully!");
  } catch (error) {
    console.error("Seeding failed:", error.message);
    if (error.code === "23505") {
      console.log("Error: One of the emails already exists");
    }
  } finally {
    await client.end();
    console.log("Disconnected from the database");
  }
};

// Run the seed function
seedUsers();