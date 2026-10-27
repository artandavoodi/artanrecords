import {escape as e,icon as iconMarkup,paragraphs} from './render.mjs';
import {validatePartnerships,recordingReference} from '../ecosystem/partnerships.mjs';
import {validateStudioPlans} from '../ecosystem/studio-plans.mjs';

// Shared comparison markup preserves the same responsive cells and details dialog.
export function comparisonTable(config,icons) {
  const ids=config.items.map(item=>item.id);
  const periodTabs=config.comparison.billingPeriods?`<div class="pricing-period-tabs" role="tablist" aria-label="Billing period">${config.comparison.billingPeriods.map((period,index)=>`<button type="button" role="tab" aria-selected="${index===0}" tabindex="${index===0?0:-1}" data-pricing-period="${e(period.id)}">${e(period.label)}</button>`).join('')}</div>`:'';
  const table=`<div class="partnership-comparison" role="region" aria-label="${e(config.comparison.caption)}" tabindex="0"><table><caption><span>${e(config.comparison.caption)}</span>${periodTabs}</caption><thead><tr><th scope="col">${e(config.comparison.featureLabel||'Our role')}</th>${config.items.map(item=>`<th scope="col"><a href="${e(item.url||'/partnerships/'+item.id+'/')}">${e(item.name)}</a></th>`).join('')}</tr></thead><tbody>${config.comparison.rows.map((row,rowIndex)=>{
    if(row.values.length!==ids.length) throw Error('Incomplete partnership comparison');
    if(!row.states || row.states.length!==ids.length) throw Error('Missing explicit comparison states');
    if(typeof row.details!=='string'||row.details.length<100)throw Error('Missing full partnership explanation');
    return `<tr${row.billingInterval?` data-billing-interval="${e(row.billingInterval)}"`:''}><th scope="row">${e(row.label)}</th>${row.values.map((value,index)=>{
      const state=config.comparison.states[row.states[index]];
      if(!state) throw Error('Unknown comparison state');
      const statusIcon=['included','excluded'].includes(row.states[index])?icons.items.find(item=>item.id===state.icon):null;
      if(['included','excluded'].includes(row.states[index])&&!statusIcon) throw Error('Unregistered partnership status icon');
      return `<td data-inclusion="${e(row.states[index])}"><button class="partnership-cell" type="button" data-partnership-detail="${rowIndex}" aria-haspopup="dialog" aria-controls="partnership-detail-dialog" aria-label="${e(config.comparison.detailsLabel+': '+config.items[index].name+' — '+row.label)}">${statusIcon?`<span class="partnership-status-icon" aria-hidden="true" style="--partnership-status-artwork:url('/${e(statusIcon.src)}')"></span>`:''}<span><span class="partnership-state">${e(state.label)}</span><span class="${row.presentation==='price'?'partnership-price':'partnership-cell-note'}">${e(value===state.label?row.preview||row.label:value)}</span><span class="partnership-detail-trigger">${e(config.comparison.detailsLabel)}</span></span></button></td>`;
    }).join('')}</tr>`;
  }).join('')}</tbody></table></div>${config.comparison.rows.map((row,index)=>`<template id="partnership-explanation-${index}">${paragraphs(row.details)}</template>`).join('')}<dialog id="partnership-detail-dialog" class="partnership-detail-dialog" data-partnership-dialog aria-labelledby="partnership-detail-title"><button class="dialog-close global-close-button" type="button" data-partnership-close aria-label="${e(config.comparison.closeLabel)}">${iconMarkup('close',icons)}</button><h2 id="partnership-detail-title"></h2><div data-partnership-detail-copy></div><p class="partnership-detail-scope">${e(config.comparison.scopeNotice)}</p></dialog>`;
  return table;
}

// Partnership terms retain their own publication gate, independent of Studio plans.
export function partnershipPages(config,icons,plans=null) {
  validatePartnerships(config);
  if(plans){
    validateStudioPlans(plans);
    const row={label:'Studio access',presentation:'price',values:config.items.map(tier=>plans.items.find(plan=>plan.plan===plans.partnershipInclusion[tier.id]).name+' included while the partnership is active'),states:config.items.map(()=>'included'),details:'Included platform access is a benefit of a verified active partnership, not the price of that recording partnership. It does not change public software list prices or authorize a separate subscription charge. A requested or approved tier alone is not a signed agreement, and continuation after expiry requires an approved policy.'};
    config={...config,comparison:{...config.comparison,rows:[...config.comparison.rows.filter(item=>item.label!=='Studio access'),row]}};
  }
  const reference=recordingReference(config).map(section=>({id:section.id,title:section.title,text:section.paragraphs.join('\n\n')}));
  if(config.publication.percentages){
    const financialRows=[['Artist keeps','artistShare'],['Artanrecords share','labelShare']].map(([label,field])=>({label,presentation:'price',values:config.items.map(item=>item[field]+'%'),states:config.items.map(()=>'included'),details:config.commercialNotice+' The allocation applies only to '+config.recordingScope+'.'}));
    config={...config,comparison:{...config.comparison,rows:[...financialRows,...config.comparison.rows]}};
  }
  config={...config,principles:[...config.principles,...reference],items:config.items.map(item=>({...item,sections:[...reference.filter(section=>!section.id.startsWith('recording-')||['recording-terms','recording-publication','recording-'+item.id].includes(section.id)),...item.sections]}))};
  const ids=config.items.map(item=>item.id);
  const specification=config.serviceSpecifications;
  if(!specification||ids.some(id=>!specification.tiers[id]?.length))throw Error('Missing service specifications');
  const specifications=id=>specification.tiers[id].map((service,index)=>({id:`deliverable-${index+1}`,title:service.title,text:[service.deliverable,service.evidence,service.limits].join('\n\n')}));
  const classifications=specification.categories.map(category=>({id:`scope-${category.id}`,title:category.label,text:category.meaning}));
  if(ids.join(',')!=='silver,gold,platinum') throw Error('Invalid partnership register');
  const commonLinks=[{label:'Submit your music',url:'/submit/',emphasis:'primary'},{label:'Recommend a partnership',url:'/submit/#artist-conversation'},{label:'Partnership guidance',url:'https://docs.artanrecords.com/partnerships/'}];
  const table=comparisonTable(config,icons);
  return [{path:'/partnerships/',title:config.title,description:config.description,presentation:'flow',sections:config.principles,comparison:table,afterComparison:[{id:'service-schedule',title:specification.title,text:specification.introduction,links:[{label:'Service specification guidance',url:'https://docs.artanrecords.com/service-specifications/'}]},{id:'find-your-partnership',...config.nextSteps}],links:[]},...config.items.map((item,tierIndex)=>({path:`/partnerships/${item.id}/`,title:item.name+' — '+item.position,description:item.description,presentation:'flow',sections:[...item.sections,{id:'service-schedule',title:specification.title,text:specification.introduction},...specifications(item.id),...classifications,...config.comparison.rows.map((row,index)=>({id:`service-${index+1}`,title:row.label,text:row.values[tierIndex]+'\n\n'+row.details})),...config.principles.filter(section=>['costs','rights','next'].includes(section.id)),...config.questions],links:[...commonLinks,{label:'Compare partnerships',url:'/partnerships/'}]}))];
}
