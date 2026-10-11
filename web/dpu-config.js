import './course-nav.js';
import {lessons} from './dpu-config-data.js';
const files = document.querySelector('#yaml-files');
const lesson = document.querySelector('#yaml-lesson');
const targets = [
 ['management','Management cluster','DPF + Kamaji control planes'],
 ['bmc','DPU BMC','Redfish management'],
 ['firmware','DPU firmware','NIC settings + boot firmware'],
 ['os','DPU Arm Ubuntu','OS, files + system services'],
 ['network','DPU networking','OVS + port connections'],
 ['worker','DPU Kubernetes worker','Joins a tenant; hosts containers'],
];
for (const item of lessons) {
 const link=document.createElement('a');
 link.href=`#${item.id}`; link.textContent=item.label;
 files.append(link);
}
function element(tag, text, className) {
 const el=document.createElement(tag);
 if(text!==undefined)el.textContent=text;
 if(className)el.className=className;
 return el;
}
try {
 const response=await fetch('/yaml-examples.json');
 if(!response.ok)throw new Error('Examples unavailable');
 const examples=await response.json();
 function render() {
  const item=lessons.find(entry=>`#${entry.id}`===location.hash)||lessons[0];
  const example=examples[item.id];
  lesson.replaceChildren();
  for(const link of files.querySelectorAll('a')) {
   if(link.hash===`#${item.id}`)link.setAttribute('aria-current','step');
   else link.removeAttribute('aria-current');
  }
  const title=element('h2',item.title); title.tabIndex=-1;
  lesson.append(title,element('p',item.summary,'yaml-summary'),element('p',item.effect,'callout'));
  const map=element('div',undefined,'impact-map');
  map.setAttribute('aria-label','Where the selected YAML field takes effect');
  for(const [id,label,description] of targets) {
   const target=element('div',undefined,'impact-target'); target.dataset.target=id;
   target.append(element('strong',label),element('small',description)); map.append(target);
  }
  lesson.append(map);
  const grid=element('div',undefined,'yaml-grid');
  const codePanel=element('section',undefined,'yaml-panel');
  const toolbar=element('div',undefined,'yaml-toolbar');
  toolbar.append(element('h3','Prepared YAML'));
  const copy=element('button','Copy YAML'); toolbar.append(copy);
  const status=element('p','','copy-status'); status.setAttribute('role','status');
  const pre=element('pre'); pre.tabIndex=0; pre.setAttribute('aria-label','Complete prepared YAML; scroll to read');
  const code=element('code'); code.id='yaml-code'; code.dataset.file=item.id;
  for(const [i,line] of example.yaml.trimEnd().split('\n').entries()) {
   const row=element('span',undefined,'yaml-line');
   const number=element('span',String(i+1),'line-number'); number.setAttribute('aria-hidden','true');
   row.append(number,document.createTextNode(line+'\n')); code.append(row);
  }
  pre.append(code); codePanel.append(toolbar,status,pre);
  copy.addEventListener('click',async()=>{
   try {await navigator.clipboard.writeText(example.yaml); status.textContent='YAML copied.';}
   catch {const range=document.createRange();range.selectNodeContents(code);getSelection().removeAllRanges();getSelection().addRange(range);status.textContent='Use ⌘C on Mac or Ctrl+C to copy the selected YAML.';}
  });
  const explanation=element('section',undefined,'yaml-explanation');
  explanation.append(element('h3','What does it change?'),element('p','Select a field to highlight its YAML and the affected part of the system.','small'));
  const buttons=element('div',undefined,'field-buttons');
  const detail=element('div',undefined,'field-detail'); detail.id='field-explanation';detail.setAttribute('aria-live','polite');
  const fieldButtons=[];
  function select(index, scroll=false) {
   const [label,match,target,text,occurrence=0]=item.fields[index];
   for(const [i,button] of fieldButtons.entries())button.setAttribute('aria-pressed',String(i===index));
   for(const el of map.children)el.dataset.active=String(el.dataset.target===target);
   for(const line of code.children)line.classList.remove('selected-line');
   const line=[...code.children].filter(line=>line.lastChild.textContent.includes(match))[occurrence];
   if(line){line.classList.add('selected-line');if(scroll)pre.scrollTop=line.offsetTop-code.offsetTop-pre.clientHeight/3;}
   detail.replaceChildren(element('h4',label),element('p',text));
  }
  for(const [i,field] of item.fields.entries()) {
   const button=element('button',field[0]);button.addEventListener('click',()=>select(i,true));
   fieldButtons.push(button);buttons.append(button);
  }
  explanation.append(buttons,detail);
  grid.append(codePanel,explanation);lesson.append(grid);
  const provenance=element('details',undefined,'yaml-provenance');
  provenance.append(element('summary','Original file and training changes'),element('p',example.source));
  provenance.append(element('p','Complete file content with fictional replacements for lab IP addresses and the DPU identity. The original files remain unchanged. The NVIDIA bundle URL and configuration values are retained; no image is downloaded by this lesson.'));
  lesson.append(provenance);
  select(0);title.focus({preventScroll:true});
 }
 render();window.addEventListener('hashchange',render);
} catch {
 lesson.replaceChildren(element('p','The prepared YAML examples could not load. Refresh the page to try again.'));
}
