const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3001;

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "gestordespesa",
  password: "1234",
  port: 5432,
});
//5433

app.use(express.json());
app.use(cors());

// Get all incomes
app.get("/api/incomes", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM incomes");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching incomes", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Create a new income
app.post("/api/incomes", async (req, res) => {
  const { amount, category, date, reference, title, userId } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO incomes (amount, category, date, reference, title, userId) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [amount, category, date, reference, title, userId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error creating income", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete an expense
app.delete("/api/incomes/:id", async (req, res) => {
  const incomeId = req.params.id;
  try {
    const result = await pool.query(
      "DELETE FROM incomes WHERE id = $1 RETURNING *",
      [incomeId]
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

// Get all expenses
app.get("/api/expenses", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM expenses");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching expenses", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Create a new expense
app.post("/api/expenses", async (req, res) => {
  const { amount, category, date, reference, title, userId } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO expenses (amount, category, date, reference, title, userId) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [amount, category, date, reference, title, userId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error creating expense", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete an expense
app.delete("/api/expenses/:id", async (req, res) => {
  const expenseId = req.params.id;
  try {
    const result = await pool.query(
      "DELETE FROM expenses WHERE id = $1 RETURNING *",
      [expenseId]
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

// Create and send a JWT token and refresh token upon successful sign-in
const token = jwt.sign({ userId: user.id }, secretKey, { expiresIn: "5h" });
const refreshToken = generateRefreshToken();
refreshTokens[username] = refreshToken;

res.json({ token, refreshToken, user });

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

// CREATE TABLE users (
//   id SERIAL PRIMARY KEY,
//   username VARCHAR(50) UNIQUE NOT NULL,
//   password_hash VARCHAR(255) NOT NULL
// );

// -- Add user_id to incomes table
// ALTER TABLE incomes
// ADD COLUMN user_id INTEGER REFERENCES users(id);

// -- Add user_id to expenses table
// ALTER TABLE expenses
// ADD COLUMN user_id INTEGER REFERENCES users(id);

// -- Insert new data into the incomes table with date in 'YYYY-MM-DD' format
// INSERT INTO incomes (amount, category, date, reference, title, user_id)
// VALUES
//  (1200, 'Salário', '2023-12-22', 'Mês de Janeiro', 'Salário', 1),
//  (1000, 'Bônus', '2023-12-27', 'Oferta de desempenho', 'Bônus', 1);

// -- Insert new data into the expenses table with date in 'YYYY-MM-DD' format
// INSERT INTO expenses (amount, category, date, reference, title, user_id)
// VALUES
// (200, 'Alimentação', '2023-12-22', 'Comida de casa', 'Weekly Groceries', 1),
// (150, 'Serviços Públicos', '2023-12-27', 'Pagamento a ENDE', 'Electricity Bill', 1);

// INSERT INTO incomes (amount, category, date, reference, title, user_id)
// VALUES
//  (400, 'Outras Receitas', '2023-12-15', 'Oferta de Natal', 'Presente de Natal', 2),
//  (100, 'Presentes', '2023-12-05', 'Tio Smith', 'Oferta', 2);

// -- Insert new data into the expenses table with date in 'YYYY-MM-DD' format
// INSERT INTO expenses (amount, category, date, reference, title, user_id)
// VALUES
// (50, 'Alimentação', '2023-12-15', 'Lanches da fau', 'Lanche', 2),
// (70, 'Lazer', '2023-12-05', 'Cinema com as amigas', 'Cinema', 2);

// -- Create the database
// CREATE DATABASE your_database_name;

// -- Disconnect from the current database to avoid being inside a transaction
// \c;

// -- Connect to the new database
// \c your_database_name;

// -- Create the incomes table
// CREATE TABLE incomes (
//     id SERIAL PRIMARY KEY,
//     amount NUMERIC NOT NULL,
//     category VARCHAR(255),
//     date DATE, -- Change to DATE type
//     reference VARCHAR(255),
//     title VARCHAR(255),
//     userId VARCHAR(255)
// );

// -- Create the expenses table (similar to incomes)
// CREATE TABLE expenses (
//     id SERIAL PRIMARY KEY,
//     amount NUMERIC NOT NULL,
//     category VARCHAR(255),
//     date DATE, -- Change to DATE type
//     reference VARCHAR(255),
//     title VARCHAR(255),
//     userId VARCHAR(255)
// );
