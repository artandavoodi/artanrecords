import {escape as e} from './render.mjs';

// The public projection deliberately excludes unreviewed commercial percentages.
export function partnershipPages(config,icons) {
  if(config.schemaVersion!==1 || config.publication.percentages!==false || config.publication.legalAccountingReview!=='pending') throw Error('Partnership publication requires an explicitly reviewed implementation');
  const ids=config.items.map(item=>item.id);
  if(ids.join(',')!=='silver,gold,platinum') throw Error('Invalid partnership register');
  const commonLinks=[{label:'Submit your music',url:'/submit/',emphasis:'primary'},{label:'Recommend a partnership',url:'/submit/#artist-conversation'},{label:'Partnership guidance',url:'https://docs.artanrecords.com/partnerships/'}];
  const table=`<div class="partnership-comparison" role="region" aria-label="${e(config.comparison.caption)}" tabindex="0"><table><caption>${e(config.comparison.caption)}</caption><thead><tr><th scope="col">Our role</th>${config.items.map(item=>`<th scope="col"><a href="/partnerships/${e(item.id)}/">${e(item.name)}</a></th>`).join('')}</tr></thead><tbody>${config.comparison.rows.map(row=>{
    if(row.values.length!==ids.length) throw Error('Incomplete partnership comparison');
    if(!row.states || row.states.length!==ids.length) throw Error('Missing explicit comparison states');
    return `<tr><th scope="row">${e(row.label)}</th>${row.values.map((value,index)=>{
      const state=config.comparison.states[row.states[index]];
      if(!state) throw Error('Unknown comparison state');
      const statusIcon=['included','excluded'].includes(row.states[index])?icons.items.find(item=>item.id===state.icon):null;
      if(['included','excluded'].includes(row.states[index])&&!statusIcon) throw Error('Unregistered partnership status icon');
      return `<td data-inclusion="${e(row.states[index])}"><span class="partnership-cell">${statusIcon?`<span class="partnership-status-icon" aria-hidden="true" style="--partnership-status-artwork:url('/${e(statusIcon.src)}')"></span>`:''}<span><span class="partnership-state">${e(state.label)}</span>${value===state.label?'':`<span>${e(value)}</span>`}</span></span></td>`;
    }).join('')}</tr>`;
  }).join('')}</tbody></table></div>`;
  return [{path:'/partnerships/',title:config.title,description:config.description,presentation:'flow',sections:config.principles,comparison:table,afterComparison:[{id:'find-your-partnership',...config.nextSteps}],links:[]},...config.items.map(item=>({path:`/partnerships/${item.id}/`,title:item.name+' — '+item.position,description:item.description,presentation:'flow',sections:[...item.sections,...config.principles.filter(section=>['costs','rights','next'].includes(section.id)),...config.questions],links:[...commonLinks,{label:'Compare partnerships',url:'/partnerships/'}]}))];
}
