/* Confirm only an explicit server receipt; never infer acceptance from an opaque request. */
import {bindArtistDiscovery} from './artist-discovery.js';
export async function bindIntake() {
  const disclosure=document.querySelector('[data-enquiry]');
  if(!disclosure) return;
  const response=await fetch('/assets/data/artists/intake.json');
  if(!response.ok) return;
  const form=disclosure.querySelector('form');
  const settings=await response.json(),config=form.elements.formtype?{...settings.form,...settings.contact.form,submissionEndpoint:null}:settings.form;
  bindArtistDiscovery(form,config.artistDiscovery);
  const button=form.querySelector('[type="submit"]');
  const status=form.querySelector('[data-enquiry-status]');
  let started=false, verified=false;
  const invalidate=()=>{verified=false;button.disabled=true;status.textContent=config.captchaRequired;};
  const load=()=>{
    if(!disclosure.open||started) return;
    started=true;
    status.textContent=config.captchaLoading;
    window.artanEnquiryCaptchaReady=()=>{
      window.grecaptcha.render(form.querySelector('[data-enquiry-captcha]'),{
        sitekey:config.captchaSiteKey,
        theme:document.documentElement.dataset.themeEffective==='dark'?'dark':'light',
        size:'compact',
        callback:()=>{verified=true;button.disabled=false;status.textContent='';},
        'expired-callback':invalidate,
        'error-callback':()=>{invalidate();status.textContent=config.captchaUnavailable;}
      });
      if(!verified)status.textContent=config.captchaRequired;
    };
    const script=document.createElement('script');
    script.src='https://www.google.com/recaptcha/api.js?onload=artanEnquiryCaptchaReady&render=explicit';
    script.async=true;
    script.onerror=()=>{invalidate();status.textContent=config.captchaUnavailable;};
    document.head.append(script);
  };
  disclosure.addEventListener('toggle',load);
  load();
  form.addEventListener('submit',async event=>{
    if(!verified){event.preventDefault();status.textContent=config.captchaRequired;return;}
    form.elements.appearance.value=document.documentElement.dataset.themeEffective==='dark'?'dark':'light';
    if(config.submissionEndpoint)event.preventDefault();
    button.disabled=true;
    status.textContent=config.sendingLabel;
    if(!config.submissionEndpoint)return;
    try{
      const response=await fetch(config.submissionEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(new FormData(form))),credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(60000)});
      const receipt=await response.json();
      if(!response.ok||receipt.accepted!==true||!/^[0-9a-f-]{36}$/.test(receipt.reference||'')){
        invalidate();window.grecaptcha?.reset();status.textContent=receipt.uncertain?config.uncertainLabel:config.failedLabel;return;
      }
      const confirmation=document.createElement('section'),heading=document.createElement('h3'),message=document.createElement('p'),reference=document.createElement('p');
      confirmation.dataset.enquiryReceipt='';confirmation.setAttribute('role','status');confirmation.tabIndex=-1;
      heading.textContent=config.receivedTitle;message.textContent=config.receivedDescription;reference.textContent=config.referenceLabel+': '+receipt.reference;
      confirmation.append(heading,message,reference);form.after(confirmation);form.hidden=true;confirmation.focus();
    }catch{invalidate();window.grecaptcha?.reset();status.textContent=config.uncertainLabel;}
  });
  window.addEventListener('pageshow',event=>{if(event.persisted){invalidate();window.grecaptcha?.reset();}});
}
