import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {intakeForm} from './site/intake.mjs';

const source=readFileSync(new URL('./site/enquiries.gs',import.meta.url),'utf8');
const context=vm.createContext({});
vm.runInContext(source,context);
const {form,contact}=JSON.parse(readFileSync(new URL('../docs/assets/data/artists/intake.json',import.meta.url),'utf8'));
assert.equal(form.submitLabel,'Submit');
assert.equal(form.showEmailAlternative,false);
assert.ok(form.reviewInformation.some(section=>section.text.includes('14 working days')));
assert.deepEqual(Array.from(context.streamingProfiles_('[]')),[]);
const selectedProfile={provider:'spotify',id:'7zUiATkwf1InOGR2J1NG7t',name:'Artist',url:'https://open.spotify.com/artist/7zUiATkwf1InOGR2J1NG7t'};
assert.equal(context.streamingProfiles_(JSON.stringify([selectedProfile]))[0].id,selectedProfile.id);
assert.throws(()=>context.streamingProfiles_(JSON.stringify([{...selectedProfile,url:'https://evil.test/artist'}])));
assert.throws(()=>context.streamingProfiles_(JSON.stringify([selectedProfile,selectedProfile])));
const icons=JSON.parse(readFileSync(new URL('../docs/assets/data/icons.json',import.meta.url),'utf8'));
for(const config of [form,{...form,...contact.form}]){
  const markup=intakeForm(config,icons);
  assert.match(markup,/id="enquiry-required-hint"/);
  assert.equal((markup.match(/class="artist-enquiry__required"/g)||[]).length,config.fields.filter(field=>field.required).length+1);
  for(const field of config.fields){
    const label=markup.match(new RegExp(`<label for="enquiry-${field.name}">([\\s\\S]*?)</label>`))[1];
    assert.equal(label.includes('artist-enquiry__required'),Boolean(field.required));
  }
}
const submissionPage=readFileSync(new URL('../docs/submit/index.html',import.meta.url),'utf8');
assert.ok(submissionPage.includes('14 working days'));
assert.ok(submissionPage.includes('Read more'));
assert.ok(submissionPage.includes('data-artist-discovery'));
assert.ok(!submissionPage.includes('Prefer email?'));
assert.match(submissionPage,/data-fragment="submission"/);
assert.doesNotMatch(submissionPage,/data-journey-scene/,'Submission must retain its own composition, not repeat the artist graphics');
assert.equal((submissionPage.match(/data-journey-step/g)||[]).length,3);
for(const id of ['share','review','prepare','artist-conversation'])assert.ok(submissionPage.includes(`id="${id}"`));
assert.match(submissionPage,/<option selected>Music submission<\/option>/);
const contactValid={name:'Test',email:'test@example.com',purpose:'General enquiry',reply:'No reply needed',message:'A question',processing_acknowledgement:'yes'};
assert.equal(context.validate_(contactValid,contact.form.fields).artist,'');
for(const changes of [{name:''},{email:''},{purpose:'Music submission'},{reply:'unknown'},{message:''}]) assert.throws(()=>context.validate_({...contactValid,...changes},contact.form.fields));
const valid={name:'Test Artist',artist:'Test',email:'test@example.com',purpose:'Collaboration',message:'Test enquiry',processing_acknowledgement:'yes'};
assert.equal(context.validate_(valid,form.fields).email,valid.email);
for(const config of [form,contact.form]){
  const sample=config===form?valid:contactValid;
  for(const field of config.fields.filter(field=>field.required))assert.throws(()=>context.validate_({...sample,[field.name]:''},config.fields),`Missing ${field.name} must be rejected by the server`);
}
for(const changes of [{email:''},{email:'a@b.com\r\nBcc:x@y.com'},{message:'x'.repeat(5001)},{purpose:'other'},{processing_acknowledgement:'no'},{website:'javascript:alert(1)'}]) {
  assert.throws(()=>context.validate_({...valid,...changes},form.fields));
}
for(const value of ['=IMPORTXML("url")','+1','-1','@SUM(1)','  =1']) assert.equal(context.safeCell_(value),"'"+value);
assert.equal(context.safeCell_('Artist'),'Artist');
const retentionRows=[
  {status:'Closed',closedAt:'2026-08-01'},
  {status:'Declined',closedAt:'2026-10-01'},
  {status:'New',closedAt:'2026-08-01'},
  {status:'Closed',closedAt:''}
];
assert.equal(context.retentionCandidates_(retentionRows,new Date('2026-10-10'),30).length,1);
assert.equal(retentionRows.length,4);
assert.throws(()=>context.retentionCandidates_(retentionRows,new Date(),0));
const sheetRows=[
  ['Reference','Review status','Closed UTC'],
  ['closed-old','Closed','2020-01-01'],
  ['active-old','New','2020-01-01'],
  ['legacy','Declined',''],
  ['closed-future','Closed','2099-01-01']
];
const removed=[];
const sheet={
  getLastRow:()=>sheetRows.length,getLastColumn:()=>3,
  getDataRange:()=>({getValues:()=>sheetRows.map(row=>[...row])}),
  getRange:row=>({getValues:()=>[[...sheetRows[row-1]]]}),
  deleteRow:row=>{removed.push(sheetRows[row-1][0]);sheetRows.splice(row-1,1);}
};
context.PropertiesService={getScriptProperties:()=>({getProperty:key=>({
  RETENTION_CONFIG:JSON.stringify({daysAfterClosure:30,sheetNames:['Enquiries']}),
  INTAKE_CONFIG:JSON.stringify({fields:[],email:'test@example.com'}),
  RECAPTCHA_SECRET:'test-only',SPREADSHEET_ID:'test-sheet'
}[key])})};
context.SpreadsheetApp={openById:()=>({getSheetByName:()=>sheet})};
let released=false;
context.LockService={getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>{released=true;}})};
context.console={log:()=>{}};
context.removeExpiredClosedEnquiries_();
assert.deepEqual(removed,['closed-old']);
assert.ok(released);
assert.deepEqual(sheetRows.slice(1).map(row=>row[0]),['active-old','legacy','closed-future']);
context.Session={getActiveUser:()=>({getEmail:()=>''})};
assert.throws(()=>context.installRetentionTriggers(),/Owner authorization required/);
console.log('Enquiry validation and spreadsheet safety checks passed.');
