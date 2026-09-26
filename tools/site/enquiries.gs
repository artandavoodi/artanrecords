/** Artan Records enquiry service. Configuration and secrets live in Script Properties. */
function config_() {
  const p = PropertiesService.getScriptProperties();
  const config = JSON.parse(p.getProperty('INTAKE_CONFIG') || '{}');
  config.secret = p.getProperty('RECAPTCHA_SECRET');
  config.spreadsheet = p.getProperty('SPREADSHEET_ID');
  if (!config.secret || !config.spreadsheet || !config.fields || !config.email) throw new Error('Service not configured');
  return config;
}

function validate_(parameters, fields) {
  const result = {};
  if (parameters.processing_acknowledgement !== 'yes') throw new Error('Acknowledgment required');
  for (const field of fields) {
    const value = String(parameters[field.name] || '').trim();
    if ((field.required && !value) || value.length > (field.maxLength || 200)) throw new Error('Invalid field');
    if (field.type === 'email' && value && !/^[^\s@<>\r\n]+@[^\s@<>\r\n]+\.[^\s@<>\r\n]+$/.test(value)) throw new Error('Invalid email');
    if (field.type === 'url' && value && !/^https?:\/\/[^\s<>]+$/i.test(value)) throw new Error('Invalid link');
    if (field.type === 'select' && !field.options.includes(value)) throw new Error('Invalid selection');
    if (/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(value)) throw new Error('Invalid characters');
    result[field.name] = value;
  }
  return result;
}

function safeCell_(value) {
  const text = String(value);
  return /^[\s]*[=+@-]/.test(text) ? "'" + text : text;
}

function digest_(text) {
  return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text));
}

function response_(message) {
  // No applicant content is echoed into the response document.
  return HtmlService.createHtmlOutput('<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Artan Records</title></head><body><main><h1>Artan Records</h1><p>' + message + '</p><a target="_top" href="https://artanrecords.com/for-artists/">Return to Artan Records</a></main></body></html>');
}

function doGet() {
  return response_('Please send your enquiry through our artist form.');
}

function doPost(event) {
  let lock;
  let saved = false;
  try {
    if (!event || event.contentLength > 40000 || !event.parameter) throw new Error('Invalid request');
    const config = config_();
    const data = validate_(event.parameter, config.fields);
    const token = event.parameter['g-recaptcha-response'];
    if (!token || token.length > 10000) throw new Error('CAPTCHA required');
    const verification = UrlFetchApp.fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'post', payload: {secret: config.secret, response: token}, muteHttpExceptions: true
    });
    if (verification.getResponseCode() !== 200) throw new Error('Verification unavailable');
    const captcha = JSON.parse(verification.getContentText());
    if (captcha.success !== true || !['artanrecords.com', 'www.artanrecords.com'].includes(captcha.hostname)) throw new Error('CAPTCHA invalid');
    lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) throw new Error('Service busy');
    const book = SpreadsheetApp.openById(config.spreadsheet);
    let sheet = book.getSheetByName('Enquiries');
    if (!sheet) {
      sheet = book.insertSheet('Enquiries');
      sheet.appendRow(['Received UTC', 'Reference', ...config.fields.map(f => f.label), 'Acknowledged', 'Review status', 'Notification']);
      sheet.setFrozenRows(1);
    }
    const now = new Date();
    const reference = Utilities.getUuid();
    const cache = CacheService.getScriptCache();
    const emailKey = 'email-' + digest_(data.email.toLowerCase());
    if (cache.get(emailKey)) throw new Error('Please wait before sending another enquiry');
    const today = now.toISOString().slice(0, 10);
    const properties = PropertiesService.getScriptProperties();
    const usage = JSON.parse(properties.getProperty('DAILY_USAGE') || '{}');
    const count = usage.date === today ? Number(usage.count) : 0;
    if (count >= 80) throw new Error('Daily capacity reached');
    const values = config.fields.map(f => safeCell_(data[f.name]));
    sheet.appendRow([now.toISOString(), reference, ...values, 'yes', 'New', 'Pending']);
    SpreadsheetApp.flush();
    saved = true;
    cache.put(emailKey, '1', 600);
    properties.setProperty('DAILY_USAGE', JSON.stringify({date: today, count: count + 1}));
    const row = sheet.getLastRow();
    const notificationColumn = config.fields.length + 5;
    try {
      MailApp.sendEmail({
        to: config.email, replyTo: data.email, name: 'Artan Records',
        subject: config.subject,
        body: 'Reference: ' + reference + '\n\n' + config.fields.map(f => f.label + ':\n' + data[f.name]).join('\n\n') + '\n\nAcknowledgment: yes\nSubmitted links are unverified. Do not open unexpected downloads.'
      });
      sheet.getRange(row, notificationColumn).setValue('Sent');
    } catch (error) {
      sheet.getRange(row, notificationColumn).setValue('Failed - review spreadsheet');
    }
    return response_('Your enquiry has been received. Thank you for sharing your work.');
  } catch (error) {
    return response_(saved ? 'Your enquiry has been saved. Please do not submit it again.' : 'Your enquiry was not saved. Please return to the form and check your details and CAPTCHA, or contact collaborate@artanrecords.com.');
  } finally {
    if (lock && lock.hasLock()) lock.releaseLock();
  }
}
