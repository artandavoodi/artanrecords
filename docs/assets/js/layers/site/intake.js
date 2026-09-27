/* Native POST preserves a verifiable server response; no opaque fetch success. */
export async function bindIntake() {
  const disclosure=document.querySelector('[data-enquiry]');
  if(!disclosure) return;
  const response=await fetch('/assets/data/artists/intake.json');
  if(!response.ok) return;
  const {form:config}=await response.json();
  const form=disclosure.querySelector('form');
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
    };
    const script=document.createElement('script');
    script.src='https://www.google.com/recaptcha/api.js?onload=artanEnquiryCaptchaReady&render=explicit';
    script.async=true;
    script.onerror=()=>{invalidate();status.textContent=config.captchaUnavailable;};
    document.head.append(script);
  };
  disclosure.addEventListener('toggle',load);
  load();
  form.addEventListener('submit',event=>{
    if(!verified){event.preventDefault();status.textContent=config.captchaRequired;return;}
    form.elements.appearance.value=document.documentElement.dataset.themeEffective==='dark'?'dark':'light';
    button.disabled=true;
    status.textContent=config.sendingLabel;
  });
  window.addEventListener('pageshow',event=>{if(event.persisted){invalidate();window.grecaptcha?.reset();}});
}
