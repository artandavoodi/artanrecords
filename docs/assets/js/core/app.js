import {initializeTheme,bindTheme} from './theme.js';
import {bindNavigation} from '../layers/site/navigation.js';
initializeTheme();
try {
  const response=await fetch('/assets/data/site.json');
  if(!response.ok) throw new Error('Site configuration unavailable');
  const site=await response.json();
  bindTheme(site.labels);
  bindNavigation(site.labels);
  document.documentElement.dataset.enhanced='true';
} catch(error) { console.error(error); }
function reveal(){
  const element=document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if(!element) return;
  for(let parent=element;parent;parent=parent.parentElement) if(parent instanceof HTMLDetailsElement) parent.open=true;
  const details=element.querySelector('details');
  if(details) details.open=true;
}
reveal();addEventListener('hashchange',reveal);
