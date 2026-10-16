import {escape as e} from './render.mjs';
export function homeAtmosphere(config){
  if(!config||!Array.isArray(config.paths)||!config.paths.length)throw Error('Missing homepage atmosphere');
  if(!Array.isArray(config.colors)||config.colors.length!==3||!config.colors.every(token=>/^--color-(primary|secondary)\d+$/.test(token)))throw Error('Invalid atmosphere palette');
  const paths=config.paths.map(path=>{
    if(!/^[MmCcSsLlHhVvQqTtZz\d.,\s-]+$/.test(path))throw Error('Invalid atmosphere path');
    return `<path class="home-atmosphere__thread" stroke="url(#home-atmosphere-spectrum)" pathLength="1" d="${e(path)}"/><path class="home-atmosphere__glint" stroke="url(#home-atmosphere-spectrum)" pathLength="1" d="${e(path)}"/>`;
  }).join('');
  return `<svg class="home-atmosphere" data-home-atmosphere viewBox="0 0 1200 2400" preserveAspectRatio="none" fill="none" aria-hidden="true" focusable="false"><defs><linearGradient id="home-atmosphere-spectrum" x1="0" y1="0" x2="0" y2="1"><stop stop-color="var(${config.colors[0]})" stop-opacity="0"/><stop offset="0.18" stop-color="var(${config.colors[0]})"/><stop offset="0.5" stop-color="var(${config.colors[1]})"/><stop offset="0.82" stop-color="var(${config.colors[2]})"/><stop offset="1" stop-color="var(${config.colors[0]})" stop-opacity="0"/></linearGradient></defs>${paths}</svg>`;
}
