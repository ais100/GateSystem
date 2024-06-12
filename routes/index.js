const express = require("express");
const router = express.Router();
const dbConnection = require("../config/database");

router.get("/poll", (req, res) => {
  const query = `
    SELECT ld.*, uv.user_id, uv.user_name, uv.email, uv.card_id, uv.expiry_date, uv.foto, d.department_name, 
           (SELECT department_name FROM departments 
            WHERE department_id = LEFT(d.department_id, 12) LIMIT 1) AS parent_department_name
    FROM log_doors ld
    LEFT JOIN user_visitors uv ON ld.user_visitor_id = uv.id
    LEFT JOIN departments d ON uv.department_id = d.id
    WHERE ld.id > ? AND ld.door_id = 5
    ORDER BY ld.id ASC
  `;
  dbConnection.query(query, [lastInsertedId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    results.forEach((result) => {
      if (!result.user_visitor_id) {
        result.invalidCard = true;
      }
    });

    if (results.length > 0) {
      lastInsertedId = results[results.length - 1].id;
      res.json(results);
    } else {
      res.json([]);
    }
  });
});

module.exports = router;
