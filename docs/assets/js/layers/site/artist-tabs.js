// Keep the artist's selected destination when public metadata refreshes.
import {bindArtistHeader,bindArtistSections} from './artist-sections.js';
export function renderArtistTabs(mount,groups,concerts){
 const selected=mount.dataset.selectedTab;
 const tabs=document.createElement('nav');tabs.className='artist-destination-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Explore this artist');
 for(const group of groups){
  const panel=mount.querySelector('[data-artist-group="'+group.id+'"]');if(!panel)continue;
  panel.id='artist-destination-'+group.id;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby','artist-tab-'+group.id);
  const tab=document.createElement('button');tab.type='button';tab.id='artist-tab-'+group.id;tab.setAttribute('role','tab');tab.setAttribute('aria-controls',panel.id);tab.dataset.artistTab=group.id;tab.textContent=group.label;tabs.append(tab);
  if(group.id==='concerts'&&concerts)panel.append(concerts);
 }
 mount.prepend(tabs);
 const activate=id=>{mount.dataset.selectedTab=id;for(const tab of tabs.children){const active=tab.dataset.artistTab===id;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;mount.querySelector('#'+tab.getAttribute('aria-controls')).hidden=!active;}};
 const select=id=>{
  const desktop=mount.closest('[data-public-artist]')?.dataset.artistSectionMode==='desktop';
  activate(id);
  if(desktop)mount.scrollIntoView({block:'start',behavior:'instant'});
 };
 tabs.addEventListener('click',event=>{const tab=event.target.closest('[data-artist-tab]');if(tab)select(tab.dataset.artistTab);});
 tabs.addEventListener('keydown',event=>{const buttons=[...tabs.children],index=buttons.indexOf(document.activeElement);if(index<0)return;let next;if(event.key==='ArrowRight')next=(index+1)%buttons.length;else if(event.key==='ArrowLeft')next=(index+buttons.length-1)%buttons.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=buttons.length-1;else return;event.preventDefault();activate(buttons[next].dataset.artistTab);buttons[next].focus();});
 const first=[...tabs.children].find(tab=>tab.dataset.artistTab===selected)||tabs.firstElementChild;if(first)activate(first.dataset.artistTab);
 const root=mount.closest('[data-public-artist]');
 bindArtistHeader();
 if(!root.hasAttribute('data-artist-editor-preview'))bindArtistSections(root,mount,tabs);
}
