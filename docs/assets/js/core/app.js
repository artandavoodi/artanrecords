import {initializeTheme,bindTheme} from './theme.js';
import {initializePreferences} from './preferences.js';
import {bindNavigation} from '../layers/site/navigation.js';
import {bindIntake} from '../layers/site/intake.js';
import {bindArtistPreview} from '../layers/site/artist-preview.js';
import {bindArtistGrain} from '../layers/site/artist-grain.js';
import {bindArtistJourney,bindJourneyScenes} from '../layers/site/artist-journey.js';
import {bindHomeIntroduction} from '../layers/site/home-introduction.js';
import {bindHomeShowcase} from '../layers/site/home-showcase.js';
import {bindReleaseDiscovery} from '../layers/site/releases.js';
import {bindInformationTabs} from '../layers/site/information-tabs.js';
import {bindPartnershipComparison} from '../layers/site/partnerships.js';
import {bindPublicArtist} from '../layers/site/artist-platform.js';
import {routeArtistRequest,bindNotFound} from '../layers/site/not-found.js';
initializeTheme();
await routeArtistRequest().catch(console.error);
try {
  const theme=document.querySelector('[data-theme-toggle]');
  const menu=document.querySelector('[data-menu-toggle]');
  bindTheme({dark:theme.dataset.darkLabel,light:theme.dataset.lightLabel});
  bindNavigation({menuOpen:menu.getAttribute('aria-label'),menuClose:menu.dataset.closeLabel});
  document.documentElement.dataset.enhanced='true';
} catch(error) { console.error(error); }
bindIntake().catch(console.error);
bindArtistPreview().catch(console.error);
bindArtistGrain().catch(console.error);
bindArtistJourney();
bindHomeIntroduction();
bindHomeShowcase();
bindReleaseDiscovery();
bindInformationTabs();
bindPartnershipComparison();
try{
 await bindPublicArtist();
 await bindNotFound();
 await document.fonts?.ready;
 await window.NeuroartanPageLoading?.images(document.body);
}finally{window.NeuroartanPageLoading?.finish();window.dispatchEvent(new Event('site:ready'));}
// Re-read the published snapshot when returning from Studio, without reloading the catalogue.
window.addEventListener('focus',()=>bindPublicArtist());
document.addEventListener('visibilitychange',()=>{if(!document.hidden)bindPublicArtist();});
initializePreferences().catch(console.error);
bindJourneyScenes().catch(console.error);
function reveal(){
  const element=document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if(!element) return;
  for(let parent=element;parent;parent=parent.parentElement) if(parent instanceof HTMLDetailsElement) parent.open=true;
  const details=element.querySelector('details');
  if(details) details.open=true;
}
reveal();addEventListener('hashchange',reveal);
