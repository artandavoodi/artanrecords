/* Domain-specific consent; data and registered artwork stay in their JSON owners. */
export async function initializePreferences(){
  if(document.querySelector('[data-preferences-panel]'))return;
  const [site,icons]=await Promise.all(['/assets/data/site.json','/assets/data/icons.json'].map(async url=>{const response=await fetch(url);if(!response.ok)throw Error('Preferences could not be loaded');return response.json();}));
  const data=site.preferences,state=window.ArtanRecordsPreferences;
  if(!state)return;
  const image=id=>{const record=icons.items.find(item=>item.id===id);if(!record)throw Error(`Unregistered preference icon: ${id}`);const img=document.createElement('img');img.src='/'+record.src;img.alt='';img.dataset.monochrome='true';return img;};
  const dialog=document.createElement('dialog');dialog.className='privacy-preferences';dialog.dataset.preferencesPanel='';dialog.setAttribute('aria-labelledby','preferences-title');
  const brand=document.createElement('span');brand.className='privacy-preferences__symbol';brand.setAttribute('aria-hidden','true');brand.append(image('cookies'));
  const title=document.createElement('h2');title.id='preferences-title';title.tabIndex=-1;title.autofocus=true;title.textContent=data.title;
  const description=document.createElement('p');description.textContent=data.description;
  const actions=document.createElement('div');actions.className='privacy-preferences__actions';
  for(const [choice,label,icon] of [['allow',data.allow,'check'],['skip',data.skip,'close']]){
    const button=document.createElement('button');button.type='button';button.className='privacy-preferences__action';button.append(image(icon),document.createTextNode(label));button.addEventListener('click',()=>{state.choose(choice);dialog.close();});actions.append(button);
  }
  const notice=document.createElement('a');notice.href='/legal/#cookies';notice.textContent=data.notice;notice.addEventListener('click',()=>dialog.close());
  dialog.append(brand,title,description,actions,notice);dialog.addEventListener('cancel',()=>state.choose('skip'));document.body.append(dialog);
  const settings=document.createElement('button');settings.type='button';settings.textContent=data.settings;settings.addEventListener('click',()=>{if(!dialog.open)dialog.showModal();});
  document.querySelector('.site-footer .information-links')?.append(settings);
  // Reading the notice must never be obscured by an undecided-choice prompt.
  if(state.choice()===null&&location.pathname!==new URL(notice.href).pathname)dialog.showModal();
}
