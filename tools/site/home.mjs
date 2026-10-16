import {escape as e} from './render.mjs';
export function homeAtmosphere(config){
  if(!config||!Array.isArray(config.paths)||!config.paths.length)throw Error('Missing homepage atmosphere');
  if(!Array.isArray(config.colors)||config.colors.length<2||!config.colors.every(token=>/^--color-(primary|secondary)\d+$/.test(token)))throw Error('Invalid atmosphere palette');
  if(!Number.isFinite(config.spectrumSpan)||config.spectrumSpan<=0||config.spectrumSpan>1)throw Error('Invalid atmosphere spectrum span');
  const stops=config.colors.map((token,index)=>`<stop offset="${index/(config.colors.length-1)}" stop-color="var(${token})"/>`).join('');
  const paths=config.paths.map(path=>{
    if(!/^[MmCcSsLlHhVvQqTtZz\d.,\s-]+$/.test(path))throw Error('Invalid atmosphere path');
    return `<path class="home-atmosphere__thread" stroke="url(#home-atmosphere-spectrum)" pathLength="1" d="${e(path)}"/><path class="home-atmosphere__glint" stroke="url(#home-atmosphere-spectrum)" pathLength="1" d="${e(path)}"/>`;
  }).join('');
  return `<svg class="home-atmosphere" data-home-atmosphere viewBox="0 0 1200 2400" preserveAspectRatio="none" fill="none" aria-hidden="true" focusable="false"><defs><linearGradient id="home-atmosphere-spectrum" x1="0" y1="0" x2="0" y2="${config.spectrumSpan}" spreadMethod="reflect">${stops}</linearGradient></defs>${paths}</svg>`;
}
