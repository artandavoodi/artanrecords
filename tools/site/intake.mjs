import {escape as e,icon} from './render.mjs';

export function submissionJourneySteps(sections,startLabel){
  return sections.map((section,index)=>{
    if(!/^[a-z0-9-]+$/.test(section.id))throw Error('Invalid submission section identifier');
    return `<section class="submission-journey__step" id="${e(section.id)}" data-journey-step><div class="submission-journey__copy"><p class="submission-journey__number" aria-hidden="true">${String(index+1).padStart(2,'0')}</p><div class="submission-journey__body"><h2>${e(section.title)}</h2><p class="reading">${e(section.text)}</p><p class="reading muted">${e(section.detail)}</p>${index===sections.length-1?`<div class="label-home-actions"><a href="#artist-conversation" data-emphasis="primary">${e(startLabel)}</a></div>`:''}</div></div></section>`;
  }).join('');
}

export function intakeJourney(channels,scenes) {
  return channels.map((channel,index)=>{
    return `<section class="artist-journey__step" data-journey-step><div class="artist-journey__copy"><p class="artist-journey__number" aria-hidden="true">${String(index+1).padStart(2,'0')}</p><h2>${e(channel.title)}</h2><p class="reading">${e(channel.description)}</p><p class="reading muted">${e(channel.detail)}</p></div>${journeyScene(channel.scene,scenes)}</section>`;
  }).join('');
}

export function journeyScene(id,scenes) {
    const scene=scenes.scenes.find(item=>item.id===id);
    if(!scene||![scene.colorToken,scene.accentToken,scene.detailToken||scene.accentToken].every(token=>/^--color-[a-z0-9]+$/.test(token))) throw new Error('Invalid artist journey scene');
    const shapes=scene.elements.map(element=>{
      if(element.shape==='wave'){
        if(!/^[MmCcSsLlHhVvQqTtZz\d.,\s-]+$/.test(element.path||''))throw new Error('Invalid wave path');
        return `<svg class="journey-shape journey-shape--wave" viewBox="0 0 640 160" fill="none" aria-hidden="true"><defs><linearGradient id="journey-${e(scene.id)}-spectrum"><stop stop-color="var(--scene-color)"/><stop offset="0.5" stop-color="var(--scene-accent)"/><stop offset="1" stop-color="var(--scene-detail)"/></linearGradient></defs><path pathLength="1" d="${e(element.path)}" stroke="url(#journey-${e(scene.id)}-spectrum)" vector-effect="non-scaling-stroke"/></svg>`;
      }
      if(!['bar','line','card','ring','glow'].includes(element.shape)) throw new Error('Invalid journey shape');
      return `<span class="journey-shape journey-shape--${element.shape}" style="--shape-scale:${Number(element.size??1)}">${e(element.label||'')}</span>`;
    }).join('');
    if(scene.presentation && scene.presentation!=='ambient') throw new Error('Invalid scene presentation');
    return `<div class="artist-journey__artwork journey-scene journey-scene--${e(scene.id)}${scene.presentation?' journey-scene--'+e(scene.presentation):''}" data-journey-scene="${e(scene.id)}" style="--scene-color:var(${scene.colorToken});--scene-accent:var(${scene.accentToken});--scene-detail:var(${scene.detailToken||scene.accentToken})" aria-hidden="true">${shapes}</div>`;
}

export function intakeForm(config,icons) {
  if(config.deploymentPending) {
    const preview=intakeForm({...config,deploymentPending:false},icons).replace('data-enquiry>','data-enquiry-pending>');
    return `<p role="status" class="reading">${e(config.pendingLabel)}</p>${preview}`;
  }
  if(!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(config.action)) throw new Error('Unapproved form endpoint');
  if(!/^[\w-]+$/.test(config.captchaSiteKey)) throw new Error('Missing CAPTCHA site key');
  if(config.formType && config.formType!=='contact') throw new Error('Unsupported form type');
  if(!config.requiredLabel||!config.requiredHint)throw new Error('Missing shared required-field indicators');
  const requiredMark=` <span class="artist-enquiry__required" aria-hidden="true">${e(config.requiredLabel)}</span>`;
  const discovery=config.formType?'':artistDiscovery(config.artistDiscovery,icons);
  const fields=(config.formType?`<input type="hidden" name="formtype" value="${e(config.formType)}">`:'')+config.fields.map(field=>{
    if(!/^[a-z]+$/.test(field.name)) throw new Error('Invalid form field name');
    const attributes=`class="ui-field" id="enquiry-${field.name}" name="${field.name}"${field.required?' required':''}${field.maxLength?` maxlength="${Number(field.maxLength)}"`:''}${field.autocomplete?` autocomplete="${e(field.autocomplete)}"`:''}`;
    let control;
    if(field.type==='textarea') control=`<textarea ${attributes} rows="6"></textarea>`;
    else if(field.type==='select') {
      const selected=config.defaults?.[field.name];
      if(selected!==undefined&&!field.options.includes(selected)) throw new Error('Invalid default selection');
      control=`<select ${attributes}>${field.options.map(option=>`<option${option===selected?' selected':''}>${e(option)}</option>`).join('')}</select>`;
    }
    else {
      if(!['text','email','url'].includes(field.type)) throw new Error('Unsupported form field type');
      control=`<input type="${field.type}" ${attributes}>`;
    }
    return `<div class="artist-enquiry__field"><label for="enquiry-${field.name}">${e(field.label)}${field.required?requiredMark:''}</label>${control}</div>${field.name==='artist'?discovery:''}`;
  }).join('');
  const more=config.formType?'':`<details class="artist-enquiry__review"><summary>${e(config.readMoreLabel)}</summary>${(config.reviewInformation||[]).map(section=>`<section><h3>${e(section.title)}</h3><p>${e(section.text)}</p></section>`).join('')}<a href="/partnerships/">Compare partnerships</a></details>`;
  const email=config.showEmailAlternative?`<div class="artist-enquiry__information"><p>${e(config.fallbackLabel)}</p><a href="mailto:${e(config.email)}">${e(config.email)}</a></div>`:'';
  return `<details class="artist-enquiry" data-enquiry><summary><span>${e(config.startLabel)}</span>${icon(config.disclosureIcon,icons)}</summary><form action="${e(config.action)}" method="post" aria-describedby="enquiry-required-hint enquiry-privacy"><p id="enquiry-required-hint" class="muted">${e(config.requiredHint)}</p><input type="hidden" name="appearance" value="light">${fields}${more}<div class="artist-enquiry__information"><p id="enquiry-privacy">${e(config.privacy)}</p><a href="${e(config.privacyUrl)}">${e(config.privacyLabel)}</a></div><label class="artist-enquiry__consent"><input type="checkbox" name="processing_acknowledgement" value="yes" required><span>${e(config.acknowledgement)}${requiredMark}</span></label><div data-enquiry-captcha data-sitekey="${e(config.captchaSiteKey)}"></div><p data-enquiry-status role="status" aria-live="polite"></p><button type="submit" disabled>${e(config.submitLabel)}</button>${email}</form></details>`;
}

function artistDiscovery(config,icons){
 if(!config)return '';
 return `<section class="artist-discovery" data-artist-discovery><h3>${e(config.title)}</h3><p>${e(config.description)}</p><div class="artist-discovery__search"><label>Artist name<input class="ui-field" type="search" maxlength="100" autocomplete="off" data-artist-query></label><button type="button" data-artist-search>${icon('search',icons)}Search</button></div><p class="muted">${e(config.privacy)}</p><p role="status" aria-live="polite" data-artist-status></p><div data-artist-results></div><div data-artist-selected aria-label="Selected artist profiles"></div><input type="hidden" name="streaming_profiles" value="[]"></section>`;
}
