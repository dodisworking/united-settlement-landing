const express = require('express');
const router = express.Router();
const rateLimiter = require('../middleware/rateLimiter');
const botDetection = require('../middleware/botDetection');
const validateInput = require('../middleware/validateInput');
const formProxy = require('../services/formProxy');
const { submitViaBot } = require('../services/botSubmitter');
const { enqueue, getStats } = require('../services/leadQueue');

// Submission strategy:
//   primary  — Playwright bot walks the live unitedsettlement.com form
//   fallback — direct PHP-endpoint POST (formProxy)
// USE_BOT defaults to 'true'; set USE_BOT=false to disable bot and use proxy only.
const USE_BOT = (process.env.USE_BOT || 'true').toLowerCase() !== 'false';

// Health check
router.get('/health', async (req, res) => {
  let queueStats = null;
  try { queueStats = await getStats(); } catch (_) {}
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    bot: { enabled: USE_BOT, queue: queueStats }
  });
});

/**
 * Run the bot in the background and log the result. If the bot fails at any
 * step, fall back to the PHP proxy so the lead is never lost.
 */
function processLeadInBackground(lead) {
  const ts = () => new Date().toISOString();
  const tag = `${lead.fname} ${lead.lname} | ${lead.state} | $${lead.lamount * 1000}`;

  enqueue(async () => {
    if (USE_BOT) {
      console.log(`[BOT START] ${ts()} | ${tag}`);
      const r = await submitViaBot(lead);
      if (r.success) {
        console.log(`[BOT OK] ${ts()} | ${tag} | step=${r.step} | http=${r.httpStatus} | ${r.durationMs}ms`);
        return r;
      }
      console.error(`[BOT FAIL] ${ts()} | ${tag} | step=${r.step} | ${r.error} | ${r.durationMs}ms — falling back to proxy`);
    }
    // Proxy fallback (or primary if USE_BOT=false)
    const proxyResult = await formProxy.submit(lead);
    if (proxyResult.success) {
      console.log(`[PROXY OK] ${ts()} | ${tag}`);
    } else {
      console.error(`[PROXY FAIL] ${ts()} | ${tag} | ${proxyResult.error}`);
    }
    return proxyResult;
  }).catch((err) => {
    console.error(`[QUEUE ERROR] ${ts()} | ${tag} | ${err.message}`);
  });
}

// Form submission endpoint
router.post('/submit',
  rateLimiter,
  botDetection,
  validateInput,
  async (req, res) => {
    try {
      // Snapshot the validated lead so we can hand it to the background worker.
      // (req.body is mutated by middleware; we want the cleaned values.)
      const lead = {
        fname: req.body.fname,
        lname: req.body.lname,
        email: req.body.email,
        phone: req.body.phone,
        dob: req.body.dob,
        state: req.body.state,
        lamount: req.body.lamount,
        calltime: req.body.calltime,
        userip: req.body.userip || req.ip,
        // UTM/tracking passthrough (proxy fallback uses these)
        utmid: req.body.utmid, utmsource: req.body.utmsource,
        utmmedium: req.body.utmmedium, utmcampaign: req.body.utmcampaign,
        utmcontent: req.body.utmcontent, utmterm: req.body.utmterm,
        sidcamid: req.body.sidcamid, sourceid: req.body.sourceid,
        subidone: req.body.subidone, subidtwo: req.body.subidtwo,
        subidthree: req.body.subidthree, subidfour: req.body.subidfour,
        gclid: req.body.gclid
      };

      // Acknowledge to the user immediately. Bot/proxy work happens async in
      // the queue — bot can take 15-30s and we don't want the user waiting.
      console.log(`[LEAD QUEUED] ${new Date().toISOString()} | ${lead.fname} ${lead.lname} | ${lead.state} | $${lead.lamount * 1000} | CallTime: ${lead.calltime}`);
      processLeadInBackground(lead);

      res.json({
        success: true,
        message: 'Your consultation request has been submitted!'
      });
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
