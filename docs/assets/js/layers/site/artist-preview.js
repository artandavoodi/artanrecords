/* Preview entries never become public artists, profile routes or structured data. */
const navigationPreviews=new WeakMap();
export function registerArtistNavigationPreview(root,config,render){
 if(window.parent===window||new URLSearchParams(location.search).get('editor-preview')!=='1')return;
 navigationPreviews.get(root)?.();
 const receive=event=>{
  if(event.source!==window.parent||!config.studioOrigins?.includes(event.origin)||event.data?.type!=='artanrecords:artist-navigation-preview')return;
  const value=event.data.navigation;
  if(!value||!['menu','footer'].every(key=>Array.isArray(value[key])&&value[key].length<=8&&value[key].every(item=>safeNavigationLink(item)))||typeof value.footer_text!=='string'||value.footer_text.length>500)return;
  render(value);
 };
 addEventListener('message',receive);navigationPreviews.set(root,()=>removeEventListener('message',receive));
}
function safeNavigationLink(item){
 if(!item||typeof item.label!=='string'||!item.label.trim()||item.label.length>60||typeof item.url!=='string'||item.url.length>2000)return false;
 if(/^#[a-zA-Z][a-zA-Z0-9_-]*$/.test(item.url))return true;
 try{const url=new URL(item.url);return url.protocol==='https:'&&!url.username&&!url.password;}catch{return false;}
}
export async function bindArtistPreview() {
  if (!['localhost', '127.0.0.1', '::1'].includes(location.hostname)) return;
  if (new URLSearchParams(location.search).get('preview') !== 'artist-grid') return;
  const roster = document.querySelector('main[data-fragment="artists"] .artist-roster');
  if (!roster) return;
  const response = await fetch('/assets/data/artists/roster.json');
  if (!response.ok) return;
  const config = await response.json();
  const tokens = getComputedStyle(document.documentElement);
  for (const artist of config.previewItems || []) {
    const card = document.createElement('article');
    card.className = 'artist-card';
    card.setAttribute('aria-label', `${artist.name}, preview placeholder`);
    const frame = document.createElement('div');
    frame.className = 'artist-card__preview';
    const figure = document.createElement('figure');
    const image = document.createElement('img');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 1 1');
    const rect = document.createElementNS(svg.namespaceURI, 'rect');
    rect.setAttribute('width', '1');
    rect.setAttribute('height', '1');
    rect.setAttribute('fill', tokens.getPropertyValue(artist.colorToken).trim());
    svg.append(rect);
    image.src = `data:image/svg+xml,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}`;
    image.alt = '';
    const name = document.createElement('h3');
    name.textContent = artist.name;
    figure.append(image);
    frame.append(figure, name);
    card.append(frame);
    roster.append(card);
  }
}
