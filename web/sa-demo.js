import './course-nav.js';
import {showFleetProfile} from './sa-demo-fleet.js';
import {slides,services,icon} from './sa-demo-data.js';
import {mountGuideDiagrams} from './guide-diagrams.js';
const $=id=>document.getElementById(id);
let index=0, diagrams=null, notesOpen=false;
$('sa-topics').innerHTML=slides.map((s,i)=>`<a href="#${s.id}"><span>${String(i+1).padStart(2,'0')}</span>${s.label}</a>`).join('');
function showService(id) {
 const s=services[id];
 if(!s)return;
 for(const button of document.querySelectorAll('[data-service]'))button.setAttribute('aria-pressed',String(button.dataset.service===id));
 $('sa-service-detail').innerHTML=`${icon(s.icon)}<div><h2>${s.name}: ${s.summary}</h2><p>${s.detail}</p><p class="sa-proof"><strong>Verify:</strong> ${s.proof}</p><a href="${s.source}" target="_blank" rel="noopener noreferrer">Official deployment reference ↗</a></div>`;
}
function render(focus=false) {
 diagrams?.dispose();
 const found=slides.findIndex(s=>'#'+s.id===location.hash);
 index=found<0?0:found;
 const slide=slides[index];
 $('sa-slide').dataset.slide=slide.id;
 $('sa-slide').innerHTML=`<h1 id="sa-title" tabindex="-1">${slide.title}</h1><p class="sa-lead">${slide.lead}</p>${slide.body()}`;
 diagrams=mountGuideDiagrams($('sa-slide'));
 if(slide.id==='selection')showFleetProfile('baseline');
 if(slide.id==='services')showService('hbn');
 $('sa-counter').textContent=`${index+1} / ${slides.length} · ${slide.label}`;
 $('sa-prev').disabled=index===0;$('sa-next').disabled=index===slides.length-1;
 $('sa-notes').textContent=slide.notes;$('sa-notes').hidden=!notesOpen;
 $('sa-sources').innerHTML='References: '+slide.refs.map(([name,url])=>`<a href="${url}" target="_blank" rel="noopener noreferrer">${name}</a>`).join(' · ');
 for(const link of $('sa-topics').querySelectorAll('a')) {
  if(link.hash==='#'+slide.id)link.setAttribute('aria-current','step');else link.removeAttribute('aria-current');
 }
 if(focus){$('sa-title').focus({preventScroll:true});window.scrollTo({top:0});}
}
function move(delta){const next=index+delta;if(next>=0&&next<slides.length)location.hash=slides[next].id;}
function present(value){document.body.dataset.presenting=String(value);$('sa-present').setAttribute('aria-pressed',String(value));$('sa-present').textContent=value?'Exit presentation':'Presentation mode';}
$('sa-prev').onclick=()=>move(-1);$('sa-next').onclick=()=>move(1);
$('sa-slide').addEventListener('click',event=>{const button=event.target.closest('[data-service]');if(button)showService(button.dataset.service);const profile=event.target.closest('[data-fleet-profile]');if(profile)showFleetProfile(profile.dataset.fleetProfile);});
$('sa-present').onclick=()=>present(document.body.dataset.presenting!=='true');
$('sa-notes-toggle').onclick=()=>{notesOpen=!notesOpen;$('sa-notes-toggle').setAttribute('aria-expanded',String(notesOpen));$('sa-notes').hidden=!notesOpen;};
document.addEventListener('keydown',event=>{
 if(event.key==='Escape'){present(false);return;}
 if(event.ctrlKey||event.metaKey||event.altKey||event.shiftKey||event.target.closest('input,textarea,select,[role="region"],[contenteditable="true"]'))return;
 if(event.key==='ArrowRight'){event.preventDefault();move(1);}
 if(event.key==='ArrowLeft'){event.preventDefault();move(-1);}
});
window.addEventListener('hashchange',()=>render(true));
window.addEventListener('pagehide',()=>diagrams?.pause());
render();
