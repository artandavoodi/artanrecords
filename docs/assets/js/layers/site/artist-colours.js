export function artistColourProperties(fields){
 const palette=Array.isArray(fields.palette)?fields.palette.slice(0,5):[];
 const assignments=fields.palette_assignments??{icons:0,header_fade:1,header_ribbon:1};
 const output={};
 for(let index=0;index<5;index++)output['--artist-primary-'+(index+1)]=typeof palette[index]==='string'&&/^#[0-9a-f]{6}$/i.test(palette[index])?palette[index]:null;
 for(const [target,property] of Object.entries({icons:'--artist-icon-colour',header_fade:'--artist-header-fade',header_ribbon:'--artist-header-ribbon'})){
  const index=assignments[target],value=Number.isInteger(index)&&index>=0&&index<5?palette[index]:null;
  output[property]=typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value)?value:null;
 }
 return output;
}
