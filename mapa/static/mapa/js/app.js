window.__DATA__ = JSON.parse(document.getElementById('pilot-data').textContent);

(function(){
  "use strict";
  var DATA = window.__DATA__;
  var feedbackNode = document.getElementById('feedback-data');
  var FEEDBACK = JSON.parse(feedbackNode && feedbackNode.textContent ? feedbackNode.textContent : '[]');
  var appEl = document.getElementById('app');
  var crumbsEl = document.getElementById('crumbs');
  var overlay = document.getElementById('overlay');
  var panel = document.getElementById('panel');
  var header = document.querySelector('.topbar');
  var menuToggle = document.getElementById('menu-toggle');
  function closeMobileMenu(){
    if(menuToggle.getAttribute('aria-expanded') !== 'true') return;
    menuToggle.focus();
    menuToggle.setAttribute('aria-expanded', 'false');
    document.getElementById('main-menu').classList.remove('is-open');
    document.querySelectorAll('[data-top-menu][aria-expanded]').forEach(function(button){
      button.removeAttribute('aria-expanded');
    });
  }
  menuToggle.addEventListener('click', function(){
    if(menuToggle.getAttribute('aria-expanded') === 'true') closeMobileMenu();
    else {
      document.querySelectorAll('[data-top-menu]').forEach(function(button){
        button.setAttribute('aria-expanded', 'false');
      });
      menuToggle.setAttribute('aria-expanded', 'true');
      document.getElementById('main-menu').classList.add('is-open');
    }
  });
  document.addEventListener('keydown', function(event){
    if(event.key === 'Escape') closeMobileMenu();
  });
  if(window.matchMedia){
    window.matchMedia('(max-width: 599px), (max-width: 960px) and (max-height: 500px) and (pointer: coarse)').addEventListener('change', closeMobileMenu);
  }
  document.getElementById('qr-open').addEventListener('click', function(){
    closeMobileMenu();
    document.getElementById('map-qr').showModal();
  });
  var lastFocusedElement = null;
  new ResizeObserver(function(){
    document.documentElement.style.setProperty('--header-height', header.getBoundingClientRect().height+'px');
  }).observe(header);

  var LETTER_META = {
    A: {label:"Tecnologias e Processos Químicos", desc:"Rota tecnológica que vai da matéria-prima ao produto: pré-tratamento, processos químicos/biotecnológicos, catálise, digitalização e inteligência competitiva — cruzada com os setores de aplicação."},
    B: {label:"Conservação, Restauração & Monitoramento Socioambiental", desc:"Competências ligadas ao diagnóstico, reparação e recuperação de ecossistemas, do dano ambiental à restauração plena da biodiversidade nativa."},
    C: {label:"Inovação em Saúde", desc:"Competências que acompanham o funil de inovação em saúde, da inteligência epidemiológica à regulação e avaliação de tecnologias."},
    D: {label:"Biotecnologia", desc:"Desdobramento da competência A3 (Biotecnológicos) em cinco frentes técnicas próprias — fermentação, catálise enzimática, engenharia genética, cultivo celular e biorremediação."},
    E: {label:"Circularidade", desc:"Desdobramento de competências reais já mapeadas em A3, A4, A7, A11 e B3 (tratamento de efluentes, descarte de água produzida, remediação de áreas contaminadas e gestão digital de resíduos)."}
  };
  LETTER_META.F = {label:"Materiais", desc:"Competências relacionadas a materiais."};
  var AREA_LETTERS = ['A','B','C','D','E','F'];
  var entryTitles = {material:'Matérias-primas', competence:'Competências técnicas', sector:'Setores de aplicação'};

  var TEAM_COLOR = DATA.teamColors || {};
  function cardMeta(type, key){ return (DATA.cardMeta || {})[type+':'+key] || null; }
  function orderedHistory(meta){
    if(!meta || !Array.isArray(meta.history)) return [];
    // Older records can have been saved with the current edit before the
    // original snapshot. Keep the original at the top and preserve the
    // chronological order of all edits.
    return meta.history.filter(function(version){ return version.action === 'original'; })
      .concat(meta.history.filter(function(version){ return version.action !== 'original'; }));
  }
  function isOriginalHistoryVersion(version, meta){
    // A card created by a user has its first saved version as the base for
    // subsequent edits, even though older records call it "added".
    return version && (version.action === 'original' ||
      (version.action === 'added' && meta && !meta.is_new));
  }
  function changeBadge(type, key){
    var meta = cardMeta(type, key);
    if(!meta) return '';
    var hasAddedVersion = Array.isArray(meta.history) && meta.history.some(function(version){ return version.action === 'added'; });
    var isNew = meta.is_new || (hasAddedVersion && !meta.is_edited);
    return '<span class="card-change-badge '+(isNew?'card-change-new':'card-change-edited')+'">'+(isNew?'Novo':'Editado')+'</span>';
  }

  // ---------------- state / router ----------------
  var state = { view:'home', letter:null, sub:null, kind:null, index:null };

  var RD_CAT_LABEL = {novo:'Novo', modificacao:'Modificação', reciclagem:'Reciclagem / Circularidade'};

  function render(){
    var itemDetail = ['item', 'rdcategory', 'drill'].includes(state.view);
    document.body.classList.toggle('item-detail', itemDetail);
    document.body.classList.toggle('competence-page', state.view === 'competencia');
    if(state.view === 'home') renderHome();
    else if(state.view === 'catalog') renderCatalog(state.kind);
    else if(state.view === 'section') renderSection(state.letter);
    else if(state.view === 'item') renderItem();
    else if(state.view === 'rdcategory') renderRdCategory();
    else if(state.view === 'drill') renderDrill();
    else if(state.view === 'competencia') renderCompetenciaFull();
    if(state.view === 'section' || state.view === 'competencia'){
      appEl.querySelectorAll('.sub-card-wrap, .competence-pair, .view-head + .competence-contacts').forEach(function(card, index){
        var contactsOnly = card.classList.contains('competence-contacts');
        var label = contactsOnly ? 'Contatos do eixo' : 'Detalhes e contatos';
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'card-details-toggle';
        button.textContent = label;
        button.setAttribute('aria-expanded', 'false');
        card.id = 'map-detail-' + index;
        button.setAttribute('aria-controls', card.id);
        if(contactsOnly) card.before(button);
        else card.appendChild(button);
        button.addEventListener('click', function(){
          var expanded = card.classList.toggle('detail-expanded');
          button.setAttribute('aria-expanded', String(expanded));
          button.textContent = expanded ? 'Mostrar menos' : label;
        });
      });
    }
    if(state.view !== 'home'){
      appEl.querySelectorAll('.application-grid, .sub-grid, .competence-list, .client-grid, .company-grid, .rd-grid, .rd-choice-grid, .section-block').forEach(function(list){
        window.compactMapList(list);
      });
    }
    if(itemDetail){
      appEl.querySelectorAll('.item-disclosure').forEach(function(section, index){
        var heading = section.querySelector('h4');
        var content = section.querySelector('.item-content');
        content.id = 'item-content-' + index;
        var button = document.createElement('button');
        button.type = 'button';
        button.textContent = heading.textContent;
        var desktopLabel = document.createElement('span');
        desktopLabel.textContent = heading.textContent;
        heading.replaceChildren(desktopLabel);
        button.setAttribute('aria-controls', content.id);
        button.setAttribute('aria-expanded', 'false');
        heading.appendChild(button);
        button.addEventListener('click', function(){
          button.setAttribute('aria-expanded', String(section.classList.toggle('detail-expanded')));
        });
      });
    }
    addDetailEditAction();
    renderCrumbs();
    updateSidebar();
    updateTopMenu();
  }

  function addDetailEditAction(){
    if(state.view !== 'competencia' || document.getElementById('btnCompEdit')) return;
    var actions = document.querySelector('#app .cta-row');
    if(!actions) return;
    var button = document.createElement('button'); button.type='button'; button.className='btn btn-primary'; button.id='btnCompEdit'; button.textContent='Editar card';
    actions.insertBefore(button, actions.firstChild);
    button.addEventListener('click', function(){ openEditPanel('competencia', state.code, false); });
  }

  function entryItems(){
    return {
      material: DATA.materialsLeft.map(function(item, index){ return {label:item.nome, kind:'material', index:index}; }),
      competence: AREA_LETTERS.map(function(letter){ return {label:letter+'. '+LETTER_META[letter].label, kind:'competence', letter:letter}; }),
      sector: DATA.sectorsRight.map(function(item, index){ return {label:item.nome, kind:'sector', index:index}; })
    };
  }

  function renderCatalog(kind){
    var cards = entryItems()[kind].map(function(item){
      var query = item.letter ? 'eixo='+item.letter : (kind === 'material' ? 'materia=' : 'setor=')+item.index;
      return '<a class="application-card" href="?'+query+'"><strong>'+escapeHtml(item.label)+'</strong></a>';
    });
    appEl.innerHTML = '<div class="view-head"><a class="back-link" href="'+window.location.pathname+'">&larr; Voltar ao início</a><h2>'+entryTitles[kind]+'</h2></div><div class="application-grid">'+cards.join('')+'</div>';
    document.title = entryTitles[kind]+' | Firjan SENAI';
  }

  function updateTopMenu(){
    var menuItems = entryItems();
    document.querySelectorAll('[data-top-menu-group]').forEach(function(group){
      var kind = group.getAttribute('data-top-menu-group');
      var dropdown = group.querySelector('.top-menu-dropdown');
      if(dropdown && dropdown.dataset.ready !== 'true'){
        (menuItems[kind] || []).forEach(function(item){
          var option = document.createElement('button');
          option.type = 'button';
          option.className = 'top-menu-option';
          option.setAttribute('role', 'menuitem');
          option.textContent = item.label;
          option.addEventListener('click', function(){
            closeMobileMenu();
            if(item.letter) goSection(item.letter);
            else goItem(item.kind, item.index);
          });
          dropdown.appendChild(option);
        });
        dropdown.dataset.ready = 'true';
      }
    });
    document.querySelectorAll('[data-top-menu]').forEach(function(button){
      var kind = button.getAttribute('data-top-menu');
      var active = (kind === 'competence' && (state.view === 'section' || state.view === 'competencia')) ||
        (kind === state.itemKind && ['item','rdcategory','drill'].indexOf(state.view) !== -1);
      if(active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
      if(button.dataset.bound === 'true') return;
      button.dataset.bound = 'true';
      button.addEventListener('click', function(){
        if(menuToggle.getAttribute('aria-expanded') === 'true'){
          var expand = button.getAttribute('aria-expanded') !== 'true';
          document.querySelectorAll('[data-top-menu]').forEach(function(item){
            item.setAttribute('aria-expanded', String(item === button && expand));
          });
          return;
        }
        if(kind === 'competence') goSection('A');
        else goItem(kind, 0);
      });
    });
  }

  function updateSidebar(){
    var nav = document.getElementById('sidebar-nav');
    if(!nav.hasChildNodes()){
      [
        {title:'Matérias-primas', kind:'material', items:DATA.materialsLeft},
        {title:'Competências', kind:'competence', items:AREA_LETTERS.map(function(letter){ return {nome:letter+'. '+LETTER_META[letter].label, letter:letter}; })},
        {title:'Aplicações', kind:'sector', items:DATA.sectorsRight}
      ].forEach(function(group){
        var section = document.createElement('details');
        section.open = true;
        section.className = 'sidebar-group';
        var title = document.createElement('summary');
        title.textContent = group.title;
        section.appendChild(title);
        var list = document.createElement('ul');
        group.items.forEach(function(item, index){
          var row = document.createElement('li');
          var button = document.createElement('button');
          button.className = 'sidebar-link';
          button.textContent = item.nome;
          button.dataset.kind = group.kind;
          button.dataset.index = index;
          if(item.letter) button.dataset.letter = item.letter;
          button.addEventListener('click', function(){
            if(item.letter) goSection(item.letter);
            else goItem(group.kind, index);
          });
          row.appendChild(button);
          list.appendChild(row);
        });
        section.appendChild(list);
        nav.appendChild(section);
      });
    }
    nav.querySelectorAll('button').forEach(function(button){
      var active = button.dataset.home ? state.view === 'home' :
        button.dataset.letter ? state.view === 'section' && state.letter === button.dataset.letter :
        ['item','rdcategory','drill','competencia'].indexOf(state.view) !== -1 && state.itemKind === button.dataset.kind && state.itemIndex === Number(button.dataset.index);
      if(active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
  }

  function itemObj(){
    return state.itemKind === 'material' ? DATA.materialsLeft[state.itemIndex] : DATA.sectorsRight[state.itemIndex];
  }

  // Walks DATA.sectorLayers[sectorName] down a path of keys (branch.children.branch...)
  // and returns the node found at the end, or null.
  function drillNode(sectorName, path){
    var nodes = DATA.sectorLayers[sectorName] || [];
    var node = null;
    for(var i=0;i<path.length;i++){
      node = (nodes || []).find(function(n){ return n.key === path[i]; });
      if(!node) return null;
      nodes = node.children;
    }
    return node;
  }

  function renderCrumbs(){
    var parts = [];
    if(state.view === 'section'){
      parts.push('<span class="sep">/</span>');
      parts.push('<span class="current">'+state.letter+'. '+LETTER_META[state.letter].label+'</span>');
    }
    if(state.view === 'competencia'){
      parts.push('<span class="sep">/</span><button data-nav="section">'+state.letter+'. '+LETTER_META[state.letter].label+'</button>');
    }
    if(state.view === 'item' || state.view === 'rdcategory' || state.view === 'drill'){
      var it = itemObj();
      var itIsCurrent = state.view === 'item';
      parts.push('<span class="sep">/</span>');
      parts.push(itIsCurrent ? ('<span class="current">'+it.nome+'</span>') : ('<button data-nav="item">'+it.nome+'</button>'));
    }
    if(state.view === 'rdcategory'){
      var catLabel = RD_CAT_LABEL[state.category];
      parts.push('<span class="sep">/</span>');
      parts.push(state.view==='rdcategory' ? ('<span class="current">'+catLabel+'</span>') : ('<button data-nav="rdcategory">'+catLabel+'</button>'));
    }
    if(state.view === 'drill'){
      var path = state.path || [];
      var crumbPath = (state.view==='competencia') ? path : path.slice(0, path.length-1);
      var steps = (state.view==='competencia') ? path : path;
      for(var p=0;p<steps.length;p++){
        var sub = steps.slice(0,p+1);
        var n = drillNode(itemObj().nome, sub);
        if(!n) continue;
        var isLast = (p === steps.length-1) && state.view==='drill';
        parts.push('<span class="sep">/</span>');
        parts.push(isLast ? ('<span class="current">'+n.label+'</span>') : ('<button data-nav="drill" data-depth="'+(p+1)+'">'+n.label+'</button>'));
      }
    }
    if(state.view === 'competencia'){
      parts.push('<span class="sep">/</span>');
      parts.push('<span class="current">'+state.code+'</span>');
    }
    crumbsEl.innerHTML = parts.join('').replace(/^<span class="sep">\/<\/span>/, '');
    crumbsEl.hidden = !parts.length;
    crumbsEl.querySelectorAll('button[data-nav]').forEach(function(b){
      b.addEventListener('click', function(){
        var nav = b.getAttribute('data-nav');
        if(nav === 'home') goHome();
        else if(nav === 'section') goSection(state.letter);
        else if(nav === 'item') goItem(state.itemKind, state.itemIndex);
        else if(nav === 'rdcategory') goRdCategory(state.category);
        else if(nav === 'drill'){
          var depth = parseInt(b.getAttribute('data-depth'),10);
          state.path = (state.path||[]).slice(0, depth);
          state.view='drill'; render(); window.scrollTo({top:0});
        }
      });
    });
  }

  function goHome(){
    if(state.view === 'competencia'){ window.location.assign(window.location.pathname); return; }
    closeOverlayIfOpen(); state.view='home'; render(); window.scrollTo({top:0});
  }
  function goSection(letter){
    if(state.view === 'competencia'){ window.location.assign('?eixo='+encodeURIComponent(letter)); return; }
    closeOverlayIfOpen(); state.view='section'; state.letter=letter; render(); window.scrollTo({top:0});
  }
  function goItem(kind, index){ closeOverlayIfOpen(); state.view='item'; state.itemKind=kind; state.itemIndex=index; state.path=[]; render(); window.scrollTo({top:0}); }
  function goRdCategory(cat){ closeOverlayIfOpen(); state.view='rdcategory'; state.category=cat; render(); window.scrollTo({top:0}); }
  function goDrillInto(key){ closeOverlayIfOpen(); state.view='drill'; state.path=(state.path||[]).concat([key]); render(); window.scrollTo({top:0}); }
  function goDrillBack(){
    closeOverlayIfOpen();
    var p = (state.path||[]).slice(0,-1);
    if(p.length === 0){ goItem(state.itemKind, state.itemIndex); return; }
    state.path = p; state.view='drill'; render(); window.scrollTo({top:0});
  }
  function goCompetenciaFull(letter, code){ window.location.assign('?competencia='+encodeURIComponent(code)); }
  function closeOverlayIfOpen(){ if(overlay && !overlay.hidden) closePanel(); }

  // ---------------- HOME ----------------
  // Replaces the original sparse landing view with three clear entry points.
  function renderHome(){
    var html = '';
    html += '<div class="view-head home-hero"><h2>Mapa de competências</h2><p>Encontre a competência certa para o seu desafio</p></div>';
    var previewCount = 4;
    html += '<section class="home-applications" aria-label="Aplicações"><h3>Aplicações</h3><div class="application-grid" id="home-applications-grid">'+
      DATA.sectorsRight.map(function(sector, index){
        var extra = index >= previewCount ? ' application-extra' : '';
        return '<button type="button" class="application-card'+extra+'" data-home-sector="'+index+'"><strong>'+escapeHtml(sector.nome)+'</strong></button>';
      }).join('')+'</div>';
    var showAllLabel = 'Ver todas as '+DATA.sectorsRight.length+' aplicações';
    if(DATA.sectorsRight.length > previewCount){
      html += '<button class="application-toggle" type="button" aria-controls="home-applications-grid" aria-expanded="false">'+showAllLabel+'</button>';
    }
    html += '</section>';
    html += '<div class="home-start"><div><span class="home-start-kicker">Comece por onde fizer mais sentido</span><h3>Tr&ecirc;s portas de entrada para o mesmo mapa</h3></div><span class="home-start-hint">Voc&ecirc; pode mudar de caminho a qualquer momento.</span></div>';
    html += '<div class="home-entry-grid" id="home-entry-grid">';
    html += homeEntryHtml('material', 'Mat&eacute;rias-primas', 'Parta do insumo e descubra rotas de transforma&ccedil;&atilde;o, compet&ecirc;ncias e aplica&ccedil;&otilde;es.', DATA.materialsLeft.length, 'insumos dispon&iacute;veis');
    html += homeEntryHtml('competence', 'Compet&ecirc;ncias t&eacute;cnicas', 'Veja as capacidades organizadas nos cinco eixos do centro de tecnologia.', AREA_LETTERS.length, 'eixos para explorar');
    html += homeEntryHtml('sector', 'Setores de aplica&ccedil;&atilde;o', 'Encontre caminhos de P&amp;D conectados a mercados, produtos e desafios reais.', DATA.sectorsRight.length, 'setores mapeados');
    html += '</div><button type="button" class="entry-toggle" aria-controls="home-entry-grid" aria-expanded="false">Ver detalhes das três entradas</button>';
    html += '<div class="home-secondary"><div class="processos-note"><strong>Como navegar:</strong> abra uma entrada, selecione um card e use os links de conex&otilde;es para atravessar o mapa sem perder o contexto.</div>';
    html += '</div>';
    html += '<div class="footnote">Piloto de navega&ccedil;&atilde;o constru&iacute;do a partir dos materiais de refer&ecirc;ncia do projeto. Campos ainda n&atilde;o preenchidos aparecem como pendentes.</div>';
    html += '<footer class="feedback-callout"><button type="button" class="feedback-toggle" aria-expanded="false" aria-controls="feedback-intro feedback-actions">Ajude a melhorar o mapa</button><div id="feedback-intro"><span class="feedback-callout-label">Ajude a melhorar o mapa</span><strong>Encontrou algo que falta, sobra ou precisa ser corrigido?</strong><span>Opine livremente ou edite os cards com a palavra de seguran&ccedil;a.</span></div><div id="feedback-actions" class="feedback-callout-actions"><button class="feedback-callout-button" id="btnHomeFeedback" type="button">Dar opini&atilde;o agora <span aria-hidden="true">&rarr;</span></button><button class="feedback-view-button" id="btnViewFeedback" type="button">Ver opini&otilde;es salvas</button><button class="feedback-view-button" id="btnAddCard" type="button">Adicionar card</button></div></footer>';
    appEl.innerHTML = html;
    var feedbackToggle = appEl.querySelector('.feedback-toggle');
    feedbackToggle.addEventListener('click', function(){
      var expand = feedbackToggle.getAttribute('aria-expanded') === 'false';
      feedbackToggle.setAttribute('aria-expanded', String(expand));
    });
    var entryToggle = appEl.querySelector('.entry-toggle');
    entryToggle.addEventListener('click', function(){
      var expanded = entryToggle.getAttribute('aria-expanded') === 'false';
      document.getElementById('home-entry-grid').classList.toggle('is-expanded', expanded);
      entryToggle.setAttribute('aria-expanded', String(expanded));
      entryToggle.textContent = expanded ? 'Mostrar menos' : 'Ver detalhes das três entradas';
    });
    var toggle = appEl.querySelector('.application-toggle');
    if(toggle) toggle.addEventListener('click', function(){
      var expand = toggle.getAttribute('aria-expanded') === 'false';
      document.getElementById('home-applications-grid').classList.toggle('is-expanded', expand);
      toggle.setAttribute('aria-expanded', String(expand));
      toggle.textContent = expand ? 'Mostrar menos' : showAllLabel;
      if(expand) appEl.querySelector('.application-extra').focus();
    });
    appEl.querySelectorAll('[data-home-sector]').forEach(function(button){
      button.addEventListener('click', function(){ goItem('sector', Number(button.dataset.homeSector)); });
    });
    appEl.querySelectorAll('[data-home-edit]').forEach(function(button){
      button.addEventListener('click', function(event){ event.stopPropagation(); openCardChooser(button.getAttribute('data-home-edit')); });
    });
    appEl.querySelectorAll('[data-home-add]').forEach(function(button){
      button.addEventListener('click', function(event){ event.stopPropagation(); var kind=button.getAttribute('data-home-add'); openEditPanel(kind === 'competence' ? 'competencia' : (kind === 'material' ? 'material' : 'setor'), '', true); });
    });
    var btnHomeFeedback = document.getElementById('btnHomeFeedback');
    if(btnHomeFeedback) btnHomeFeedback.addEventListener('click', function(){ openFeedbackPanel('mapa', 'geral', 'Mapa de Competencias Firjan SENAI'); });
    var btnViewFeedback = document.getElementById('btnViewFeedback');
    if(btnViewFeedback) btnViewFeedback.addEventListener('click', openSavedOpinionsPanel);
    var btnAddCard = document.getElementById('btnAddCard');
    if(btnAddCard) btnAddCard.addEventListener('click', function(){ openEditPanel('competencia', '', true); });
  }

  function homeEntryHtml(kind, title, description, count, countLabel){
    var icon = kind === 'material' ? '01' : (kind === 'competence' ? '02' : '03');
    return '<div class="home-entry-wrap"><div class="home-entry">' +
      '<span class="home-entry-top"><span class="home-entry-index">'+icon+'</span><span class="home-entry-arrow" aria-hidden="true">&#8599;</span></span>' +
      '<a class="home-entry-title" href="?entrada='+kind+'">'+title+'</a><span class="home-entry-description">'+description+'</span>' +
      '<span class="home-entry-meta"><strong>'+count+'</strong> '+countLabel+'</span><div class="home-entry-actions"><button class="home-entry-edit" type="button" data-home-edit="'+kind+'">Editar card</button><button class="home-entry-add" type="button" data-home-add="'+kind+'">Adicionar card</button></div></div></div>';
  }

  // ---------------- SECTION ----------------
  function renderSection(letter){
    var sec = DATA.competencias[letter];
    var subKeys = Object.keys(sec.subdivisions);
    var html = '';
    html += '<div class="view-head">';
    html += '<button class="back-link" data-nav="home">&larr; Voltar aos cinco eixos</button>';
    html += '<h2>'+letter+'. '+LETTER_META[letter].label+'</h2>';
    html += '<p>'+LETTER_META[letter].desc+'</p>';
    html += '<div class="section-edit-actions"><button class="btn btn-primary" id="btnAddCompetence" type="button">Adicionar nova compet&ecirc;ncia</button></div>';
    html += '</div>';

    html += competenceContactsHtml(letter, 'eixo');

    if(letter === 'A'){
      html += '<div class="section-columns">';
      html += '<div class="flank"><p class="flank-label">Matérias-primas</p>';
      DATA.materialsLeft.forEach(function(m,i){
        html += '<div class="editable-card-row"><button class="chip" data-open="material" data-index="'+i+'">'+m.nome+'</button>'+changeBadge('material', m.nome)+'<button class="card-edit-button" data-edit-type="material" data-edit-key="'+escapeHtml(m.nome)+'" type="button">Editar</button></div>';
      });
      html += '</div>';

      html += '<div>';
      html += '<div class="processos-note">O eixo de <strong>Processos</strong> conecta as matérias-primas aos setores de aplicação disponíveis no menu lateral, passando pelas subdivisões técnicas A1–A13 abaixo.</div>';
      html += '<div class="sub-grid">';
      subKeys.forEach(function(code){
        html += subCardHtml(letter, code, sec.subdivisions[code]);
      });
      html += '</div></div>';

      html += '<div class="flank"><p class="flank-label">Setores de aplicação</p>';
      DATA.sectorsRight.forEach(function(s,i){
        html += '<div class="editable-card-row"><button class="chip" data-open="sector" data-index="'+i+'">'+s.nome+'</button>'+changeBadge('setor', s.nome)+'<button class="card-edit-button" data-edit-type="setor" data-edit-key="'+escapeHtml(s.nome)+'" type="button">Editar</button></div>';
      });
      html += '</div>';
      html += '</div>';
      html += clientPortfolioHtml();
    } else if(letter === 'B' || letter === 'C') {
      var stages = letter === 'B' ? DATA.bContinuum : DATA.cFunnel;
      var stageLabel = letter === 'B' ? 'Continuum de restauração (informativo)' : 'Funil de inovação em saúde (informativo)';
      html += '<p class="flank-label" style="margin-bottom:2px">'+stageLabel+'</p>';
      html += '<div class="stage-row">';
      stages.forEach(function(s,i){
        html += '<button class="stage-chip" data-open="stage" data-letter="'+letter+'" data-index="'+i+'">'+s.nome+'</button>';
      });
      html += '</div>';
      html += '<div class="sub-grid">';
      subKeys.forEach(function(code){
        html += subCardHtml(letter, code, sec.subdivisions[code]);
      });
      html += '</div>';
    } else if(subKeys.length) {
      html += '<div class="sub-grid">';
      subKeys.forEach(function(code){
        html += subCardHtml(letter, code, sec.subdivisions[code]);
      });
      html += '</div>';
    } else {
      html += '<div class="empty-note">Esta área ainda não tem subdivisões detalhadas (nível 2). Assim que o detalhamento for definido, ele aparece aqui na mesma estrutura dos eixos A, B e C.</div>';
    }

    appEl.innerHTML = html;
    var btnAddCompetence = document.getElementById('btnAddCompetence');
    if(btnAddCompetence) btnAddCompetence.addEventListener('click', function(){ openEditPanel('competencia', '', true); });

    appEl.querySelectorAll('[data-nav="home"]').forEach(function(b){ b.addEventListener('click', goHome); });
    appEl.querySelectorAll('.sub-card').forEach(function(b){
      b.addEventListener('click', function(){
        openSubPanel(b.getAttribute('data-letter'), b.getAttribute('data-code'));
      });
    });
    appEl.querySelectorAll('[data-card-feedback]').forEach(function(b){
      b.addEventListener('click', function(event){
        event.stopPropagation();
        var code = b.getAttribute('data-card-feedback');
        var sub = DATA.competencias[code[0]].subdivisions[code];
        openFeedbackPanel('competencia', code, code+' · '+sub.title);
      });
    });
    appEl.querySelectorAll('[data-edit-type]').forEach(function(b){
      b.addEventListener('click', function(event){ event.stopPropagation(); openEditPanel(b.getAttribute('data-edit-type'), b.getAttribute('data-edit-key'), false); });
    });
    appEl.querySelectorAll('[data-open="sector"]').forEach(function(b){
      b.addEventListener('click', function(){ openSectorPanel(parseInt(b.getAttribute('data-index'),10)); });
    });
    appEl.querySelectorAll('[data-open="material"]').forEach(function(b){
      b.addEventListener('click', function(){ openMaterialPanel(parseInt(b.getAttribute('data-index'),10)); });
    });
    appEl.querySelectorAll('[data-open="stage"]').forEach(function(b){
      b.addEventListener('click', function(){
        openStagePanel(b.getAttribute('data-letter'), parseInt(b.getAttribute('data-index'),10));
      });
    });
    appEl.querySelectorAll('[data-open-client-sector]').forEach(function(b){
      b.addEventListener('click', function(){ openSectorPanelByName(b.getAttribute('data-open-client-sector')); });
    });
  }

  function brandBadgeSvg(c){
    var initials = c.sigla.slice(0,2);
    return '<svg viewBox="0 0 120 72" class="brand-badge" role="img" aria-label="'+c.nome+'">' +
      '<rect x="0" y="0" width="120" height="72" rx="10" fill="'+c.cor1+'"/>' +
      '<text x="60" y="44" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="24" font-weight="700" fill="'+c.cor2+'">'+initials+'</text>' +
      '</svg>';
  }

  function clientPortfolioHtml(){
    var clients = DATA.carteiraClientes || [];
    if(!clients.length) return '';
    var html = '<div class="section-block" style="margin-top:26px"><h4 style="font-size:15px;letter-spacing:0;text-transform:none;color:var(--ink)">Carteira de clientes</h4>';
    html += '<p class="plain-p" style="margin-bottom:12px">Exemplos de clientes reais mapeados aos setores de aplicação acima — clique para ver a conexão de P&amp;D daquele setor.</p>';
    html += '<div class="client-grid">';
    clients.forEach(function(c){
      html += '<button class="client-card" data-open-client-sector="'+c.setor+'">' +
        brandBadgeSvg(c) +
        '<span class="client-name">'+c.nome+'</span>' +
        '<span class="client-sector">'+c.setor+'</span>' +
        '</button>';
    });
    html += '</div>';
    html += '<p class="pending-field" style="margin-top:10px">Selos de marca estilizados com as cores da empresa — não é o arquivo de logo oficial (as ferramentas disponíveis não conseguem baixar imagens de sites de terceiros). Envie os arquivos de logo para substituição.</p>';
    html += '</div>';
    return html;
  }

  function subCardHtml(letter, code, sub){
    var dots = sub.teams.slice(0,5).map(function(t){
      return '<span class="team-dot" style="background:'+(TEAM_COLOR[t]||'#999')+'" title="'+t+'"></span>';
    }).join('');
    return '<div class="sub-card-wrap"><button class="sub-card" data-letter="'+letter+'" data-code="'+code+'">' +
      '<span class="sub-code">'+code+'</span>' +
      '<span class="sub-title">'+sub.title+'</span>' + changeBadge('competencia', code) +
      '<span class="sub-foot">'+dots+'<span class="sub-count">'+sub.bullets.length+' competências</span></span>' +
      '<span class="sub-action">Abrir detalhes <span aria-hidden="true">&rarr;</span></span></button><div class="card-actions"><button type="button" class="sub-feedback" data-card-feedback="'+code+'">Dar opini&atilde;o</button><button type="button" class="card-edit-button" data-edit-type="competencia" data-edit-key="'+code+'">Editar</button></div>'+
      competenceContactsHtml(code, 'subdivisao')+'</div>';
  }

  // ---------------- PANELS ----------------
  function openPanel(innerHtml){
    overlay.classList.remove('lead-contact-overlay');
    lastFocusedElement = document.activeElement;
    panel.innerHTML = innerHtml;
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    panel.scrollTop = 0;
    var firstControl = panel.querySelector('button, [href], input, select, textarea');
    if(firstControl && typeof firstControl.focus === 'function') firstControl.focus();
  }

  function feedbackListHtml(itemType, itemKey){
    var entries = FEEDBACK.filter(function(item){ return item.item_type === itemType && item.item_key === itemKey; }).slice(0,8);
    if(!entries.length) return '<p class="feedback-empty">Ainda n&atilde;o h&aacute; contribui&ccedil;&otilde;es para este item.</p>';
    return entries.map(function(item){
      return '<div class="feedback-entry"><strong>'+escapeHtml(item.name)+'</strong><span class="feedback-date">'+escapeHtml(item.created_at)+'</span>' +
        (item.add ? '<p><b>Acrescentaria:</b> '+escapeHtml(item.add)+'</p>' : '') +
        (item.remove ? '<p><b>Retiraria:</b> '+escapeHtml(item.remove)+'</p>' : '') +
        (item.comments ? '<p>'+escapeHtml(item.comments)+'</p>' : '') + '</div>';
    }).join('');
  }

  function openFeedbackPanel(itemType, itemKey, itemTitle){
    var html = '<div class="panel-top"><div><span class="panel-eyebrow">Contribua com o mapa</span><h3>Dar opini&atilde;o</h3></div><button class="panel-close" data-close aria-label="Fechar">&times;</button></div>';
    html += '<p class="plain-p feedback-target">'+escapeHtml(itemTitle)+'</p>';
    html += '<div class="cta-row"><button class="btn btn-primary" id="btnFeedbackEdit" type="button">Editar este card</button></div>';
    html += '<form id="main-feedback-form" class="main-feedback-form"><input type="hidden" name="item_type" value="'+escapeHtml(itemType)+'"><input type="hidden" name="item_key" value="'+escapeHtml(itemKey)+'"><input type="hidden" name="item_title" value="'+escapeHtml(itemTitle)+'">';
    html += '<label>Seu nome <span class="required-label">(obrigat&oacute;rio)</span><input name="name" maxlength="120" required placeholder="Como devemos identificar sua contribui&ccedil;&atilde;o?"></label>';
    html += '<label>O que voc&ecirc; acrescentaria?<textarea name="add" rows="3" placeholder="Uma compet&ecirc;ncia, exemplo ou informa&ccedil;&atilde;o que est&aacute; faltando"></textarea></label>';
    html += '<label>O que voc&ecirc; retiraria ou corrigiria?<textarea name="remove" rows="3" placeholder="Algo repetido, desatualizado ou fora de contexto"></textarea></label>';
    html += '<label>Coment&aacute;rios gerais<textarea name="comments" rows="3" placeholder="Contexto ou justificativa"></textarea></label><p class="feedback-status" role="status"></p><button class="btn btn-primary" type="submit">Salvar contribui&ccedil;&atilde;o</button></form>';
    html += '<div class="feedback-history"><h4>Contribui&ccedil;&otilde;es recentes</h4><div class="feedback-history-list">'+feedbackListHtml(itemType,itemKey)+'</div></div>';
    openPanel(html);
    overlay.classList.add('feedback-overlay');
    panel.querySelector('[data-close]').addEventListener('click', closePanel);
    panel.querySelector('#btnFeedbackEdit').addEventListener('click', function(){ closePanel(); openEditPanel(itemType, itemKey, false); });
    var form = panel.querySelector('#main-feedback-form');
    form.addEventListener('submit', function(event){
      event.preventDefault();
      var payload = {}; new FormData(form).forEach(function(value,key){ payload[key] = value; });
      var status = form.querySelector('.feedback-status'); status.textContent = 'Salvando...';
      fetch('/alternativa_ux/feedback/', {method:'POST', headers:{'Content-Type':'application/json','X-CSRFToken':getCookie('csrftoken')}, body:JSON.stringify(payload)})
        .then(function(response){ return response.json().then(function(body){ if(!response.ok) throw new Error(body.error || 'N&atilde;o foi poss&iacute;vel salvar.'); return body; }); })
        .then(function(body){ FEEDBACK.unshift({item_type:payload.item_type,item_key:payload.item_key,item_title:payload.item_title,name:payload.name,add:payload.add,remove:payload.remove,comments:payload.comments,created_at:body.created_at}); status.textContent='Contribui&ccedil;&atilde;o salva. Obrigado por ajudar a melhorar o mapa.'; panel.querySelector('.feedback-history-list').innerHTML=feedbackListHtml(itemType,itemKey); form.elements.add.value=''; form.elements.remove.value=''; form.elements.comments.value=''; })
        .catch(function(error){ status.textContent=error.message; });
    });
  }

  function refreshCurrentMapView(){
    var query = '';
    if(state.view === 'competencia' && state.code) query = '?competencia='+encodeURIComponent(state.code);
    else if(state.view === 'section' && state.letter) query = '?eixo='+encodeURIComponent(state.letter);
    else if(state.view === 'item' && state.itemKind === 'sector') query = '?setor='+encodeURIComponent(state.itemIndex);
    else if(state.view === 'item' && state.itemKind === 'material') query = '?materia='+encodeURIComponent(state.itemIndex);
    window.location.assign(window.location.pathname + query);
  }

  function confirmContactDeletion(name){
    var dialog = document.createElement('dialog');
    dialog.className = 'contact-dialog delete-contact-dialog';
    dialog.setAttribute('aria-labelledby', 'delete-contact-title');
    dialog.setAttribute('aria-describedby', 'delete-contact-description');
    dialog.innerHTML = '<h2 id="delete-contact-title">Excluir contato?</h2>'+
      '<p id="delete-contact-description"><strong>'+escapeHtml(name)+'</strong> será removido da lista de contatos deste card. A exclusão ficará registrada no histórico.</p>'+
      '<form method="dialog"><button class="btn btn-ghost" value="cancel" autofocus>Cancelar</button>'+
      '<button class="btn delete-contact-confirm" value="delete">Excluir contato</button></form>';
    document.body.appendChild(dialog);
    return new Promise(function(resolve){
      dialog.addEventListener('close', function(){
        dialog.remove();
        resolve(dialog.returnValue === 'delete');
      }, {once:true});
      dialog.showModal();
    });
  }

  function openEditPanel(itemType, itemKey, adding, contact){
    var editingContact = itemType === 'contato';
    var leadContact = editingContact && itemKey.startsWith('diretorio/chefias/');
    var fieldLabels = leadContact ? Object.assign({}, contactLabels, {whatsapp:'WhatsApp (número com DDD)'}) : contactLabels;
    var chooseType = adding && !editingContact;
    var meta = cardMeta(itemType, itemKey);
    var history = orderedHistory(meta);
    var originalVersionIndex = history.findIndex(function(version){ return isOriginalHistoryVersion(version, meta); });
    var selectedVersionIndex = adding ? -1 : (originalVersionIndex >= 0 ? originalVersionIndex : history.length - 1);
    if(editingContact) selectedVersionIndex = history.length - 1;
    var card = null;
    if(!adding){
      if(editingContact) card = contact;
      else if(itemType === 'competencia') card = DATA.competencias[itemKey[0]].subdivisions[itemKey];
      else card = (itemType === 'material' ? DATA.materialsLeft : DATA.sectorsRight).find(function(item){ return item.nome === itemKey; });
    }
    card = card || {title:'', bullets:[], teams:[], nome:'', explicacao:'', produtos:[]};
    var title = adding ? 'Adicionar card' : 'Editar card';
    if(editingContact) title = adding ? 'Adicionar contato' : 'Editar contato';
    var value = function(text){ return escapeHtml(text || ''); };
    var html = '<div class="panel-top"><div><span class="panel-eyebrow">Edi&ccedil;&atilde;o protegida</span><h3>'+title+'</h3></div><button class="panel-close" data-close aria-label="Fechar">&times;</button></div>';
    html += '<p class="plain-p">Informe a palavra de seguran&ccedil;a para autorizar esta altera&ccedil;&atilde;o.</p>';
    html += '<form id="card-edit-form" class="main-feedback-form"><label>Seu nome <span class="required-label">(obrigat&oacute;rio)</span><input name="editor_name" maxlength="120" required placeholder="Quem est&aacute; fazendo esta altera&ccedil;&atilde;o?"></label><label>Palavra de seguran&ccedil;a<input name="password" type="password" required autocomplete="current-password"></label>';
    if(chooseType) html += '<div class="card-type-picker"><span class="card-type-picker-label">Tipo de card</span><div class="card-type-grid"><button type="button" class="card-type-option is-selected" data-card-type="competencia"><span class="card-type-icon">A</span><span><strong>Compet&ecirc;ncia</strong><small>Uma capacidade t&eacute;cnica do mapa</small></span></button><button type="button" class="card-type-option" data-card-type="material"><span class="card-type-icon">M</span><span><strong>Mat&eacute;ria-prima</strong><small>Um insumo ou recurso de entrada</small></span></button><button type="button" class="card-type-option" data-card-type="setor"><span class="card-type-icon">S</span><span><strong>Setor</strong><small>Uma aplica&ccedil;&atilde;o ou mercado</small></span></button></div><input type="hidden" name="item_type" value="competencia"></div>';
    html += '<div class="version-selection-note" data-version-selection></div><div class="edit-fields" data-edit-fields></div>'+historyHtml(itemType, itemKey)+'<p class="feedback-status" role="status"></p><button class="btn btn-primary" type="submit">Salvar altera&ccedil;&atilde;o</button>'+ (editingContact && !adding && !leadContact ? '<button type="submit" class="btn btn-ghost" data-delete-contact formnovalidate>Excluir contato deste card</button>' : '')+'</form>';
    openPanel(html); overlay.classList.add('feedback-overlay');
    var form = panel.querySelector('#card-edit-form'), fields = panel.querySelector('[data-edit-fields]');
    var emptyCard = {title:'',bullets:[],teams:[],nome:'',explicacao:'',produtos:[]};
    function normalized(value){ return Array.isArray(value) ? value.join('\n') : String(value || ''); }
    function versionData(index, type){
      if(index >= 0 && history[index] && history[index].data) return history[index].data;
      return type === itemType ? card : emptyCard;
    }
    function changedFields(index, type){
      // The first version of a user-created card is its initial content, not
      // an edit from an empty card. Only later versions can have changed fields.
      if(index < 0 || !history[index] || history[index].action === 'original' || history[index].action === 'added') return [];
      var fieldNames = editingContact ? Object.keys(fieldLabels) : type === 'competencia' ? ['title','bullets','teams'] : ['nome','explicacao','produtos'];
      var before = index > 0 ? (history[index - 1].data || {}) : {};
      var after = history[index].data || {};
      return fieldNames.filter(function(name){ return normalized(before[name]) !== normalized(after[name]); });
    }
    function updateVersionMarkers(type){
      var changed = changedFields(selectedVersionIndex, type);
      fields.querySelectorAll('[data-version-field]').forEach(function(label){
        var name = label.getAttribute('data-version-field');
        label.classList.toggle('version-changed', changed.indexOf(name) !== -1);
        var marker = label.querySelector('[data-change-marker]');
        if(marker) marker.hidden = changed.indexOf(name) === -1;
      });
      var note = panel.querySelector('[data-version-selection]');
      if(!note) return;
      if(selectedVersionIndex < 0 || !history[selectedVersionIndex]) note.textContent = '';
      else if(isOriginalHistoryVersion(history[selectedVersionIndex], meta)) note.innerHTML = '<strong>Vers&atilde;o original selecionada</strong><span>Esta &eacute; a base do card. As vers&otilde;es abaixo mostram o que foi alterado.</span>';
      else note.innerHTML = '<strong>Vers&atilde;o editada selecionada</strong><span>O card completo est&aacute; carregado. Os campos alterados nesta vers&atilde;o est&atilde;o destacados.</span>';
      panel.querySelectorAll('[data-version-index]').forEach(function(button){
        var isSelected = Number(button.getAttribute('data-version-index')) === selectedVersionIndex;
        button.classList.toggle('is-selected', isSelected);
        button.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
      });
    }
    function renderFields(type){
      var current = adding ? emptyCard : versionData(selectedVersionIndex, type);
      if(editingContact) fields.innerHTML = Object.keys(fieldLabels).map(function(key){
        return '<label data-version-field="'+key+'">'+fieldLabels[key]+' <span data-change-marker hidden>Alterado</span><input name="'+key+'" maxlength="255" type="'+(key === 'email' ? 'email' : (key === 'telefone' || key === 'whatsapp') ? 'tel' : 'text')+'" '+(key === 'nome' ? 'required' : '')+' value="'+value(current[key])+'"></label>';
      }).join('');
      else if(type === 'competencia') fields.innerHTML = '<label>Eixo do mapa<select name="letter" required><option value="A" '+(value(adding ? 'A' : itemKey[0])==='A'?'selected':'')+'>A &mdash; Tecnologias e Processos</option><option value="B" '+(value(adding ? 'A' : itemKey[0])==='B'?'selected':'')+'>B &mdash; Conserva&ccedil;&atilde;o e Monitoramento</option><option value="C" '+(value(adding ? 'A' : itemKey[0])==='C'?'selected':'')+'>C &mdash; Inova&ccedil;&atilde;o em Sa&uacute;de</option><option value="D" '+(value(adding ? 'A' : itemKey[0])==='D'?'selected':'')+'>D &mdash; Biotecnologia</option><option value="E" '+(value(adding ? 'A' : itemKey[0])==='E'?'selected':'')+'>E &mdash; Circularidade</option></select></label><label>C&oacute;digo<input name="code" maxlength="12" required placeholder="Ex.: C1" value="'+value(adding ? '' : itemKey)+'"></label><label data-version-field="title">T&iacute;tulo <span data-change-marker hidden>Alterado</span><input name="title" maxlength="255" required value="'+value(current.title)+'"></label><label data-version-field="bullets">Compet&ecirc;ncias detalhadas <span data-change-marker hidden>Alterado</span><textarea name="bullets" rows="7" placeholder="Uma por linha">'+value((current.bullets||[]).join('\n'))+'</textarea></label><label data-version-field="teams">Equipes respons&aacute;veis <span data-change-marker hidden>Alterado</span><textarea name="teams" rows="3" placeholder="Uma por linha">'+value((current.teams||[]).join('\n'))+'</textarea></label>';
      else fields.innerHTML = '<label data-version-field="nome">Nome <span data-change-marker hidden>Alterado</span><input name="nome" maxlength="255" required value="'+value(current.nome)+'"></label><label data-version-field="explicacao">Explica&ccedil;&atilde;o <span data-change-marker hidden>Alterado</span><textarea name="explicacao" rows="4">'+value(current.explicacao)+'</textarea></label><label data-version-field="produtos">Produtos ou aplica&ccedil;&otilde;es <span data-change-marker hidden>Alterado</span><textarea name="produtos" rows="5" placeholder="Um por linha">'+value((current.produtos||[]).join('\n'))+'</textarea></label>';
      if(type === 'competencia' && fields.querySelector('select[name="letter"]') && !fields.querySelector('option[value="F"]')){
        var materialsOption = document.createElement('option');
        materialsOption.value = 'F';
        materialsOption.textContent = 'F — Materiais';
        fields.querySelector('select[name="letter"]').appendChild(materialsOption);
      }
      updateVersionMarkers(type);
    }
    renderFields(itemType);
    if(chooseType) panel.querySelectorAll('[data-card-type]').forEach(function(button){
      button.addEventListener('click', function(){
        panel.querySelectorAll('[data-card-type]').forEach(function(option){ option.classList.remove('is-selected'); });
        button.classList.add('is-selected');
        form.elements.item_type.value = button.getAttribute('data-card-type');
        renderFields(form.elements.item_type.value);
      });
    });
    panel.querySelectorAll('[data-version-index]').forEach(function(button){
      button.addEventListener('click', function(){
        var index = Number(button.getAttribute('data-version-index'));
        if(!history[index] || !history[index].data) return;
        selectedVersionIndex = index;
        renderFields(itemType);
      });
    });
    var originalButton = panel.querySelector('[data-version-original]');
    if(originalButton) originalButton.addEventListener('click', function(){
      if(originalVersionIndex < 0) return;
      selectedVersionIndex = originalVersionIndex;
      renderFields(itemType);
    });
    panel.querySelector('[data-close]').addEventListener('click', closePanel);
    form.addEventListener('submit', async function(event){
      event.preventDefault();
      var deleting = event.submitter && event.submitter.hasAttribute('data-delete-contact');
      if(deleting){
        if(!form.elements.editor_name.reportValidity() || !form.elements.password.reportValidity()) return;
        if(!await confirmContactDeletion(contact.nome)) return;
      }
      var type = chooseType ? form.elements.item_type.value : itemType, payload = {editor_name:form.elements.editor_name.value.trim(), password:form.elements.password.value, action:deleting?'delete':(adding?'add':'update'), item_type:type, item_key:itemKey, fields:{}};
      new FormData(form).forEach(function(v,k){ if(k !== 'password' && k !== 'editor_name' && k !== 'item_type') payload.fields[k] = (k === 'bullets' || k === 'teams' || k === 'produtos') ? v.split(/\r?\n/) : v; });
      var status = form.querySelector('.feedback-status'); status.textContent = 'Salvando...';
      if(type === 'competencia' && payload.fields.code && payload.fields.code.trim().toUpperCase().charAt(0) !== payload.fields.letter){ status.textContent = 'O c&oacute;digo precisa come&ccedil;ar com a letra do eixo selecionado.'; return; }
      fetch('/mapa/cards/edit/', {method:'POST', headers:{'Content-Type':'application/json','X-CSRFToken':getCookie('csrftoken')}, body:JSON.stringify(payload)})
        .then(function(response){ return response.json().then(function(body){ if(!response.ok) throw new Error(body.error || 'N&atilde;o foi poss&iacute;vel salvar.'); return body; }); })
        .then(function(){ status.textContent = 'Card salvo. Atualizando o mapa...'; window.setTimeout(refreshCurrentMapView, 300); })
        .catch(function(error){ status.textContent = error.message; });
    });
  }

  function historyHtml(type, key){
    var meta = cardMeta(type, key);
    var history = orderedHistory(meta);
    if(!history.length) return '';
    var labels = {title:'t&iacute;tulo', bullets:'compet&ecirc;ncias detalhadas', teams:'equipes', nome:'nome', explicacao:'explica&ccedil;&atilde;o', produtos:'produtos/aplica&ccedil;&otilde;es'};
    if(type === 'contato') labels = Object.assign({}, contactLabels, {whatsapp:'WhatsApp'});
    function changedAt(index){
      if(index === 0 || history[index].action === 'original') return '';
      var before = history[index - 1].data || {}, after = history[index].data || {};
      return Object.keys(labels).filter(function(name){ return normalizedForHistory(before[name]) !== normalizedForHistory(after[name]); }).map(function(name){ return labels[name]; }).join(', ');
    }
    function normalizedForHistory(value){ return Array.isArray(value) ? value.join('\n') : String(value || ''); }
    return '<div class="card-version-history"><h4>Hist&oacute;rico deste card</h4><p class="version-history-help">A vers&atilde;o original aparece primeiro. Clique em uma vers&atilde;o editada para carregar aquele conte&uacute;do.</p>'+history.map(function(version, index){
      var changed = changedAt(index);
      var editNumber = history.slice(0, index + 1).filter(function(item){ return item.action !== 'original'; }).length;
      var hasAddedOriginal = meta && !meta.is_new && history.some(function(item){ return item.action === 'added'; });
      var isAddedOriginal = version.action === 'added' && meta && !meta.is_new;
      var versionLabel = version.action === 'original' ? 'Vers&atilde;o original' : (isAddedOriginal ? 'Original adicionado' : (version.action === 'added' ? 'Card adicionado' : (hasAddedOriginal ? 'Edi&ccedil;&atilde;o do adicionado' : 'Vers&atilde;o editada #' + editNumber)));
      var isOriginal = isOriginalHistoryVersion(version, meta);
      var versionNote = changed ? '<small>Alterado: '+changed+'</small>' : (isOriginal ? '<small>Conte&uacute;do base do card</small>' : (version.action === 'added' ? '<small>Conte&uacute;do inicial do card</small>' : '<small>Campos alterados</small>'));
      return '<button type="button" class="card-version '+(isOriginal?'is-original':'')+'" data-version-index="'+index+'" aria-pressed="false"><strong>'+versionLabel+'</strong><span>'+(version.name ? escapeHtml(version.name) : (version.action === 'original' ? 'Base do mapa' : 'Autoria não registrada'))+' &middot; '+escapeHtml(version.created_at||'')+'</span>'+versionNote+'</button>';
    }).join('')+(history.some(function(version){ return isOriginalHistoryVersion(version, meta); }) ? '<button type="button" class="card-version-back" data-version-original>&larr; Voltar para a vers&atilde;o original</button>' : '')+'</div>';
  }

  function openCardChooser(){
    var html = '<div class="panel-top"><div><span class="panel-eyebrow">Edi&ccedil;&atilde;o protegida</span><h3>Escolha o card para editar</h3></div><button class="panel-close" data-close aria-label="Fechar">&times;</button></div>';
    html += '<p class="plain-p">Depois de escolher o card, a palavra de seguran&ccedil;a ser&aacute; solicitada antes de salvar.</p>';
    html += '<div class="card-chooser-list"><h4>Compet&ecirc;ncias</h4>';
    Object.keys(DATA.competencias || {}).forEach(function(letter){ Object.keys(DATA.competencias[letter].subdivisions || {}).forEach(function(code){ html += '<button type="button" class="card-chooser-option" data-choose-type="competencia" data-choose-key="'+escapeHtml(code)+'"><strong>'+escapeHtml(code)+'</strong> '+escapeHtml(DATA.competencias[letter].subdivisions[code].title)+'</button>'; }); });
    html += '<h4>Mat&eacute;rias-primas</h4>';
    DATA.materialsLeft.forEach(function(item){ html += '<button type="button" class="card-chooser-option" data-choose-type="material" data-choose-key="'+escapeHtml(item.nome)+'">'+escapeHtml(item.nome)+'</button>'; });
    html += '<h4>Setores</h4>';
    DATA.sectorsRight.forEach(function(item){ html += '<button type="button" class="card-chooser-option" data-choose-type="setor" data-choose-key="'+escapeHtml(item.nome)+'">'+escapeHtml(item.nome)+'</button>'; });
    html += '</div>';
    openPanel(html); overlay.classList.add('feedback-overlay');
    panel.querySelector('[data-close]').addEventListener('click', closePanel);
    panel.querySelectorAll('[data-choose-type]').forEach(function(button){ button.addEventListener('click', function(){ closePanel(); openEditPanel(button.getAttribute('data-choose-type'), button.getAttribute('data-choose-key'), false); }); });
  }

  function allFeedbackHtml(){
    if(!FEEDBACK.length) return '<p class="feedback-empty">Ainda n&atilde;o h&aacute; opini&otilde;es salvas.</p>';
    return FEEDBACK.map(function(item){
      var origin = item.item_type === 'competencia' ? {page:'Compet&ecirc;ncias', topic:item.item_title} :
        item.item_type === 'material' ? {page:'Mat&eacute;rias-primas', topic:item.item_title} :
        item.item_type === 'setor' ? {page:'Aplica&ccedil;&otilde;es', topic:item.item_title} :
        {page:'Mapa principal', topic:'Vis&atilde;o geral'};
      return '<div class="feedback-entry"><strong>'+escapeHtml(item.item_title)+'</strong><span class="feedback-origin">P&aacute;gina: '+origin.page+' &middot; Subt&oacute;pico: '+escapeHtml(origin.topic)+'</span><span class="feedback-date">'+escapeHtml(item.name)+' · '+escapeHtml(item.created_at)+'</span>' +
        (item.add ? '<p><b>Acrescentaria:</b> '+escapeHtml(item.add)+'</p>' : '') +
        (item.remove ? '<p><b>Retiraria:</b> '+escapeHtml(item.remove)+'</p>' : '') +
        (item.comments ? '<p>'+escapeHtml(item.comments)+'</p>' : '') + '</div>';
    }).join('');
  }

  function openSavedOpinionsPanel(){
    var html = '<div class="panel-top"><div><span class="panel-eyebrow">Contribui&ccedil;&otilde;es da comunidade</span><h3>Opini&otilde;es salvas</h3></div><button class="panel-close" data-close aria-label="Fechar">&times;</button></div>';
    html += '<p class="plain-p">Veja todas as sugest&otilde;es registradas no mapa, com a p&aacute;gina e o subt&oacute;pico de origem.</p><div class="feedback-history feedback-all-history">'+allFeedbackHtml()+'</div>';
    openPanel(html);
    overlay.classList.add('feedback-overlay');
    panel.querySelector('[data-close]').addEventListener('click', closePanel);
  }

  function getCookie(name){
    var prefix = name+'=';
    return document.cookie.split(';').map(function(value){ return value.trim(); }).filter(function(value){ return value.indexOf(prefix) === 0; }).map(function(value){ return decodeURIComponent(value.slice(prefix.length)); })[0] || '';
  }
  function closePanel(){
    overlay.hidden = true;
    overlay.classList.remove('feedback-overlay');
    document.body.style.overflow = '';
    if(lastFocusedElement && typeof lastFocusedElement.focus === 'function') lastFocusedElement.focus();
  }
  overlay.addEventListener('click', function(e){ if(e.target === overlay) closePanel(); });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && !document.querySelector('dialog[open]')) closePanel(); });

  function openSubPanel(letter, code){
    goCompetenciaFull(letter, code);
  }

  function aderBadge(level){
    var cls = level === 'alta' ? 'conf-alta' : (level === 'media' ? 'conf-media' : 'conf-nao_verificado');
    var label = level === 'alta' ? 'Alta aderência' : (level === 'media' ? 'Aderência média' : 'Exploratória');
    return '<span class="confidence '+cls+'">'+label+'</span>';
  }

  function connCardHtml(titleLine, racional, aderencia, dataAttr){
    return '<button type="button" class="market-card conn-card" '+dataAttr+'>' +
      '<div class="mk-top"><span class="mk-label">'+titleLine+'</span>'+aderBadge(aderencia)+'</div>' +
      '<p class="mk-src" style="font-style:normal;font-size:12.6px;line-height:1.5">'+racional+'</p></button>';
  }

  function subTitleByCode(code){
    var L = code[0];
    var sub = DATA.competencias[L] && DATA.competencias[L].subdivisions[code];
    return sub ? sub.title : '';
  }

  function openMaterialPanelByName(name){
    var idx = DATA.materialsLeft.findIndex(function(m){ return m.nome === name; });
    if(idx > -1) openMaterialPanel(idx);
  }
  function openSectorPanelByName(name){
    var idx = DATA.sectorsRight.findIndex(function(s){ return s.nome === name; });
    if(idx > -1) openSectorPanel(idx);
  }

  function bindConnButtons(){
    panel.querySelectorAll('[data-goto-sub]').forEach(function(b){
      b.addEventListener('click', function(){
        var code = b.getAttribute('data-goto-sub');
        openSubPanel(code[0], code);
      });
    });
    panel.querySelectorAll('[data-goto-material]').forEach(function(b){
      b.addEventListener('click', function(){ openMaterialPanelByName(b.getAttribute('data-goto-material')); });
    });
    panel.querySelectorAll('[data-goto-sector]').forEach(function(b){
      b.addEventListener('click', function(){ openSectorPanelByName(b.getAttribute('data-goto-sector')); });
    });
  }

  var contactLabels = {nome:'Nome', cargo:'Cargo', setor:'Setor', email:'E-mail', telefone:'Telefone'};
  function directoryPeople(){
    return (DATA.leadResearchers || []).concat(DATA.seniorResearchers || []);
  }

  function leadershipPeople(){
    return (DATA.leadResearchers || []).concat(DATA.managementContacts || []);
  }

  function homeContacts(){
    return (DATA.leadResearchers || []).filter(function(p){
      return p.nome === 'Antonio Augusto Fidalgo Neto' || /coordenador/i.test(p.cargo || '');
    }).concat(DATA.managementContacts || []);
  }

  document.getElementById('lead-contact-button').addEventListener('click', function(){
    var people = leadershipPeople();
    var displayOrder = people.slice().sort(function(a, b){
      return Number(b.email === 'pfurio@firjan.com.br') - Number(a.email === 'pfurio@firjan.com.br');
    });
    var html = '<div class="panel-top"><h2>Gerência e Pesquisadores-Chefes</h2><button type="button" class="panel-close" data-close aria-label="Fechar">&times;</button></div>';
    html += '<div class="lead-contact-list">' + displayOrder.map(function(source){
      if(source.situacao && source.situacao !== 'Ativo') return '';
      var key = 'diretorio/chefias/'+people.indexOf(source);
      var person = (DATA.contacts || {})[key] || source;
      var whatsapp = (person.whatsapp || '').replace(/[^0-9]/g, '');
      if(whatsapp.length === 10 || whatsapp.length === 11) whatsapp = '55'+whatsapp;
      var email = (person.email || '').trim();
      var roleHtml = contactRoleLines(person).map(escapeHtml).join('<br>');
      return '<section class="lead-contact"><h3>'+escapeHtml(person.nome)+'</h3><p>'+roleHtml+'</p><dl>'+
        '<dt><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="#168044" stroke-width="1.8" d="M4.1 17.2a9.5 9.5 0 1 1 3 3L2.5 21.5z"/><path fill="#168044" d="M8 6.8c-.6 0-1.4.9-1.4 2.2 0 2.9 4.9 7.9 8.3 8.1 1.3.1 2.7-.7 2.8-2.1l-3-1.5-1.1 1.3c-1.7-.6-3.3-2-4.1-3.6l1-1.3-1.3-3z"/></svg>WhatsApp</dt><dd>'+(whatsapp ? '<a href="https://wa.me/'+whatsapp+'" target="_blank" rel="noopener noreferrer">Abrir conversa</a>' : 'Não informado')+'</dd>'+
        '<dt><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="m3.5 6 8.5 7 8.5-7"/></svg>E-mail</dt><dd>'+(email ? '<a href="mailto:'+escapeHtml(email)+'">'+escapeHtml(email)+'</a>' : 'Não informado')+'</dd></dl><button class="card-edit-button" type="button" data-edit-contact="'+key+'">Editar contato</button></section>';
    }).join('') + '</div>';
    openPanel(html);
    overlay.classList.add('feedback-overlay', 'lead-contact-overlay');
    
    panel.querySelector('[data-close]').addEventListener('click', closePanel);
  });

  function contactRoleLines(person){
    return (person.cargo || '').split(/\s*·\s*/).filter(Boolean);
  }

  document.addEventListener('click', function(event){
    var step = event.target.closest('[data-contact-step]');
    if(step){
      var pager = step.parentElement;
      var pages = pager.closest('.competence-contacts').querySelectorAll('.contact-page');
      var currentPage = Number(pager.dataset.page) + Number(step.dataset.contactStep);
      if(currentPage < 0 || currentPage >= pages.length) return;
      pages.forEach(function(page, i){ page.hidden = i !== currentPage; });
      pager.dataset.page = currentPage;
      pager.querySelector('[role="status"]').textContent = (currentPage + 1)+' de '+pages.length;
      pager.firstElementChild.disabled = currentPage === 0;
      pager.lastElementChild.disabled = currentPage === pages.length - 1;
      if(step.disabled) pager.querySelector('button:enabled').focus();
      return;
    }
    var add = event.target.closest('[data-add-contact]');
    if(add){ openEditPanel('contato', add.dataset.addContact, true); return; }
    var editContact = event.target.closest('[data-edit-contact]');
    if(editContact){
      var contactKey = editContact.dataset.editContact;
      var directory = contactKey.startsWith('diretorio/chefias/') ? leadershipPeople() : directoryPeople();
      var current = (DATA.contacts || {})[contactKey] || directory[Number(contactKey.split('/')[2])];
      openEditPanel('contato', contactKey, false, current);
      return;
    }
    var card = event.target.closest('[data-contact]');
    if(!card) return;
    var key = card.dataset.contactKey;
    var person = (DATA.contacts || {})[key] || (key && key.startsWith('diretorio/chefias/') && leadershipPeople()[Number(key.split('/')[2])]) || directoryPeople().find(function(p){
      return p.nome === card.dataset.contact;
    });
    if(!person) return;
    var dialog = document.createElement('dialog');
    dialog.className = 'contact-dialog';
    dialog.setAttribute('aria-labelledby', 'contact-dialog-name');
    var email = (person.email || '').trim();
    var attributes = contactRoleLines(person);
    if(person.setor && !attributes.includes(person.setor)) attributes.push(person.setor);
    dialog.innerHTML = '<button type="button" class="contact-close" aria-label="Fechar">×</button>'+
      '<h2 id="contact-dialog-name">'+escapeHtml(person.nome)+'</h2>'+
      attributes.map(function(attribute){ return '<p>'+escapeHtml(attribute)+'</p>'; }).join('')+
      '<div class="inline-contact-actions"><span><span aria-hidden="true">✉</span> <span class="contact-sr">E-mail</span> '+
      (email ? '<a href="mailto:'+escapeHtml(email)+'">'+escapeHtml(email)+'</a>' : 'A definir')+
      '</span><span><span aria-hidden="true">☎</span> <span class="contact-sr">Telefone</span> '+escapeHtml(person.telefone || 'A definir')+'</span></div>';
    if(key){
      var edit = document.createElement('button');
      edit.type = 'button';
      edit.className = 'card-edit-button';
      edit.textContent = 'Editar contato';
      edit.onclick = function(){ dialog.close(); openEditPanel('contato', key, false, person); };
      dialog.appendChild(edit);
    }
    document.body.appendChild(dialog);
    dialog.querySelector('button').onclick = function(){ dialog.close(); };
    dialog.addEventListener('close', function(){ dialog.remove(); card.focus(); });
    dialog.showModal();
  });

  function competenceContactsHtml(code, index){
    var scope = code + '/' + index;
    var saved = DATA.contacts || {};
    var keys = Object.keys(saved).filter(function(key){ return key.startsWith(scope+'/'); });
    var deletions = [];
    keys.forEach(function(key){
      orderedHistory(cardMeta('contato', key)).forEach(function(version){
        if(version.action === 'deleted') deletions.push(version);
      });
    });
    var deletionHistory = deletions.length ? '<details class="contact-history"><summary>Histórico de exclusões ('+deletions.length+')</summary><ul>'+
      deletions.map(function(version){
        return '<li><strong>'+escapeHtml(version.data.nome)+'</strong> · Excluído por '+escapeHtml(version.name)+' em '+escapeHtml(version.created_at)+'</li>';
      }).join('')+'</ul></details>' : '';
    keys = keys.filter(function(key){ return !saved[key].deleted; });
    var pageSize = 3;
    var pageCount = Math.ceil(keys.length / pageSize);
    var pager = pageCount > 1 ? '<div class="contact-pager" data-page="0"><button type="button" data-contact-step="-1" aria-label="Página anterior de contatos" disabled>‹</button>'+
      '<span role="status">1 de '+pageCount+'</span><button type="button" data-contact-step="1" aria-label="Próxima página de contatos">›</button></div>' : '';
    return '<section class="competence-contacts" aria-label="Contatos relacionados"><h4>Contatos relacionados</h4>'+
      keys.map(function(key, i){
        var p = saved[key];
        var meta = cardMeta('contato', key);
        var added = meta && (meta.is_new || orderedHistory(meta).some(function(version){ return version.action === 'added'; }));
        var badge = added ? ' <span class="card-change-badge card-change-new">Adicionado</span>' : '';
        var start = i % pageSize === 0 ? '<div class="contact-pills contact-page"'+(i ? ' hidden' : '')+'>' : '';
        var end = (i + 1) % pageSize === 0 || i + 1 === keys.length ? '</div>' : '';
        return start+'<span class="contact-entry"><button type="button" class="contact-pill" data-contact-key="'+escapeHtml(key)+'" data-contact="'+escapeHtml(p.nome)+'" aria-haspopup="dialog">'+escapeHtml(p.nome)+badge+'</button><button type="button" class="card-edit-button" data-edit-contact="'+escapeHtml(key)+'" aria-label="Editar contato de '+escapeHtml(p.nome)+'">Editar</button></span>'+end;
      }).join('')+pager+'<button type="button" class="card-edit-button" data-add-contact="'+escapeHtml(scope)+'">Adicionar contato</button>'+deletionHistory+'</section>';
  }

  function rdLayerHtml(kind, name){
    var entry = DATA.rdLayers && DATA.rdLayers[kind] && DATA.rdLayers[kind][name];
    if(!entry) return '';
    var cats = [
      {key:'novo', label:'Novo', cls:'rd-novo'},
      {key:'modificacao', label:'Modificação', cls:'rd-mod'},
      {key:'reciclagem', label:'Reciclagem / Circularidade', cls:'rd-rec'}
    ];
    var html = '<div class="section-block"><h4>Sugestões de P&amp;D</h4><div class="rd-grid">';
    cats.forEach(function(c){
      html += '<div class="rd-card '+c.cls+'"><span class="rd-tag">'+c.label+'</span><p>'+entry[c.key]+'</p></div>';
    });
    html += '</div></div>';
    return html;
  }

  function marketCardHtml(label, mk){
    var conf = mk.confianca || 'nao_verificado';
    var confLabel = conf === 'alta' ? 'fonte citada' : (conf === 'media' ? 'estimativa' : 'não verificado');
    return '<div class="market-card"><div class="mk-top"><span class="mk-label">'+label+'</span>' +
      '<span class="confidence conf-'+conf+'">'+confLabel+'</span></div>' +
      '<p class="mk-value">'+escapeHtml(mk.valor)+'</p>' +
      '<p class="mk-src">Fonte: '+escapeHtml(mk.fonte)+'</p></div>';
  }

  // openSectorPanel/openMaterialPanel now navigate full-screen (no right-hand panel)
  // instead of opening the overlay, so every existing call site (home items, flank
  // chips, client cards, reverse-connection links) gets the new drill-down for free.
  function openSectorPanel(index){ goItem('sector', index); }
  function openMaterialPanel(index){ goItem('material', index); }

  function renderItem(){
    var it = itemObj();
    var isSector = state.itemKind === 'sector';
    var html = '';
    html += '<div class="view-head">';
    html += '<button class="back-link" data-nav="home2">&larr; Voltar ao início</button>';
    html += '<span class="panel-eyebrow">'+(isSector ? 'Setor de aplicação' : 'Matéria-prima')+'</span>';
    html += '<h2>'+it.nome+'</h2>';
    html += '<p>'+it.explicacao+'</p>';
    html += '</div>';
    if(isSector){
      var layers = DATA.sectorLayers[it.nome] || [];
      if(layers.length){
        html += '<div class="section-block"><h4>Caminhos de P&amp;D para o setor</h4>';
        html += '<div class="rd-choice-grid">';
        layers.forEach(function(cat, i){
          html += '<button class="rd-choice-card rd-slot'+(i%3)+'" data-rd-cat="'+cat.key+'">' +
            '<span class="rd-tag">'+cat.label+'</span><p>'+cat.texto+'</p>' +
            '<span class="rd-arrow">'+(cat.kind==='materiais' ? 'Ver matéria-prima relacionada' : 'Ver competências relacionadas')+' &rarr;</span></button>';
        });
        html += '</div></div>';
      }
    } else {
      var rdEntry = (DATA.rdLayers.materiais||{})[it.nome];
      if(rdEntry){
        html += '<div class="section-block"><h4>Caminhos de P&amp;D para o setor</h4>';
        html += '<div class="rd-choice-grid">';
        ['novo','modificacao','reciclagem'].forEach(function(cat){
          html += '<button class="rd-choice-card rd-'+cat+'" data-rd-cat="'+cat+'">' +
            '<span class="rd-tag">'+RD_CAT_LABEL[cat]+'</span><p>'+rdEntry[cat]+'</p>' +
            '<span class="rd-arrow">Ver competências relacionadas &rarr;</span></button>';
        });
        html += '</div></div>';
      }
    }

    html += '<div class="section-block item-disclosure"><h4>Exemplos de produtos</h4><div class="tag-list item-content">' +
      it.produtos.map(function(p){return '<span class="tag">'+p+'</span>';}).join('') + '</div></div>';
    html += '<div class="section-block item-disclosure"><h4>Tamanho de mercado</h4><div class="item-content">' +
      marketCardHtml('Brasil', it.mercado_br) + marketCardHtml('Global', it.mercado_global) + '</div></div>';
    if(isSector){
      html += '<div class="section-block item-disclosure"><h4>Exemplos de grandes empresas do setor</h4><div class="item-content"><div class="company-grid">' +
        it.empresas.map(function(e){return '<div class="company-card">'+e+'</div>';}).join('') + '</div></div></div>';
    }
    html += '<div class="cta-row"><button class="btn btn-primary" id="btnItemEdit">Editar card</button><button class="btn btn-ghost" id="btnItemFeedback">Dar opini&atilde;o sobre este item</button></div>';
    appEl.innerHTML = html;
    appEl.querySelector('[data-nav="home2"]').addEventListener('click', goHome);
    document.getElementById('btnItemFeedback').addEventListener('click', function(){
      openFeedbackPanel(isSector ? 'setor' : 'material', it.nome, it.nome);
    });
    document.getElementById('btnItemEdit').addEventListener('click', function(){
      openEditPanel(isSector ? 'setor' : 'material', it.nome, false);
    });
    if(isSector){
      appEl.querySelectorAll('[data-rd-cat]').forEach(function(b){
        b.addEventListener('click', function(){ goDrillInto(b.getAttribute('data-rd-cat')); });
      });
    } else {
      appEl.querySelectorAll('[data-rd-cat]').forEach(function(b){
        b.addEventListener('click', function(){ goRdCategory(b.getAttribute('data-rd-cat')); });
      });
    }
  }

  function sectorLayerByKey(sectorName, key){
    return (DATA.sectorLayers[sectorName] || []).find(function(c){ return c.key === key; });
  }

  // Sector category tree can be arbitrarily deep (branch -> branch -> ... -> leaf
  // with targets). renderDrill renders whatever node the current state.path points
  // to: a list of child branches to go deeper, or the final competência/matéria-prima
  // targets to finish on.
  function renderDrill(){
    var it = itemObj();
    var node = drillNode(it.nome, state.path);
    if(!node){ goItem('sector', state.itemIndex); return; }
    var backLabel = state.path.length > 1 ? drillNode(it.nome, state.path.slice(0,-1)).label : it.nome;
    var html = '';
    html += '<div class="view-head">';
    html += '<button class="back-link" data-nav="drillback">&larr; Voltar a '+backLabel+'</button>';
    html += '<h2>'+it.nome+' &middot; '+node.label+'</h2>';
    html += '<p>'+node.texto+'</p>';
    html += '</div>';

    if(node.children && node.children.length){
      html += '<div class="section-block"><h4>Escolha um caminho</h4><div class="rd-choice-grid">';
      node.children.forEach(function(child, i){
        var arrowText = child.children ? 'Aprofundar' : (child.kind === 'materiais' ? 'Ver matéria-prima relacionada' : 'Ver competências relacionadas');
        html += '<button class="rd-choice-card rd-slot'+(i%3)+'" data-drill-key="'+child.key+'">' +
          '<span class="rd-tag">'+child.label+'</span><p>'+child.texto+'</p>' +
          '<span class="rd-arrow">'+arrowText+' &rarr;</span></button>';
      });
      html += '</div></div>';
    } else if(node.targets){
      if(node.kind === 'materiais'){
        html += '<div class="section-block"><h4>Matéria-prima relacionada a este caminho</h4>';
        node.targets.forEach(function(t){
          html += connCardHtml(t.nome, t.racional, t.aderencia, 'data-go-mat="'+t.nome+'"');
        });
        html += '</div>';
      } else {
        html += '<div class="section-block"><h4>Competências técnicas deste caminho</h4>';
        node.targets.forEach(function(t){
          html += connCardHtml(t.codigo+' — '+t.titulo, t.racional, t.aderencia, 'data-go-comp="'+t.codigo+'"');
        });
        html += '</div>';
      }
    }

    appEl.innerHTML = html;
    appEl.querySelector('[data-nav="drillback"]').addEventListener('click', goDrillBack);
    appEl.querySelectorAll('[data-drill-key]').forEach(function(b){
      b.addEventListener('click', function(){ goDrillInto(b.getAttribute('data-drill-key')); });
    });
    appEl.querySelectorAll('[data-go-comp]').forEach(function(b){
      b.addEventListener('click', function(){
        var code = b.getAttribute('data-go-comp');
        goCompetenciaFull(code[0], code);
      });
    });
    appEl.querySelectorAll('[data-go-mat]').forEach(function(b){
      b.addEventListener('click', function(){
        var idx = DATA.materialsLeft.findIndex(function(m){ return m.nome === b.getAttribute('data-go-mat'); });
        if(idx > -1) goItem('material', idx);
      });
    });
  }

  // renderRdCategory now serves materials only (fixed Novo/Modificação/Reciclagem,
  // single level) -- sectors go through renderDrill above.
  function renderRdCategory(){
    var it = itemObj();
    var cat = state.category;
    var rdEntry = (DATA.rdLayers.materiais||{})[it.nome];
    var navEntry = ((DATA.rdNav.materiais||{})[it.nome]||{})[cat] || [];
    var html = '';
    html += '<div class="view-head">';
    html += '<button class="back-link" data-nav="item2">&larr; Voltar a '+it.nome+'</button>';
    html += '<h2>'+it.nome+' &middot; '+RD_CAT_LABEL[cat]+'</h2>';
    html += '<p>'+(rdEntry ? rdEntry[cat] : '')+'</p>';
    html += '</div>';
    html += '<div class="section-block"><h4>Competências técnicas deste caminho</h4>';
    if(navEntry.length){
      navEntry.forEach(function(sub){
        html += connCardHtml(sub.codigo+' — '+sub.titulo, sub.racional, sub.aderencia, 'data-go-comp="'+sub.codigo+'"');
      });
    } else {
      html += '<div class="empty-note">Ainda não especializamos uma competência específica para este caminho a partir de '+it.nome+'.</div>';
    }
    html += '</div>';
    appEl.innerHTML = html;
    appEl.querySelector('[data-nav="item2"]').addEventListener('click', function(){ goItem(state.itemKind, state.itemIndex); });
    appEl.querySelectorAll('[data-go-comp]').forEach(function(b){
      b.addEventListener('click', function(){
        var code = b.getAttribute('data-go-comp');
        goCompetenciaFull(code[0], code);
      });
    });
  }

  function renderCompetenciaFull(){
    var letter = state.letter, code = state.code;
    var sub = DATA.competencias[letter].subdivisions[code];
    var relatedCompetences = (DATA.relatedCompetences || {})[code] || [];
    var bulletsHtml = sub.bullets.map(function(b, bulletIndex){
      var cardTitle = (letter === 'A' && code === 'A5' && b.indexOf('Processos eletroquímicos:') === 0)
        ? 'Eletroquímica em alta e baixa temperatura'
        : (letter === 'A' && code === 'A5' && b.indexOf('Plasma —') === 0 ? 'Plasma' :
          ((letter === 'A' && (code === 'A3' || code === 'A13')) || (letter === 'B' && code === 'B3') ? b : null));
      var summary = (DATA.competenceSummaries || {})[b] || b;
      var keepOriginalTitle = (letter === 'A' && (code === 'A3' || code === 'A13')) || (letter === 'B' && code === 'B3');
      var description = (sub.bulletDescriptions || {})[String(bulletIndex)] || '';
      var subtitle = description || (keepOriginalTitle ? summary : (cardTitle ? b : summary));
      return '<li class="competence-pair"><article class="competence-row"><div class="competence-description">'+
        '<h3>'+escapeHtml(cardTitle || summary)+'</h3>'+
        ((description || (cardTitle && !keepOriginalTitle) || summary !== b) ? '<p class="competence-subtitle">'+escapeHtml(subtitle)+'</p>' : '')+
        '</div><button type="button" class="card-edit-button bullet-edit-button" data-bullet-edit="'+escapeHtml(b)+'" data-bullet-index="'+bulletIndex+'">Editar card</button></article>'+competenceContactsHtml(code, bulletIndex)+'</li>';
    }).join('');
    var relatedA3Cards = relatedCompetences.filter(function(item){ return item.displayTitle; }).map(function(item){
      return '<li class="competence-pair"><article class="competence-row related-source-card" data-related-comp="'+item.codigo+'"><div class="competence-description">'+
        '<h3>'+escapeHtml(item.displayTitle)+'</h3><p class="competence-subtitle">'+escapeHtml(item.racional)+'</p></div></article>'+competenceContactsHtml(item.codigo, DATA.competencias[item.codigo[0]].subdivisions[item.codigo].bullets.indexOf(item.displayTitle))+'</li>';
    }).join('');
    if(code === 'B3') bulletsHtml += relatedA3Cards;
    var html = '';
    html += '<div class="view-head">';
    html += '<button class="back-link" data-nav="rdcat2">&larr; Voltar às competências do eixo '+letter+'</button>';
    html += '<span class="panel-eyebrow">Competência &middot; Eixo '+letter+' — '+LETTER_META[letter].label+'</span>';
    html += '<h2>'+code+'. '+sub.title+'</h2>';
    html += '</div>';
    html += '<div class="section-block"><h4>Competências relacionadas</h4>';
    html += '<p class="competence-note">Cada card reúne uma competência relacionada e sua descrição.</p>';
    if(code === 'B3' && relatedA3Cards){
      html += '<p class="related-inline-heading">Competências correlatas de A3 — Biotecnológicos</p>';
    }
    html += sub.bullets.length ? ('<ul class="competence-list">'+bulletsHtml+'</ul>') :
      '<p class="plain-p">Nenhuma competência detalhada foi localizada para esta subdivisão.</p>';
    html += '</div>';
    var seenSectors = {};
    var revSectors = (DATA.subToSectors[code] || []).filter(function(it){
      if(seenSectors[it.setor]) return false;
      seenSectors[it.setor] = true;
      return true;
    });
    if(revSectors.length){
      html += '<div class="section-block"><h4>Setores com potencial de aplicação</h4>';
      revSectors.forEach(function(it){
        html += connCardHtml(it.setor, it.racional, it.aderencia, 'data-goto-sector="'+it.setor+'"');
      });
      html += '</div>';
    }
    if(relatedCompetences.length && code !== 'B3'){
      html += '<div class="section-block"><h4>Competências correlatas</h4>';
      html += '<p class="competence-note">Áreas do mapa que podem contribuir para esta competência.</p>';
      relatedCompetences.forEach(function(item){
        html += connCardHtml(item.displayTitle || (item.codigo+' — '+item.titulo), item.racional, item.aderencia, 'data-related-comp="'+item.codigo+'"');
      });
      html += '</div>';
    }
    html += '<div class="cta-row"><button class="btn btn-primary" id="btnCompAddBullet">Adicionar card nesta competência</button><button class="btn btn-ghost" id="btnCompFeedback">Dar opinião sobre esta competência</button></div>';
    appEl.innerHTML = html;
    appEl.querySelector('[data-nav="rdcat2"]').addEventListener('click', function(){
      goSection(letter);
    });
    appEl.querySelectorAll('[data-goto-sector]').forEach(function(button){
      button.addEventListener('click', function(){
        var index = DATA.sectorsRight.findIndex(function(item){return item.nome === button.getAttribute('data-goto-sector');});
        if(index !== -1) window.location.assign('?setor='+index);
      });
    });
    appEl.querySelectorAll('[data-related-comp]').forEach(function(button){
      button.addEventListener('click', function(event){
        if(event.target.closest('.competence-contacts')) return;
        var relatedCode = button.getAttribute('data-related-comp');
        goCompetenciaFull(relatedCode[0], relatedCode);
      });
    });
    appEl.querySelectorAll('[data-bullet-edit]').forEach(function(button){
      button.addEventListener('click', function(){
        var bulletIndex = button.getAttribute('data-bullet-index');
        var bullet = button.getAttribute('data-bullet-edit');
        var description = (sub.bulletDescriptions || {})[String(bulletIndex)] || (DATA.competenceSummaries || {})[bullet] || bullet;
        openBulletPanel(letter, code, bullet, bulletIndex, false, description);
      });
    });
    document.getElementById('btnCompAddBullet').addEventListener('click', function(){
      openBulletPanel(letter, code, '', '', true);
    });
    document.getElementById('btnCompFeedback').addEventListener('click', function(){
      openFeedbackPanel('competencia', code, code+' · '+sub.title);
    });
  }


  function openBulletPanel(letter, code, bullet, bulletIndex, adding, description){
    var html = '<div class="panel-top"><div><span class="panel-eyebrow">Edi&ccedil;&atilde;o protegida</span><h3>'+(adding?'Adicionar card':'Editar card')+'</h3></div><button class="panel-close" data-close aria-label="Fechar">&times;</button></div>';
    html += '<p class="plain-p">Este card pertence &agrave; compet&ecirc;ncia '+escapeHtml(code)+'.</p><form id="bullet-edit-form" class="main-feedback-form"><label>Seu nome <span class="required-label">(obrigat&oacute;rio)</span><input name="editor_name" maxlength="120" required placeholder="Quem est&aacute; fazendo esta altera&ccedil;&atilde;o?"></label><label>Palavra de seguran&ccedil;a<input name="password" type="password" required></label><label>Texto do card<textarea name="bullet" rows="5" required>'+escapeHtml(bullet)+'</textarea></label>'+(adding?'':'<label>Descri&ccedil;&atilde;o do card<textarea name="description" rows="4">'+escapeHtml(description || '')+'</textarea></label>')+'<p class="feedback-status" role="status"></p><button class="btn btn-primary" type="submit">Salvar card</button></form>';
    openPanel(html); overlay.classList.add('feedback-overlay');
    panel.querySelector('[data-close]').addEventListener('click', closePanel);
    var form = panel.querySelector('#bullet-edit-form');
    form.addEventListener('submit', function(event){
      event.preventDefault(); var status=form.querySelector('.feedback-status'); status.textContent='Salvando...';
      fetch('/mapa/cards/edit/', {method:'POST', headers:{'Content-Type':'application/json','X-CSRFToken':getCookie('csrftoken')}, body:JSON.stringify({editor_name:form.elements.editor_name.value.trim(), password:form.elements.password.value, action:adding?'add_bullet':'update_bullet', item_type:'competencia', item_key:code, fields:{bullet:form.elements.bullet.value, description:adding?'':form.elements.description.value, old_bullet:bullet, bullet_index:bulletIndex}})})
        .then(function(response){return response.json().then(function(body){if(!response.ok) throw new Error(body.error||'N&atilde;o foi poss&iacute;vel salvar.');return body;});})
        .then(function(){status.textContent='Card salvo. Atualizando...';window.setTimeout(refreshCurrentMapView,300);})
        .catch(function(error){status.textContent=error.message;});
    });
  }

  function openStagePanel(letter, index){
    var stages = letter === 'B' ? DATA.bContinuum : DATA.cFunnel;
    var s = stages[index];
    var html = '';
    html += '<div class="panel-top"><div><span class="panel-eyebrow">'+(letter==='B'?'Etapa do continuum':'Etapa do funil de inovação')+'</span><h3>'+s.nome+'</h3></div>' +
      '<button class="panel-close" data-close>&times;</button></div>';
    html += '<p class="plain-p">'+s.blurb+'</p>';
    openPanel(html);
    overlay.classList.add('feedback-overlay');
    panel.querySelector('[data-close]').addEventListener('click', closePanel);
  }

  function escapeHtml(str){
    return String(str).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  var params = new URLSearchParams(window.location.search);
  var requestedCode = params.get('competencia');
  if(requestedCode && DATA.competencias[requestedCode[0]] && DATA.competencias[requestedCode[0]].subdivisions[requestedCode]){
    state.view = 'competencia'; state.letter = requestedCode[0]; state.code = requestedCode;
    document.title = requestedCode+' — '+subTitleByCode(requestedCode)+' | Firjan SENAI';
  } else if(AREA_LETTERS.indexOf(params.get('eixo')) !== -1){
    state.view = 'section'; state.letter = params.get('eixo');
  } else if(Object.prototype.hasOwnProperty.call(entryTitles, params.get('entrada'))){
    state.view = 'catalog'; state.kind = params.get('entrada');
  } else if(params.has('setor') && /^\d+$/.test(params.get('setor')) && DATA.sectorsRight[Number(params.get('setor'))]){
    state.view = 'item'; state.itemKind = 'sector'; state.itemIndex = Number(params.get('setor')); state.path = [];
  } else if(params.has('materia') && /^\d+$/.test(params.get('materia')) && DATA.materialsLeft[Number(params.get('materia'))]){
    state.view = 'item'; state.itemKind = 'material'; state.itemIndex = Number(params.get('materia')); state.path = [];
  }
  render();
})();
