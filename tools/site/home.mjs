import {escape as e} from './render.mjs';
export function homeAtmosphere(config){
  if(!config)throw Error('Missing homepage atmosphere');
  if(!Array.isArray(config.colors)||config.colors.length<2||!config.colors.every(token=>/^--color-(primary|secondary)\d+$/.test(token)||token==='--layout-home-featured-functions-card-spectrum-orange'))throw Error('Invalid atmosphere palette');
  const fields=config.colors.map((token,index)=>`<span class="home-atmosphere__field" style="--atmosphere-color:var(${e(token)});--atmosphere-position:${index/(config.colors.length+3)*100}%;--atmosphere-height:${400/(config.colors.length+3)}%"></span>`).join('');
  return `<div class="home-atmosphere" data-home-atmosphere aria-hidden="true">${fields}</div>`;
}
