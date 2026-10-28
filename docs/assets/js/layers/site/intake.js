/* Confirm only an explicit server receipt; never infer acceptance from an opaque request. */
import {bindArtistDiscovery} from './artist-discovery.js';
export async function bindIntake() {
  const confirmation=document.querySelector('[data-submission-confirmation]');
  if(confirmation){
    let reference;
    try{reference=sessionStorage.getItem('artanrecords-submission-reference');}catch{}
    if(/^[0-9a-f-]{36}$/.test(reference||'')){
      const field=confirmation.querySelector('[data-enquiry-reference]');
      field.querySelector('span').textContent=reference;field.hidden=false;
    }else{location.replace('/submit/');}
    return;
  }
  const disclosure=document.querySelector('[data-enquiry]');
  if(!disclosure) return;
  const response=await fetch('/assets/data/artists/intake.json',{cache:'no-store'});
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
    status.textContent='';
    const loading=document.querySelector('.ui-loading-surface');
    const loadingLabel=loading?.getAttribute('aria-label');
    loading?.setAttribute('aria-label',config.sendingLabel);
    window.NeuroartanPageLoading?.start();
    if(!config.submissionEndpoint)return;
    let navigating=false;
    try{
      const response=await fetch(config.submissionEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(new FormData(form))),credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(60000)});
      const receipt=await response.json();
      if(!response.ok||receipt.accepted!==true||!/^[0-9a-f-]{36}$/.test(receipt.reference||'')){
        invalidate();window.grecaptcha?.reset();status.textContent=receipt.uncertain?config.uncertainLabel:config.failedLabel;return;
      }
      sessionStorage.setItem('artanrecords-submission-reference',receipt.reference);
      location.assign(config.confirmationPath);
      navigating=true;
    }catch{invalidate();window.grecaptcha?.reset();status.textContent=config.uncertainLabel;}
    finally{if(!navigating){window.NeuroartanPageLoading?.finish();if(loadingLabel)loading.setAttribute('aria-label',loadingLabel);}}
  });
  window.addEventListener('pageshow',event=>{if(event.persisted){invalidate();window.grecaptcha?.reset();}});
}
