import {escape as e,image} from './render.mjs';

export function showcaseRelease(release,openLabel){
  return `<article class="discovery-feature"><a href="/releases/${e(release.id)}/">${image(release.cover,true)}<div><p class="eyebrow">${e(release.type)}</p><h3>${e(release.title)}</h3><p class="home-release-artist">${e(release.artist)}</p><p>${e(release.description)}</p><span class="home-release-action">${e(openLabel)}</span></div></a></article>`;
}

export function showcaseCarousel(slides,id,label,labels){
  if(!slides.length)throw Error('Empty homepage showcase');
  if(slides.length===1)return slides[0].html;
  if(!labels.showItem?.includes('{title}')||!labels.position?.includes('{current}')||!labels.position.includes('{total}'))throw Error('Missing showcase labels');
  const items=slides.map((slide,index)=>`<div class="home-carousel__slide" id="${e(id)}-${index+1}" role="group" aria-roledescription="slide" aria-label="${e(labels.position.replace('{current}',index+1).replace('{total}',slides.length))}">${slide.html}</div>`).join('');
  const dots=slides.map((slide,index)=>`<button type="button" data-carousel-dot="${index}" aria-controls="${e(id)}-${index+1}" aria-label="${e(labels.showItem.replace('{title}',slide.title))}"${index===0?' aria-current="true"':''}></button>`).join('');
  return `<div class="home-carousel" data-home-carousel role="region" aria-roledescription="carousel" aria-label="${e(label)}"><div class="home-carousel__track" data-carousel-track>${items}</div><div class="home-carousel__dots" data-carousel-dots hidden>${dots}</div><p class="label-accessible-title" data-carousel-status aria-live="polite" aria-atomic="true"></p></div>`;
}
