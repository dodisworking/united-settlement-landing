/**
 * formProxy.js - Proxies form submissions to United Settlement's PHP endpoint
 * Maps our simplified form data to their full payload format
 */

const ENDPOINT = process.env.UNITED_SETTLEMENT_ENDPOINT || 'https://unitedsettlement.com/sendmail-apply-for-debt-relief-v3-grp.php';
const PAGE_URL = process.env.UNITED_SETTLEMENT_PAGE || 'https://unitedsettlement.com/will-debt-relief-help-you-grp';

/**
 * Build the full payload that United Settlement's endpoint expects
 */
function buildPayload(data) {
  const calltimeLabels = {
    now: 'Now',
    '1hour': '1Hr',
    '2hours': '2Hr',
    tomorrow: 'Tomorrow',
    asap: 'ASAP',
    morning: 'Morning',
    afternoon: 'Afternoon',
    evening: 'Evening'
  };

  let calltimeLabel;
  if (data.calltime && data.calltime.startsWith('pick:')) {
    calltimeLabel = data.calltime.replace('pick:', '');
  } else {
    calltimeLabel = calltimeLabels[data.calltime] || 'Now';
  }

  return {
    // Real data from our form
    fname: data.fname,
    lname: 'Callback-' + calltimeLabel,  // Signals this is a callback request + preferred time
    email: data.email,
    phone: data.phone,
    ustate: data.state,
    lamount: String(data.lamount),

    // Dummy data for fields we don't collect
    address: 'Callback Request',
    city: 'Callback',
    zip: '00000',
    dob: '01/01/1970',
    ssn: '000000000',

    // System fields
    pripolicy: '1',
    usersip: data.userip || '0.0.0.0',
    pageurl: PAGE_URL,
    isSendEmail: '1',
    lamountef: String((data.lamount || 15) * 1000),

    // UTM / tracking passthrough
    utmid: data.utmid || '',
    utmsource: data.utmsource || '',
    utmmedium: data.utmmedium || '',
    utmcampaign: data.utmcampaign || '',
    utmcontent: data.utmcontent || '',
    utmterm: data.utmterm || '',
    sidcamid: data.sidcamid || '',
    sourceid: data.sourceid || '',
    subidone: data.subidone || '',
    subidtwo: data.subidtwo || '',
    subidthree: data.subidthree || '',
    subidfour: data.subidfour || '',
    adsclick: data.gclid || ''
  };
}

/**
 * URL-encode a payload object
 */
function encodePayload(payload) {
  return Object.keys(payload)
    .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(payload[key]))
    .join('&');
}

/**
 * Submit the form data to United Settlement's endpoint
 */
async function submit(data) {
  const payload = buildPayload(data);
  const body = encodePayload(payload);

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': PAGE_URL,
        'Origin': 'https://unitedsettlement.com',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
      },
      redirect: 'follow'
    });

    const responseText = await response.text();

    // Try to parse as JSON (their endpoint may return JSON)
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    if (response.ok) {
      return { success: true, data: responseData };
    } else {
      return {
        success: false,
        error: `HTTP ${response.status}: ${responseText.substring(0, 200)}`
      };
    }
  } catch (err) {
    return {
      success: false,
      error: `Network error: ${err.message}`
    };
  }
}

module.exports = { submit, buildPayload };
