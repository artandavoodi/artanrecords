import {escape as e,icon} from './render.mjs';

export function intakeForm(config,icons) {
  if(new URL(config.action).origin!=='https://formsubmit.co') throw new Error('Unapproved form processor');
  const fields=config.fields.map(field=>{
    if(!/^[a-z]+$/.test(field.name)) throw new Error('Invalid form field name');
    const attributes=`id="enquiry-${field.name}" name="${field.name}"${field.required?' required':''}${field.maxLength?` maxlength="${Number(field.maxLength)}"`:''}${field.autocomplete?` autocomplete="${e(field.autocomplete)}"`:''}`;
    let control;
    if(field.type==='textarea') control=`<textarea ${attributes} rows="6"></textarea>`;
    else if(field.type==='select') control=`<select ${attributes}>${field.options.map(option=>`<option>${e(option)}</option>`).join('')}</select>`;
    else {
      if(!['text','email','url'].includes(field.type)) throw new Error('Unsupported form field type');
      control=`<input type="${field.type}" ${attributes}>`;
    }
    return `<div class="artist-enquiry__field"><label for="enquiry-${field.name}">${e(field.label)}</label>${control}</div>`;
  }).join('');
  return `<details class="artist-enquiry"><summary><span>${e(config.startLabel)}</span>${icon(config.disclosureIcon,icons)}</summary><form action="${e(config.action)}" method="post" aria-describedby="enquiry-privacy"><input type="hidden" name="_subject" value="${e(config.subject)}">${fields}<div class="artist-enquiry__information"><p id="enquiry-privacy">${e(config.privacy)}</p><a href="${e(config.privacyUrl)}">${e(config.privacyLabel)}</a></div><label class="artist-enquiry__consent"><input type="checkbox" name="processing_acknowledgement" value="yes" required><span>${e(config.acknowledgement)}</span></label><button type="submit">${e(config.submitLabel)}</button><div class="artist-enquiry__information"><p>${e(config.fallbackLabel)}</p><a href="mailto:${e(config.email)}">${e(config.email)}</a></div></form></details>`;
}
