// Rendering and navigation smoke test; no browser or external dependency required.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const data = JSON.parse(fs.readFileSync('data/pilot_map.json', 'utf8'));
data.competenceSummaries = JSON.parse(fs.readFileSync('data/competence_summaries.json', 'utf8'));
data.teamInstitutes = {Biotec: ['ISI Biotecnologia'], CIS: ['CIS Saúde Ocupacional']};
data.competencias.A.subdivisions.A5.bullets = [
  data.competencias.A.subdivisions.A5.bullets[0],
  'Plasma — Tecnologia de plasma aplicada à ativação e funcionalização de superfícies, promovendo limpeza, aumento de energia superficial, melhoria da adesão e deposição de revestimentos em diferentes materiais.',
];
const script = fs.readFileSync('mapa/static/mapa/js/app.js', 'utf8');

function render(search) {
  const nodes = new Map();
  function element(key) {
    if (!nodes.has(key)) nodes.set(key, {
      innerHTML: '', hidden: true, textContent: '', events: {},
      addEventListener(type, fn) { this.events[type] = fn; },
      querySelector(selector) { return element(key + selector); },
      querySelectorAll() { return []; },
      hasChildNodes() { return true; },
      getBoundingClientRect() { return {height: 100}; },
    });
    return nodes.get(key);
  }
  element('pilot-data').textContent = JSON.stringify(data);
  const classes = new Set();
  const window = {location: {search, pathname: '/', assign(url) { this.destination = url; }}, scrollTo() {}};
  const document = {
    body: {style: {}, classList: {toggle(name, enabled) { enabled ? classes.add(name) : classes.delete(name); }}},
    documentElement: {style: {setProperty() {}}},
    getElementById: element, querySelector: element, addEventListener() {},
  };
  vm.runInNewContext(script, {window, document, URLSearchParams, ResizeObserver: class {observe() {}}});
  return {window, document, classes, element};
}

let count = 0;
for (const [letter, section] of Object.entries(data.competencias)) {
  for (const [code, sub] of Object.entries(section.subdivisions)) {
    const page = render('?competencia=' + code);
    const html = page.element('app').innerHTML;
    assert(page.classes.has('competence-page'));
    assert.equal((html.match(/class="competence-row"/g) || []).length, sub.bullets.length);
    assert.equal((html.match(/class="competence-subtitle"/g) || []).length, sub.bullets.filter(b => data.competenceSummaries[b] !== b).length);
    assert.equal((html.match(/Ver descrição completa/g) || []).length, 0);
    if (code === 'A5') {
      assert(html.includes('Eletroquímica em alta e baixa temperatura'));
      assert(html.includes('>Plasma</h3>'));
      assert.equal((html.match(/class="competence-subtitle"/g) || []).length, 2);
    }
    assert.equal((html.match(/class="institute-tag"/g) || []).length, 0);
    assert.equal(page.element('overlay').hidden, true);
    assert(page.document.title.startsWith(code + ' — '));
    page.element('app[data-nav="rdcat2"]').events.click();
    assert.equal(page.window.location.destination, '?eixo=' + letter);
    page.element('btnCompResearchers').events.click();
    assert.equal(page.element('overlay').hidden, false);
    count++;
  }
}
const invalid = render('?competencia=INVALID');
assert(!invalid.classes.has('competence-page'));
assert(!render('?eixo=A').classes.has('competence-page'));
console.log(`${count} competence pages: rendering, tag removal, contacts, back links and invalid URLs passed.`);
