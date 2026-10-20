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
    copy.textContent=cell.querySelector('.partnership-cell-note').textContent;
    button.focus({preventScroll:true});
    openDialog(dialog);
  });
  comparison.setAttribute('data-partnership-enhanced','');
}
