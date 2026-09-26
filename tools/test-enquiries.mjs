import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=readFileSync(new URL('./site/enquiries.gs',import.meta.url),'utf8');
const context=vm.createContext({});
vm.runInContext(source,context);
const {form}=JSON.parse(readFileSync(new URL('../docs/assets/data/artists/intake.json',import.meta.url),'utf8'));
const valid={name:'Test Artist',artist:'Test',email:'test@example.com',purpose:'Collaboration',message:'Test enquiry',processing_acknowledgement:'yes'};
assert.equal(context.validate_(valid,form.fields).email,valid.email);
for(const changes of [{email:''},{email:'a@b.com\r\nBcc:x@y.com'},{message:'x'.repeat(5001)},{purpose:'other'},{processing_acknowledgement:'no'},{website:'javascript:alert(1)'}]) {
  assert.throws(()=>context.validate_({...valid,...changes},form.fields));
}
for(const value of ['=IMPORTXML("url")','+1','-1','@SUM(1)','  =1']) assert.equal(context.safeCell_(value),"'"+value);
assert.equal(context.safeCell_('Artist'),'Artist');
console.log('Enquiry validation and spreadsheet safety checks passed.');
