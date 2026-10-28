/** Artanrecords enquiry service. Configuration and secrets live in Script Properties. */
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

function streamingProfiles_(raw) {
  const rows = JSON.parse(raw || '[]');
  if (!Array.isArray(rows) || rows.length > 2) throw new Error('Invalid artist profiles');
  const seen = {};
  return rows.map(function(row) {
    if (!row || !['apple','spotify'].includes(row.provider) || seen[row.provider] || typeof row.name !== 'string' || !row.name.trim() || row.name.length > 200) throw new Error('Invalid artist profile');
    seen[row.provider] = true;
    const id = String(row.id);
    const pattern = row.provider === 'spotify' ? /^[A-Za-z0-9]{22}$/ : /^\d{1,20}$/;
    if (!pattern.test(id) || typeof row.url !== 'string') throw new Error('Invalid artist identity');
    const link = row.provider === 'spotify' ? new RegExp('^https://open\\.spotify\\.com/artist/' + id + '/?(?:\\?[^\\s<>]*)?$') : new RegExp('^https://music\\.apple\\.com/(?:[a-z]{2}/)?artist/(?:[^/?#]+/)?' + id + '/?(?:\\?[^\\s<>]*)?$');
    if (!link.test(row.url)) throw new Error('Invalid profile link');
    return {provider:row.provider, id:id, name:row.name.trim(), url:row.url.split('?')[0]};
  });
}

/** Server-to-server only. A browser must never receive the bridge credential. */
function controlInbox_(body) {
  const properties = PropertiesService.getScriptProperties();
  const endpoint = properties.getProperty('CONTROL_INBOX_URL');
  const secret = properties.getProperty('CONTROL_INBOX_SECRET');
  if (endpoint !== 'https://hahtbepdrjkjluhespbs.supabase.co/functions/v1/enquiry-inbox' || !secret || secret.length < 32) throw new Error('Control inbox not connected');
  const text = JSON.stringify(body), timestamp = String(Date.now());
  const signature = Utilities.computeHmacSha256Signature(timestamp + '.' + text, secret, Utilities.Charset.UTF_8).map(function(byte) {return ((byte + 256) % 256).toString(16).padStart(2,'0');}).join('');
  const result = UrlFetchApp.fetch(endpoint, {method:'post',contentType:'application/json; charset=utf-8',payload:text,headers:{'x-artan-timestamp':timestamp,'x-artan-signature':signature},muteHttpExceptions:true});
  if (result.getResponseCode() !== 200) throw new Error('Control inbox handoff failed (HTTP ' + result.getResponseCode() + ')');
  return JSON.parse(result.getContentText());
}

function enquiryColumn_(sheet, label) {
  const headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
  const index = headers.indexOf(label);
  if (index >= 0) return index + 1;
  sheet.getRange(1,headers.length + 1).setValue(label);
  return headers.length + 1;
}

/** Owner-run retry; idempotent references never create duplicate applications. */
function syncControlInbox() {
  const properties = PropertiesService.getScriptProperties();
  if (!properties.getProperty('RETENTION_OWNER_EMAIL') || Session.getEffectiveUser().getEmail().toLowerCase() !== properties.getProperty('RETENTION_OWNER_EMAIL').toLowerCase()) throw new Error('Owner authorization required');
  const config = config_(), sheet = SpreadsheetApp.openById(config.spreadsheet).getSheetByName('Enquiries');
  if (!sheet || sheet.getLastRow() < 2) return;
  const lock = LockService.getScriptLock();if (!lock.tryLock(10000)) throw new Error('Service busy');
  try {
    const delivery = enquiryColumn_(sheet,'Control inbox'), profiles = enquiryColumn_(sheet,'Streaming profiles');
    const rows = sheet.getDataRange().getValues(), headers = rows.shift();let count = 0;
    for (let i = 0; i < rows.length && count < 25; i++) {
      if (rows[i][delivery-1] !== 'Pending') continue;
      const data = {};for (const field of config.fields) {const index = headers.indexOf(field.label);if(index < 0) throw new Error('Review sheet headers before retrying');const value = String(rows[i][index] || '');data[field.name] = /^'[\s]*[=+@-]/.test(value) ? value.slice(1) : value;}
      controlInbox_({reference:String(rows[i][headers.indexOf('Reference')]),data:data,profiles:streamingProfiles_(rows[i][profiles-1] || '[]')});
      sheet.getRange(i+2,delivery).setValue('Synced');count++;
    }
    const reviewColumn = enquiryColumn_(sheet,'Review status'), closedColumn = enquiryColumn_(sheet,'Closed UTC');
    const synced = rows.map(function(row,index) {return {id:String(row[headers.indexOf('Reference')]),row:index+2,ready:row[delivery-1] === 'Synced'};}).filter(function(row) {return row.ready && /^[0-9a-f-]{36}$/.test(row.id);});
    for (let start = 0; start < synced.length; start += 100) {
      const batch = synced.slice(start,start+100);
      const states = controlInbox_({action:'statuses',references:batch.map(function(row) {return row.id;})});
      for (const state of states.rows || []) {
        const target = batch.find(function(row) {return row.id === state.id;});if (!target) continue;
        const names = {new:'New',under_review:'Under review',offered:'Offered',declined:'Declined',closed:'Closed'};if (!names[state.status]) continue;
        sheet.getRange(target.row,reviewColumn).setValue(names[state.status]);
        if (state.closed_at) sheet.getRange(target.row,closedColumn).setValue(state.closed_at);
      }
    }
  } finally {lock.releaseLock();}
}

function installControlInboxTrigger() {
  const owner = PropertiesService.getScriptProperties().getProperty('RETENTION_OWNER_EMAIL');
  if (!owner || Session.getActiveUser().getEmail().toLowerCase() !== owner.toLowerCase()) throw new Error('Owner authorization required');
  controlInbox_({action:'maintenance'});
  if (!ScriptApp.getProjectTriggers().some(function(trigger) {return trigger.getHandlerFunction() === 'syncControlInbox';})) ScriptApp.newTrigger('syncControlInbox').timeBased().everyMinutes(5).create();
}

/** Read-only retention review. Never deletes rows or mailbox notifications. */
function retentionCandidates_(rows, now, days) {
  if (!Number.isInteger(days) || days < 1) throw new Error('Retention period required');
  return rows.filter(function(row) {
    const closed = new Date(row.closedAt).getTime();
    return ['Declined', 'Closed'].includes(row.status) && Number.isFinite(closed)
      && closed <= now.getTime() - days * 24 * 60 * 60 * 1000;
  });
}

function retentionConfig_() {
  const config = JSON.parse(PropertiesService.getScriptProperties().getProperty('RETENTION_CONFIG') || '{}');
  if (!Number.isInteger(config.daysAfterClosure) || config.daysAfterClosure < 1
      || !Array.isArray(config.sheetNames) || config.sheetNames.some(name => !['Enquiries', 'Contact enquiries'].includes(name))) throw new Error('Approved retention configuration required');
  return config;
}

/** An installable edit trigger records actual closure; undated legacy rows are never expired. */
function recordReviewClosure_(event) {
  if (!event || !event.range) return;
  const config = retentionConfig_();
  const sheet = event.range.getSheet();
  if (!config.sheetNames.includes(sheet.getName()) || event.range.getRow() < 2) return;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const statusColumn = headers.indexOf('Review status') + 1;
  if (!statusColumn || statusColumn < event.range.getColumn() || statusColumn > event.range.getLastColumn()) return;
  let closedColumn = headers.indexOf('Closed UTC') + 1;
  if (!closedColumn) {
    closedColumn = headers.length + 1;
    sheet.getRange(1, closedColumn).setValue('Closed UTC');
  }
  for (let row = event.range.getRow(); row <= event.range.getLastRow(); row++) {
    const status = sheet.getRange(row, statusColumn).getValue();
    const closed = sheet.getRange(row, closedColumn);
    if (['Declined', 'Closed'].includes(status)) {
      if (!closed.getValue()) closed.setValue(new Date().toISOString());
    } else closed.clearContent();
  }
}

/** Remove only expired closed rows from the active sheet, not provider history or email copies. */
function removeExpiredClosedEnquiries_() {
  const config = retentionConfig_();
  const book = SpreadsheetApp.openById(config_().spreadsheet);
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) throw new Error('Enquiry service busy');
  let removed = 0;
  try {
    for (const name of config.sheetNames) {
      const sheet = book.getSheetByName(name);
      if (!sheet || sheet.getLastRow() < 2) continue;
      const values = sheet.getDataRange().getValues();
      const headers = values.shift();
      const status = headers.indexOf('Review status'), closed = headers.indexOf('Closed UTC'), reference = headers.indexOf('Reference');
      if ([status, closed, reference].some(index => index < 0)) continue;
      const rows = values.map((row, index) => ({row:index + 2, status:row[status], closedAt:row[closed], reference:row[reference]}));
      const candidates = retentionCandidates_(rows, new Date(), config.daysAfterClosure).reverse();
      for (const item of candidates) {
        const current = sheet.getRange(item.row, 1, 1, sheet.getLastColumn()).getValues()[0];
        if (current[reference] !== item.reference || !item.reference) continue;
        if (!retentionCandidates_([{status:current[status], closedAt:current[closed]}], new Date(), config.daysAfterClosure).length) continue;
        sheet.deleteRow(item.row);
        removed++;
      }
    }
  } finally { lock.releaseLock(); }
  try { controlInbox_({action:'maintenance'}); } catch (error) { /* An unconfigured inbox does not interrupt Sheet retention. */ }
  console.log('Removed expired closed enquiry rows: ' + removed);
}

/** Owner-run setup only. No trigger is installed by a public enquiry or a normal deployment. */
function installRetentionTriggers() {
  const owner = PropertiesService.getScriptProperties().getProperty('RETENTION_OWNER_EMAIL');
  const actor = Session.getActiveUser().getEmail();
  if (!owner || !actor || actor.toLowerCase() !== owner.toLowerCase()) throw new Error('Owner authorization required');
  retentionConfig_();
  const spreadsheet = config_().spreadsheet;
  for (const trigger of ScriptApp.getProjectTriggers()) {
    if (['recordReviewClosure', 'removeExpiredClosedEnquiries'].includes(trigger.getHandlerFunction())) ScriptApp.deleteTrigger(trigger);
  }
  const existing = ScriptApp.getProjectTriggers().map(trigger => trigger.getHandlerFunction());
  if (!existing.includes('recordReviewClosure_')) ScriptApp.newTrigger('recordReviewClosure_').forSpreadsheet(spreadsheet).onEdit().create();
  if (!existing.includes('removeExpiredClosedEnquiries_')) ScriptApp.newTrigger('removeExpiredClosedEnquiries_').timeBased().everyDays(1).atHour(3).create();
  console.log('Retention triggers installed; active and undated enquiries remain untouched.');
}

function digest_(text) {
  return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text));
}

function response_(message, appearance) {
  // No applicant content is echoed into the response document.
  const template = HtmlService.createTemplateFromFile('Response');
  template.message = message;
  template.theme = appearance === 'dark' ? 'dark' : 'light';
  return template.evaluate().setTitle('Artanrecords');
}

function doGet() {
  return response_('Please send your enquiry through our artist form.');
}

/** Private website transport; CAPTCHA and the existing receipt/email process stay unchanged. */
function internalSubmission_(event) {
  if (!event || event.contentLength > 45000 || !event.postData || event.postData.type.split(';')[0] !== 'application/json') return null;
  const envelope = JSON.parse(event.postData.contents), secret = PropertiesService.getScriptProperties().getProperty('CONTROL_INBOX_SECRET');
  if (!secret || secret.length < 32 || envelope.action !== 'submit' || !/^\d{13}$/.test(envelope.timestamp || '') || Math.abs(Date.now()-Number(envelope.timestamp)) > 300000 || !/^[0-9a-f]{64}$/.test(envelope.signature || '') || typeof envelope.payload !== 'string' || envelope.payload.length > 40000) throw new Error('Invalid private submission');
  const expected = Utilities.computeHmacSha256Signature(envelope.timestamp + '.' + envelope.payload, secret, Utilities.Charset.UTF_8).map(function(byte) {return ((byte+256)%256).toString(16).padStart(2,'0');}).join('');
  let difference = 0;for (let i=0;i<expected.length;i++) difference |= expected.charCodeAt(i)^envelope.signature.charCodeAt(i);
  if (difference) throw new Error('Invalid private submission');
  const parameters = JSON.parse(envelope.payload);if (parameters.formtype) throw new Error('Artist submissions only');return parameters;
}

function submissionReceipt_(accepted, reference) {
  return ContentService.createTextOutput(JSON.stringify({accepted:accepted,reference:accepted?reference:null})).setMimeType(ContentService.MimeType.JSON);
}

function doPost(event) {
  let lock;
  let saved = false, internal = false, reference;
  try {
    const parameters = internalSubmission_(event);
    if (parameters) {internal=true;event={contentLength:JSON.stringify(parameters).length,parameter:parameters};}
    if (!event || event.contentLength > 40000 || !event.parameter) throw new Error('Invalid request');
    const config = config_();
    if (event.parameter.formtype === 'contact') {
      const contact = JSON.parse(PropertiesService.getScriptProperties().getProperty('CONTACT_CONFIG') || '{}');
      if (!contact.fields || !contact.email || !contact.subject) throw new Error('Contact service not configured');
      config.fields = contact.fields;
      config.email = contact.email;
      config.subject = contact.subject;
    } else if (event.parameter.formtype) throw new Error('Invalid form');
    const data = validate_(event.parameter, config.fields);
    const profiles = event.parameter.formtype === 'contact' ? [] : streamingProfiles_(event.parameter.streaming_profiles);
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
    const sheetName = event.parameter.formtype === 'contact' ? 'Contact enquiries' : 'Enquiries';
    let sheet = book.getSheetByName(sheetName);
    if (!sheet) {
      sheet = book.insertSheet(sheetName);
      sheet.appendRow(['Received UTC', 'Reference', ...config.fields.map(f => f.label), 'Acknowledged', 'Review status', 'Notification']);
      sheet.setFrozenRows(1);
    }
    const now = new Date();
    reference = Utilities.getUuid();
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
    if (sheetName === 'Enquiries') {
      sheet.getRange(row,enquiryColumn_(sheet,'Streaming profiles')).setValue(JSON.stringify(profiles));
      const delivery = enquiryColumn_(sheet,'Control inbox');
      sheet.getRange(row,delivery).setValue('Pending');
      try {controlInbox_({reference:reference,data:data,profiles:profiles});sheet.getRange(row,delivery).setValue('Synced');} catch (error) { /* Sheet and email remain available; owner retries Pending rows. */ }
    }
    try {
      MailApp.sendEmail({
        to: config.email, replyTo: data.email, name: 'Artanrecords',
        subject: config.subject,
        body: 'Reference: ' + reference + '\n\n' + config.fields.map(f => f.label + ':\n' + data[f.name]).join('\n\n') + (profiles.length ? '\n\nSelected streaming profiles (ownership unverified):\n' + profiles.map(function(profile) {return profile.provider + ': ' + profile.name + '\n' + profile.url;}).join('\n\n') : '') + '\n\nAcknowledgment: yes\nSubmitted links are unverified. Do not open unexpected downloads.'
      });
      sheet.getRange(row, notificationColumn).setValue('Sent');
    } catch (error) {
      sheet.getRange(row, notificationColumn).setValue('Failed - review spreadsheet');
    }
    return internal ? submissionReceipt_(true, reference) : response_('Your enquiry has been received. Thank you for sharing your work.', event.parameter.appearance);
  } catch (error) {
    if (internal) return submissionReceipt_(saved, reference);
    return response_(saved ? 'Your enquiry has been saved. Please do not submit it again.' : 'Your enquiry was not saved. Please return to the form and check your details and CAPTCHA, or contact collaborate@artanrecords.com.', event && event.parameter && event.parameter.appearance);
  } finally {
    if (lock && lock.hasLock()) lock.releaseLock();
  }
}
