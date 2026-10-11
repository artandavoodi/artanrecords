import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=readFileSync(new URL('./site/enquiries.gs',import.meta.url),'utf8');
const context=vm.createContext({});
vm.runInContext(source,context);
const {form,contact}=JSON.parse(readFileSync(new URL('../docs/assets/data/artists/intake.json',import.meta.url),'utf8'));
const contactValid={name:'Test',email:'test@example.com',purpose:'General enquiry',reply:'No reply needed',message:'A question',processing_acknowledgement:'yes'};
assert.equal(context.validate_(contactValid,contact.form.fields).artist,'');
for(const changes of [{name:''},{email:''},{purpose:'Music submission'},{reply:'unknown'},{message:''}]) assert.throws(()=>context.validate_({...contactValid,...changes},contact.form.fields));
const valid={name:'Test Artist',artist:'Test',email:'test@example.com',purpose:'Collaboration',message:'Test enquiry',processing_acknowledgement:'yes'};
assert.equal(context.validate_(valid,form.fields).email,valid.email);
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
context.removeExpiredClosedEnquiries();
assert.deepEqual(removed,['closed-old']);
assert.ok(released);
assert.deepEqual(sheetRows.slice(1).map(row=>row[0]),['active-old','legacy','closed-future']);
console.log('Enquiry validation and spreadsheet safety checks passed.');
