import {escape as e,icon} from './render.mjs';

export function intakeJourney(channels,scenes) {
  return channels.map((channel,index)=>{
    return `<section class="artist-journey__step" data-journey-step><div class="artist-journey__copy"><p class="artist-journey__number" aria-hidden="true">${String(index+1).padStart(2,'0')}</p><h2>${e(channel.title)}</h2><p class="reading">${e(channel.description)}</p><p class="reading muted">${e(channel.detail)}</p></div>${journeyScene(channel.scene,scenes)}</section>`;
  }).join('');
}

export function journeyScene(id,scenes) {
    const scene=scenes.scenes.find(item=>item.id===id);
    if(!scene||![scene.colorToken,scene.accentToken].every(token=>/^--color-[a-z0-9]+$/.test(token))) throw new Error('Invalid artist journey scene');
    const shapes=scene.elements.map(element=>{
      if(!['bar','card','ring'].includes(element.shape)) throw new Error('Invalid journey shape');
      return `<span class="journey-shape journey-shape--${element.shape}" style="--shape-scale:${Number(element.size??1)}">${e(element.label||'')}</span>`;
    }).join('');
    return `<div class="artist-journey__artwork journey-scene journey-scene--${e(scene.id)}" data-journey-scene="${e(scene.id)}" style="--scene-color:var(${scene.colorToken});--scene-accent:var(${scene.accentToken})" aria-hidden="true">${shapes}</div>`;
}

export function intakeForm(config,icons) {
  if(config.deploymentPending) {
    const preview=intakeForm({...config,deploymentPending:false},icons).replace('data-enquiry>','data-enquiry-pending>');
    return `<p role="status" class="reading">${e(config.pendingLabel)}</p>${preview}`;
  }
  if(!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(config.action)) throw new Error('Unapproved form endpoint');
  if(!/^[\w-]+$/.test(config.captchaSiteKey)) throw new Error('Missing CAPTCHA site key');
  if(config.formType && config.formType!=='contact') throw new Error('Unsupported form type');
  const fields=(config.formType?`<input type="hidden" name="formtype" value="${e(config.formType)}">`:'')+config.fields.map(field=>{
    if(!/^[a-z]+$/.test(field.name)) throw new Error('Invalid form field name');
    const attributes=`id="enquiry-${field.name}" name="${field.name}"${field.required?' required':''}${field.maxLength?` maxlength="${Number(field.maxLength)}"`:''}${field.autocomplete?` autocomplete="${e(field.autocomplete)}"`:''}`;
    let control;
    if(field.type==='textarea') control=`<textarea ${attributes} rows="6"></textarea>`;
    else if(field.type==='select') control=`<select ${attributes}>${field.options.map(option=>`<option>${e(option)}</option>`).join('')}</select>`;
    else {
      if(!['text','email','url'].includes(field.type)) throw new Error('Unsupported form field type');
      control=`<input type="${field.type}" ${attributes}>`;
    }
    return `<div class="artist-enquiry__field"><label for="enquiry-${field.name}">${e(field.label)}${field.required&&config.requiredLabel?' '+e(config.requiredLabel):''}</label>${control}</div>`;
  }).join('');
  return `<details class="artist-enquiry" data-enquiry><summary><span>${e(config.startLabel)}</span>${icon(config.disclosureIcon,icons)}</summary><form action="${e(config.action)}" method="post" aria-describedby="enquiry-privacy"><input type="hidden" name="appearance" value="light">${fields}<div class="artist-enquiry__information"><p id="enquiry-privacy">${e(config.privacy)}</p><a href="${e(config.privacyUrl)}">${e(config.privacyLabel)}</a></div><label class="artist-enquiry__consent"><input type="checkbox" name="processing_acknowledgement" value="yes" required><span>${e(config.acknowledgement)}</span></label><div data-enquiry-captcha data-sitekey="${e(config.captchaSiteKey)}"></div><p data-enquiry-status role="status" aria-live="polite"></p><button type="submit" disabled>${e(config.submitLabel)}</button><div class="artist-enquiry__information"><p>${e(config.fallbackLabel)}</p><a href="mailto:${e(config.email)}">${e(config.email)}</a></div></form></details>`;
}
