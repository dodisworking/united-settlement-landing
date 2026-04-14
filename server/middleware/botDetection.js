/**
 * botDetection.js - Multi-layer bot detection middleware
 * Checks honeypot, timing, and behavioral signals
 */

module.exports = function botDetection(req, res, next) {
  const data = req.body;

  // Layer 1: Honeypot check
  // The hidden "website" field should always be empty - bots fill it
  if (data.website) {
    console.log(`[BOT] ${new Date().toISOString()} | Honeypot triggered | IP: ${req.ip}`);
    // Return success to not alert the bot
    return res.json({ success: true, message: 'Thank you!' });
  }

  // Layer 2: Timing check
  // If form was submitted less than 3 seconds after page load, likely a bot
  const behavior = data.behavior || {};
  if (behavior.timeOnPage && behavior.timeOnPage < 3000) {
    console.log(`[BOT] ${new Date().toISOString()} | Too fast (${behavior.timeOnPage}ms) | IP: ${req.ip}`);
    return res.json({ success: true, message: 'Thank you!' });
  }

  // Layer 3: Behavioral signals
  // If no mouse, no keyboard, no touch, and no scroll - suspicious
  if (behavior.mouseMovements !== undefined) {
    const hasHumanSignals =
      behavior.mouseMovements > 0 ||
      behavior.keystrokes > 0 ||
      behavior.touchEvents > 0 ||
      behavior.scrolled;

    if (!hasHumanSignals && behavior.timeOnPage > 5000) {
      console.log(`[BOT] ${new Date().toISOString()} | No human signals | IP: ${req.ip}`);
      return res.json({ success: true, message: 'Thank you!' });
    }
  }

  // Remove behavior data before passing to proxy (not needed downstream)
  delete req.body.behavior;
  delete req.body.website;

  next();
};
