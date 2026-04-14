const express = require('express');
const router = express.Router();
const rateLimiter = require('../middleware/rateLimiter');
const botDetection = require('../middleware/botDetection');
const validateInput = require('../middleware/validateInput');
const formProxy = require('../services/formProxy');

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Form submission endpoint
router.post('/submit',
  rateLimiter,
  botDetection,
  validateInput,
  async (req, res) => {
    try {
      const result = await formProxy.submit(req.body);

      if (result.success) {
        console.log(`[LEAD] ${new Date().toISOString()} | State: ${req.body.state} | Debt: $${req.body.lamount * 1000} | CallTime: ${req.body.calltime}`);
        res.json({ success: true, message: 'Your consultation request has been submitted!' });
      } else {
        console.error(`[PROXY ERROR] ${new Date().toISOString()} | ${result.error}`);
        res.status(502).json({
          success: false,
          message: 'We couldn\'t process your request right now. Please call us directly at (516) 231-9239.'
        });
      }
    } catch (err) {
      console.error(`[SERVER ERROR] ${new Date().toISOString()} | ${err.message}`);
      res.status(500).json({
        success: false,
        message: 'Something went wrong. Please call us directly at (516) 231-9239.'
      });
    }
  }
);

module.exports = router;
