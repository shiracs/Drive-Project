const express = require('express');
const router = express.Router();

// dummy endpoint to check server is running
router.get('/status', (req, res) => {
    res.json({ status: '200' });
});

module.exports = router;