import {openDialog} from '../../core/dialogs.js';

export function bindPartnershipComparison(){
  const comparison=document.querySelector('.partnership-comparison');
  const dialog=document.querySelector('[data-partnership-dialog]');
  if(!comparison||!dialog||comparison.hasAttribute('data-partnership-enhanced'))return;
  const title=dialog.querySelector('h2');
  const copy=dialog.querySelector('[data-partnership-detail-copy]');
  dialog.querySelector('[data-partnership-close]').addEventListener('click',()=>dialog.close());
  comparison.addEventListener('click',event=>{
    const button=event.target.closest('[data-partnership-detail]');
    if(!button)return;
    const cell=button.closest('td'),row=cell.closest('tr');
    const tier=comparison.querySelectorAll('thead th')[cell.cellIndex].textContent.trim();
    title.textContent=`${tier} — ${row.querySelector('th').textContent.trim()}`;
    const template=document.getElementById('partnership-explanation-'+button.dataset.partnershipDetail);
    const detail=cell.querySelector('.partnership-cell-note, .partnership-price');
    const preview=document.createElement('p');preview.textContent=cell.querySelector('.partnership-state').textContent+(detail?' — '+detail.textContent:'');
    copy.replaceChildren(preview,template.content.cloneNode(true));
    button.focus({preventScroll:true});
    openDialog(dialog);
  });
  comparison.setAttribute('data-partnership-enhanced','');
  const periodTabs=[...document.querySelectorAll('[data-pricing-period]')];
  const selectPeriod=selected=>{
    periodTabs.forEach(tab=>{const active=tab===selected;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;});
    comparison.querySelectorAll('[data-billing-interval]').forEach(row=>row.hidden=row.dataset.billingInterval!==selected.dataset.pricingPeriod);
  };
  periodTabs.forEach((tab,index)=>{tab.addEventListener('click',()=>selectPeriod(tab));tab.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const next=event.key==='Home'?periodTabs[0]:event.key==='End'?periodTabs.at(-1):periodTabs[(index+(event.key==='ArrowRight'?1:-1)+periodTabs.length)%periodTabs.length];selectPeriod(next);next.focus();});});
  if(periodTabs.length)selectPeriod(periodTabs[0]);
}
