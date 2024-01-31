const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { Pool } = require("pg");
const crypto = require("crypto");

const app = express();
const port = 3001;

app.use(bodyParser.json());
app.use(cors());
const secretKey = "g3stor@D3sp3s@s*";

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL + "?sslmode=require",
});

// const pool = new Pool({
//   user: "postgres",
//   host: "localhost",
//   database: "postgres",
//   password: "1234",
//   port: 5432,
// });

// Store refresh tokens securely (e.g., in a database)
const refreshTokens = {};

// User Authentication Middleware
const authenticateToken = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token || !token.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const authToken = token.slice(7); // Remove 'Bearer ' from the token string

  jwt.verify(authToken, secretKey, (err, user) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ error: "Token expired" });
      } else {
        console.error("Token verification error:", err);
        return res.status(403).json({ error: "Forbidden" });
      }
    }
    req.user = user;
    next();
  });
};

// Generate Refresh Token during Sign-in
const generateRefreshToken = () => {
  const refreshBuffer = new Uint8Array(64);
  crypto.getRandomValues(refreshBuffer);
  return Array.from(refreshBuffer, (byte) => byte.toString(16)).join("");
};

// Sign-in endpoint
app.post("/api/auth/signin", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Fetch user data from the database based on the provided username
    const result = await pool.query(
      "SELECT id, username, password_hash FROM users WHERE username = $1",
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const user = result.rows[0];

    // Compare the provided password with the hashed password stored in the database
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Create and send a JWT token upon successful sign-in
    // Create and send a JWT token and refresh token upon successful sign-in
    const token = jwt.sign({ userId: user.id }, secretKey, { expiresIn: "1h" });
    const refreshToken = generateRefreshToken();
    refreshTokens[username] = refreshToken;

    res.json({ token, refreshToken, user });
  } catch (error) {
    console.error("Sign-in error", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// SignUp endpoint
app.post("/api/auth/signup", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if the username is already taken
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "Username is already taken" });
    }

    // Hash the password before storing it in the database
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user into the database
    const result = await pool.query(
      "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING *",
      [username, hashedPassword]
    );

    const newUser = result.rows[0];

    // Create and send a JWT token and refresh token upon successful sign-in
    // Create and send a JWT token and refresh token upon successful sign-up
    const token = jwt.sign({ userId: newUser.id }, secretKey, {
      expiresIn: "1h",
    });
    const refreshToken = generateRefreshToken();
    refreshTokens[username] = refreshToken;

    res.json({ token, refreshToken, user: newUser });
  } catch (error) {
    console.error("Sign-up error", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Refresh Token endpoint
app.post("/api/auth/refresh", async (req, res) => {
  const { refreshToken } = req.body;

  // Check if the refresh token is valid
  if (!refreshTokens[refreshToken]) {
    return res.status(403).json({ error: "Invalid refresh token" });
  }

  // Assume the user is identified by the username stored in the refresh token
  const username = refreshTokens[refreshToken];

  // Generate a new access token
  const newAccessToken = jwt.sign({ userId: user.id }, secretKey, {
    expiresIn: "5h",
  });

  // Send the new access token to the client
  res.json({ token: newAccessToken });

  // You might want to remove the old refresh token to prevent multiple use
  delete refreshTokens[refreshToken];
});

// Get all incomes for the authenticated user
app.get("/api/incomes", authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      "SELECT * FROM incomes WHERE user_id = $1",
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching incomes", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Create a new income for the authenticated user
app.post("/api/incomes", authenticateToken, async (req, res) => {
  const { amount, category, date, reference, title } = req.body;
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      "INSERT INTO incomes (amount, category, date, reference, title, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [amount, category, date, reference, title, userId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error creating income", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete an income for the authenticated user
app.delete("/api/incomes/:id", authenticateToken, async (req, res) => {
  const incomeId = req.params.id;
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      "DELETE FROM incomes WHERE id = $1 AND user_id = $2 RETURNING *",
      [incomeId, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Income not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error deleting income", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get all expenses for the authenticated user
app.get("/api/expenses", authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      "SELECT * FROM expenses WHERE user_id = $1",
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching expenses", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Create a new expense for the authenticated user
app.post("/api/expenses", authenticateToken, async (req, res) => {
  const { amount, category, date, reference, title } = req.body;
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      "INSERT INTO expenses (amount, category, date, reference, title, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [amount, category, date, reference, title, userId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error creating expense", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete an expense for the authenticated user
app.delete("/api/expenses/:id", authenticateToken, async (req, res) => {
  const expenseId = req.params.id;
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      "DELETE FROM expenses WHERE id = $1 AND user_id = $2 RETURNING *",
      [expenseId, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error deleting expense", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Other CRUD operations for expenses

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
