let bound=false;
// Preview messages affect this frame only. They never write artist metadata.
export function bindArtistEditorPreview(root,config){
 if(bound||window.parent===window||new URL(location.href).searchParams.get('editor-preview')!=='1')return;
 bound=true;
 const receive=event=>{
  if(event.source!==window.parent||!config.studioOrigins.includes(event.origin)||event.data?.type!=='artanrecords:artist-preview')return;
  const draft=event.data.draft;
  if(!draft||typeof draft!=='object'||!config.fonts.some(item=>item.id===draft.font)||!config.sizes.some(item=>item.id===draft.size)||!Array.isArray(draft.sections)||draft.sections.length>config.sections.length||new Set(draft.sections).size!==draft.sections.length||draft.sections.some(id=>!config.sections.some(item=>item.id===id)))return;
  const heading=root.querySelector('[data-artist-name]');
  if(heading){heading.style.fontFamily=config.fonts.find(item=>item.id===draft.font).value;heading.style.fontSize=config.sizes.find(item=>item.id===draft.size).value;}
  for(const item of config.sections){const section=root.querySelector(item.selector);if(section)section.hidden=!draft.sections.includes(item.id);}
  if(typeof draft.ribbon==='string'&&/^#[0-9a-f]{6}$/i.test(draft.ribbon))document.querySelector('[data-fragment=navigation]')?.style.setProperty('--artist-header-ribbon',draft.ribbon);
  window.parent.postMessage({type:'artanrecords:artist-preview-applied'},event.origin);
 };
 addEventListener('message',receive);
 for(const origin of config.studioOrigins)window.parent.postMessage({type:'artanrecords:artist-preview-ready'},origin);
}
