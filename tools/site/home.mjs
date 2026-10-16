import {escape as e} from './render.mjs';
export function homeAtmosphere(config){
  if(!config)throw Error('Missing homepage atmosphere');
  if(!Array.isArray(config.colors)||config.colors.length<2||!config.colors.every(token=>/^--color-(primary|secondary)\d+$/.test(token)||token==='--layout-home-featured-functions-card-spectrum-orange'))throw Error('Invalid atmosphere palette');
  if(!Array.isArray(config.paths)||!config.paths.length||!Number.isFinite(config.blur)||config.blur<0||config.blur>24)throw Error('Invalid atmosphere geometry');
  if(!Number.isFinite(config.spectrumSpan)||config.spectrumSpan<=0||config.spectrumSpan>1)throw Error('Invalid atmosphere spectrum span');
  if(!Number.isFinite(config.blurPeak)||config.blurPeak<config.blur||config.blurPeak>48||!Number.isFinite(config.softOpacity)||config.softOpacity<0||config.softOpacity>1)throw Error('Invalid atmosphere softness range');
  for(const key of ['landingOpacity','highlightMix'])if(!Number.isFinite(config[key])||config[key]<0||config[key]>1)throw Error('Invalid atmosphere light range');
  const stops=config.colors.map((token,index)=>`<stop offset="${index/(config.colors.length-1)}" stop-color="color-mix(in srgb,var(${e(token)}),var(--color-white) var(--home-atmosphere-light,0%))" stop-opacity="${index===0||index===config.colors.length-1?0:1}"/>`).join('');
  const paths=config.paths.map(path=>{
    if(!/^[MmCcSsLlHhVvQqTtZz\d.,\s-]+$/.test(path))throw Error('Invalid atmosphere path');
    return `<path class="home-atmosphere__thread" d="${e(path)}"/><path class="home-atmosphere__glint" pathLength="1" d="${e(path)}"/>`;
  }).join('');
  return `<svg class="home-atmosphere" data-home-atmosphere data-blur-min="${config.blur}" data-blur-max="${config.blurPeak}" data-soft-opacity="${config.softOpacity}" data-landing-opacity="${config.landingOpacity}" data-highlight-mix="${config.highlightMix}" viewBox="0 0 1200 2400" preserveAspectRatio="none" fill="none" aria-hidden="true" focusable="false"><defs><linearGradient id="home-atmosphere-spectrum" x1="0" y1="0" x2="0" y2="${config.spectrumSpan}" spreadMethod="reflect">${stops}</linearGradient><filter id="home-atmosphere-softness" filterUnits="userSpaceOnUse" x="-300" y="-300" width="1800" height="3000" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${config.blur}"/></filter></defs><g stroke="url(#home-atmosphere-spectrum)" filter="url(#home-atmosphere-softness)">${paths}</g></svg>`;
}
