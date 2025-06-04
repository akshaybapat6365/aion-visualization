export default function dynamicExample(el){
  el.classList.remove('sr-only');
  el.textContent = 'Thanks for exploring Aion!';
  el.style.padding = '1rem';
  el.style.textAlign = 'center';
  el.style.fontSize = '1.2rem';
  el.style.background = 'var(--surface-secondary)';
  el.style.color = 'var(--text-primary)';
}
