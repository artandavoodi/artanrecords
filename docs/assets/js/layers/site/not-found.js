export async function bindNotFound(){
 if(!document.body.classList.contains('page-404'))return;
 const back=document.querySelector('[data-404-back-button]');
 if(back&&!back.dataset.notFoundBound){back.dataset.notFoundBound='true';back.addEventListener('click',()=>{if(history.length>1)history.back();else location.assign('/');});}
 if(document.querySelector('[data-404-hero-shader-fragment]'))return;
 const response=await fetch('/assets/fragments/layers/website/system/404-hero-shader.html');if(!response.ok)return;
 const mount=document.createElement('div');mount.dataset['404ShaderMount']='';mount.innerHTML=await response.text();
 mount.querySelectorAll('script').forEach(script=>script.remove());document.body.prepend(mount);
 const script=document.createElement('script');script.src='/assets/js/layers/website/ui/effects/404-hero-shader.js';document.body.append(script);
}
export async function showNotFound(){
 const response=await fetch('/404.html');if(!response.ok)return;
 const document404=new DOMParser().parseFromString(await response.text(),'text/html'),main=document.querySelector('main');
 const replacement=document404.querySelector('main');if(!main||!replacement)return;
 main.replaceWith(replacement);document.body.classList.add('page-404');
 for(const chrome of document.querySelectorAll('[data-fragment=navigation],[data-fragment=footer]'))chrome.hidden=true;
 document.title=document404.title;document.querySelector('meta[name=robots]')?.setAttribute('content','noindex,follow');
 document.querySelector('link[rel=canonical]')?.setAttribute('href',location.origin+location.pathname);
 await bindNotFound();
}
export async function routeArtistRequest(){
 if(!document.querySelector('main[data-fragment=not-found]'))return;
 const match=location.pathname.match(/^\/([a-z0-9][a-z0-9.]{1,30}[a-z0-9])\/?$/);
 if(!match||match[1].includes('..'))return;
 const response=await fetch('/assets/data/artists/reserved-routes.json');if(!response.ok|| (await response.json()).includes(match[1]))return;
 const template=await fetch('/artists/profile/');if(!template.ok)return;
 const parsed=new DOMParser().parseFromString(await template.text(),'text/html'),main=parsed.querySelector('main'),artist=main?.querySelector('[data-public-artist]');if(!artist)return;
 artist.dataset.artistUsername=match[1];main.dataset.fragment='artist';
 document.querySelector('main').replaceWith(main);document.body.classList.remove('page-404');
 const navigation=document.querySelector('[data-fragment=navigation]');navigation.hidden=false;navigation.querySelector('.label-home-actions')?.remove();
}
