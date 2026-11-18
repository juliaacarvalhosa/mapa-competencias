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
  var AREA_LETTERS = ['A','B','C','D','E'];

  var TEAM_COLOR = DATA.teamColors || {};

  // ---------------- state / router ----------------
  var state = { view:'home', letter:null, sub:null, kind:null, index:null };

  var RD_CAT_LABEL = {novo:'Novo', modificacao:'Modificação', reciclagem:'Reciclagem / Circularidade'};

  function render(){
    document.body.classList.toggle('competence-page', state.view === 'competencia');
    if(state.view === 'home') renderHome();
    else if(state.view === 'section') renderSection(state.letter);
    else if(state.view === 'item') renderItem();
    else if(state.view === 'rdcategory') renderRdCategory();
    else if(state.view === 'drill') renderDrill();
    else if(state.view === 'competencia') renderCompetenciaFull();
    renderCrumbs();
    updateSidebar();
    updateTopMenu();
  }

  function updateTopMenu(){
    var menuItems = {
      material: DATA.materialsLeft.map(function(item, index){ return {label:item.nome, kind:'material', index:index}; }),
      competence: AREA_LETTERS.map(function(letter){ return {label:letter+'. '+LETTER_META[letter].label, kind:'competence', letter:letter}; }),
      sector: DATA.sectorsRight.map(function(item, index){ return {label:item.nome, kind:'sector', index:index}; })
    };
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
        if(kind === 'competence') goSection('A');
        else goItem(kind, 0);
      });
    });
  }

  function updateSidebar(){
    var nav = document.getElementById('sidebar-nav');
    if(!nav.hasChildNodes()){
      var home = document.createElement('button');
      home.className = 'sidebar-link';
      home.textContent = 'Início';
      home.dataset.home = 'true';
      home.addEventListener('click', goHome);
      nav.appendChild(home);
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
    parts.push(state.view==='home' ? '<span class="current">Início</span>' :
      '<button data-nav="home">Início</button>');
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
    crumbsEl.innerHTML = parts.join('');
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
  function renderHome(){
    var html = '';
    html += '<div class="view-head"><h2>Navegue pelo mapa de competências</h2>' +
      '<p>Três portas de entrada para o mesmo mapa: matérias-primas, competências técnicas e aplicações de mercado. Qualquer uma leva às outras duas pelas conexões de P&amp;D.</p></div>';
    html += '<p class="processos-note">Selecione um subtópico no menu para explorar as conexões de P&amp;D, as competências e os setores de aplicação.</p>';
    html += '<button class="team-home-btn" id="btnEquipe">&#128101; Ver equipe de pesquisa e contatos</button>';
    html += '<div class="footnote">Piloto de navegação construído a partir de <strong>Competencias_GPA-2026_09_23.pptx</strong> (estrutura visual) e <strong>Mapa_competencias_GPA-2026_09_09.xlsx</strong> (competências por subdivisão, aba “Organização equipes”). Nomes de pesquisadores responsáveis são reais; e-mail, telefone e associação às áreas de competência estão sendo preenchidos aos poucos — campos vazios aparecem como pendentes. Tamanhos de mercado citam a fonte e o nível de confiança de cada número; quando um dado não foi localizado com confiança, isso é declarado explicitamente em vez de estimado.</div>';
    appEl.innerHTML = html;
    var btnEq = document.getElementById('btnEquipe');
    if(btnEq) btnEq.addEventListener('click', openTeamPanel);
  }

  // Replaces the original sparse landing view with three clear entry points.
  function renderHome(){
    var html = '';
    html += '<div class="view-head home-hero"><span class="panel-eyebrow">Mapa de compet&ecirc;ncias &middot; Firjan SENAI SESI</span><h2>Encontre a compet&ecirc;ncia certa para o seu desafio</h2>' +
      '<p>Explore o mapa por mat&eacute;ria-prima, compet&ecirc;ncia t&eacute;cnica ou setor de aplica&ccedil;&atilde;o. Em cada caminho, voc&ecirc; encontra conex&otilde;es de P&amp;D, exemplos de produtos e a equipe relacionada.</p></div>';
    html += '<div class="feedback-callout"><div><span class="feedback-callout-label">Ajude a melhorar o mapa</span><strong>Encontrou algo que falta, sobra ou precisa ser corrigido?</strong><span>Deixe sua sugest&atilde;o agora. Depois, voc&ecirc; tamb&eacute;m poder&aacute; opinar em cada compet&ecirc;ncia.</span></div><div class="feedback-callout-actions"><button class="feedback-callout-button" id="btnHomeFeedback" type="button">Dar opini&atilde;o agora <span aria-hidden="true">&rarr;</span></button><button class="feedback-view-button" id="btnViewFeedback" type="button">Ver opini&otilde;es salvas</button></div></div>';
    html += '<div class="home-start"><div><span class="home-start-kicker">Comece por onde fizer mais sentido</span><h3>Tr&ecirc;s portas de entrada para o mesmo mapa</h3></div><span class="home-start-hint">Voc&ecirc; pode mudar de caminho a qualquer momento.</span></div>';
    html += '<div class="home-entry-grid">';
    html += homeEntryHtml('material', 'Mat&eacute;rias-primas', 'Parta do insumo e descubra rotas de transforma&ccedil;&atilde;o, compet&ecirc;ncias e aplica&ccedil;&otilde;es.', DATA.materialsLeft.length, 'insumos dispon&iacute;veis');
    html += homeEntryHtml('competence', 'Compet&ecirc;ncias t&eacute;cnicas', 'Veja as capacidades organizadas nos cinco eixos do centro de tecnologia.', AREA_LETTERS.length, 'eixos para explorar');
    html += homeEntryHtml('sector', 'Setores de aplica&ccedil;&atilde;o', 'Encontre caminhos de P&amp;D conectados a mercados, produtos e desafios reais.', DATA.sectorsRight.length, 'setores mapeados');
    html += '</div>';
    html += '<div class="home-secondary"><div class="processos-note"><strong>Como navegar:</strong> abra uma entrada, selecione um card e use os links de conex&otilde;es para atravessar o mapa sem perder o contexto.</div>';
    html += '<button class="team-home-btn" id="btnEquipe">&#128101; Ver equipe de pesquisa e contatos</button></div>';
    html += '<div class="footnote">Piloto de navega&ccedil;&atilde;o constru&iacute;do a partir dos materiais de refer&ecirc;ncia do projeto. Campos ainda n&atilde;o preenchidos aparecem como pendentes.</div>';
    appEl.innerHTML = html;
    appEl.querySelectorAll('[data-home-entry]').forEach(function(button){
      button.addEventListener('click', function(){
        var kind = button.getAttribute('data-home-entry');
        if(kind === 'competence') goSection('A');
        else goItem(kind, 0);
      });
    });
    var btnEq = document.getElementById('btnEquipe');
    if(btnEq) btnEq.addEventListener('click', openTeamPanel);
    var btnHomeFeedback = document.getElementById('btnHomeFeedback');
    if(btnHomeFeedback) btnHomeFeedback.addEventListener('click', function(){ openFeedbackPanel('mapa', 'geral', 'Mapa de Competencias Firjan SENAI'); });
    var btnViewFeedback = document.getElementById('btnViewFeedback');
    if(btnViewFeedback) btnViewFeedback.addEventListener('click', openSavedOpinionsPanel);
  }

  function homeEntryHtml(kind, title, description, count, countLabel){
    var icon = kind === 'material' ? '01' : (kind === 'competence' ? '02' : '03');
    return '<button class="home-entry" data-home-entry="'+kind+'">' +
      '<span class="home-entry-top"><span class="home-entry-index">'+icon+'</span><span class="home-entry-arrow" aria-hidden="true">&#8599;</span></span>' +
      '<span class="home-entry-title">'+title+'</span><span class="home-entry-description">'+description+'</span>' +
      '<span class="home-entry-meta"><strong>'+count+'</strong> '+countLabel+'</span></button>';
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
    html += '</div>';

    if(letter === 'A'){
      html += '<div class="section-columns">';
      html += '<div class="flank"><p class="flank-label">Matérias-primas</p>';
      DATA.materialsLeft.forEach(function(m,i){
        html += '<button class="chip" data-open="material" data-index="'+i+'">'+m.nome+'</button>';
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
        html += '<button class="chip" data-open="sector" data-index="'+i+'">'+s.nome+'</button>';
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
      '<span class="sub-title">'+sub.title+'</span>' +
      '<span class="sub-foot">'+dots+'<span class="sub-count">'+sub.bullets.length+' competências</span></span>' +
      '<span class="sub-action">Abrir detalhes <span aria-hidden="true">&rarr;</span></span></button><button type="button" class="sub-feedback" data-card-feedback="'+code+'">Dar opini&atilde;o</button></div>';
  }

  // ---------------- PANELS ----------------
  function openPanel(innerHtml){
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
    html += '<form id="main-feedback-form" class="main-feedback-form"><input type="hidden" name="item_type" value="'+escapeHtml(itemType)+'"><input type="hidden" name="item_key" value="'+escapeHtml(itemKey)+'"><input type="hidden" name="item_title" value="'+escapeHtml(itemTitle)+'">';
    html += '<label>Seu nome <span class="required-label">(obrigat&oacute;rio)</span><input name="name" maxlength="120" required placeholder="Como devemos identificar sua contribui&ccedil;&atilde;o?"></label>';
    html += '<label>O que voc&ecirc; acrescentaria?<textarea name="add" rows="3" placeholder="Uma compet&ecirc;ncia, exemplo ou informa&ccedil;&atilde;o que est&aacute; faltando"></textarea></label>';
    html += '<label>O que voc&ecirc; retiraria ou corrigiria?<textarea name="remove" rows="3" placeholder="Algo repetido, desatualizado ou fora de contexto"></textarea></label>';
    html += '<label>Coment&aacute;rios gerais<textarea name="comments" rows="3" placeholder="Contexto ou justificativa"></textarea></label><p class="feedback-status" role="status"></p><button class="btn btn-primary" type="submit">Salvar contribui&ccedil;&atilde;o</button></form>';
    html += '<div class="feedback-history"><h4>Contribui&ccedil;&otilde;es recentes</h4><div class="feedback-history-list">'+feedbackListHtml(itemType,itemKey)+'</div></div>';
    openPanel(html);
    overlay.classList.add('feedback-overlay');
    panel.querySelector('[data-close]').addEventListener('click', closePanel);
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
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closePanel(); });

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

  function researchersForArea(areaOrCode){
    var all = (DATA.leadResearchers||[]).concat(DATA.seniorResearchers||[]);
    return all.filter(function(p){
      return (p.areas||[]).some(function(a){
        return a === areaOrCode || a === areaOrCode.replace(/[0-9]+$/, '');
      });
    });
  }

  function openSubResearchersPanel(letter, code, subTitle){
    var matches = researchersForArea(letter + code).concat(researchersForArea(letter))
      .filter(function(p, i, arr){ return arr.indexOf(p) === i; });
    var html = '';
    html += '<div class="panel-top"><div><span class="panel-eyebrow">Pesquisador(es) responsável(eis)</span><h3>'+letter+code+'. '+subTitle+'</h3></div>' +
      '<button class="panel-close" data-close>&times;</button></div>';
    if(matches.length === 0){
      html += '<div class="empty-note">Ainda não há pesquisador associado a esta subdivisão. As associações estão sendo preenchidas na planilha de referência (abas 05 e 06) — enquanto isso, veja a equipe completa.</div>';
      html += '<div class="cta-row"><button class="btn btn-ghost" data-open-team>Ver toda a equipe de pesquisa</button></div>';
    } else {
      matches.forEach(function(p){ html += researcherCardHtml(p); });
    }
    openPanel(html);
    panel.querySelector('[data-close]').addEventListener('click', closePanel);
    bindResearcherCardButtons();
    var teamBtn = panel.querySelector('[data-open-team]');
    if(teamBtn) teamBtn.addEventListener('click', openTeamPanel);
  }

  function openTeamPanel(){
    var html = '';
    html += '<div class="panel-top"><div><span class="panel-eyebrow">Equipe de pesquisa</span><h3>Pesquisadores responsáveis</h3></div>' +
      '<button class="panel-close" data-close>&times;</button></div>';
    html += '<div class="section-block"><h4>Liderança / responsáveis diretos</h4>';
    (DATA.leadResearchers||[]).forEach(function(p){ html += researcherCardHtml(p); });
    html += '</div>';
    html += '<div class="section-block"><h4>Pesquisadores III e IV</h4>';
    if((DATA.seniorResearchers||[]).length === 0){
      html += '<div class="empty-note">Lista pendente — será preenchida a partir da planilha de RH, filtrando os cargos Pesquisador III e Pesquisador IV.</div>';
    } else {
      (DATA.seniorResearchers||[]).forEach(function(p){ html += researcherCardHtml(p); });
    }
    html += '</div>';
    openPanel(html);
    panel.querySelector('[data-close]').addEventListener('click', closePanel);
    bindResearcherCardButtons();
  }

  function initials(nome){
    return nome.split(' ').filter(function(w){return w.length>2;}).slice(0,2).map(function(w){return w[0];}).join('').toUpperCase();
  }

  var AVATAR_PALETTE = ['#1B4B45','#3D6FA8','#7A4FA3','#B15A8A','#C08A2E','#3E8E4F','#9C4A3C'];
  function avatarColor(nome){
    var h = 0;
    for(var i=0;i<nome.length;i++){ h = (h*31 + nome.charCodeAt(i)) % AVATAR_PALETTE.length; }
    return AVATAR_PALETTE[h];
  }

  function researcherCardHtml(p){
    var areasHtml = (p.areas && p.areas.length) ?
      '<div class="tag-list" style="margin-top:6px">'+p.areas.map(function(a){return '<span class="tag">'+a+'</span>';}).join('')+'</div>' :
      '<p class="pending-field">Área(s) de competência: a associar</p>';
    var emailOk = !!(p.email && p.email.trim());
    var waOk = !!(p.telefone && p.telefone.trim());
    var mailHref = emailOk ? ('mailto:'+p.email.trim()+'?subject='+encodeURIComponent('Contato — Mapa de Competências GPA')) : '#';
    var waDigits = waOk ? p.telefone.replace(/[^0-9]/g,'') : '';
    var waHref = waOk ? ('https://wa.me/'+waDigits+'?text='+encodeURIComponent('Olá '+p.nome.split(' ')[0]+', estou entrando em contato a partir do Mapa de Competências GPA.')) : '#';
    return '<div class="researcher">' +
      '<div class="avatar" style="background:'+avatarColor(p.nome)+'">'+initials(p.nome)+'</div>' +
      '<div class="researcher-info">' +
        '<p class="r-name">'+p.nome+'</p>' +
        '<p class="r-role">'+(p.cargo || '<span class="pending-field">Cargo a preencher</span>')+'</p>' +
        (emailOk ? '' : '<p class="pending-field">E-mail: a preencher</p>') +
        (waOk ? '' : '<p class="pending-field">Telefone: a preencher</p>') +
        areasHtml +
      '</div></div>' +
      '<div class="contact-actions">' +
        '<button class="contact-btn mail" data-mail="'+mailHref+'" '+(emailOk?'':'disabled')+'>&#9993; E-mail</button>' +
        '<button class="contact-btn wa" data-wa="'+waHref+'" '+(waOk?'':'disabled')+'>&#128172; WhatsApp</button>' +
      '</div>';
  }

  function bindResearcherCardButtons(){
    panel.querySelectorAll('[data-mail]:not([disabled])').forEach(function(b){
      b.addEventListener('click', function(){ window.open(b.getAttribute('data-mail'), '_blank'); });
    });
    panel.querySelectorAll('[data-wa]:not([disabled])').forEach(function(b){
      b.addEventListener('click', function(){ window.open(b.getAttribute('data-wa'), '_blank'); });
    });
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
    html += '<div class="section-block"><h4>Exemplos de produtos</h4><div class="tag-list">' +
      it.produtos.map(function(p){return '<span class="tag">'+p+'</span>';}).join('') + '</div></div>';
    html += '<div class="section-block"><h4>Tamanho de mercado</h4>' +
      marketCardHtml('Brasil', it.mercado_br) + marketCardHtml('Global', it.mercado_global) + '</div>';
    if(isSector){
      html += '<div class="section-block"><h4>Exemplos de grandes empresas do setor</h4><div class="company-grid">' +
        it.empresas.map(function(e){return '<div class="company-card">'+e+'</div>';}).join('') + '</div></div>';
    }
    html += '<div class="cta-row"><button class="btn btn-ghost" id="btnItemFeedback">Dar opini&atilde;o sobre este item</button></div>';
    appEl.innerHTML = html;
    appEl.querySelector('[data-nav="home2"]').addEventListener('click', goHome);
    document.getElementById('btnItemFeedback').addEventListener('click', function(){
      openFeedbackPanel(isSector ? 'setor' : 'material', it.nome, it.nome);
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
    var bulletsHtml = sub.bullets.map(function(b){
      var cardTitle = (letter === 'A' && code === 'A5' && b.indexOf('Processos eletroquímicos:') === 0)
        ? 'Eletroquímica em alta e baixa temperatura'
        : (letter === 'A' && code === 'A5' && b.indexOf('Plasma —') === 0 ? 'Plasma' :
          ((letter === 'A' && (code === 'A3' || code === 'A13')) || (letter === 'B' && code === 'B3') ? b : null));
      var summary = (DATA.competenceSummaries || {})[b] || b;
      var keepOriginalTitle = (letter === 'A' && (code === 'A3' || code === 'A13')) || (letter === 'B' && code === 'B3');
      var subtitle = keepOriginalTitle ? summary : (cardTitle ? b : summary);
      return '<li class="competence-row"><div class="competence-description">'+
        '<h3>'+escapeHtml(cardTitle || summary)+'</h3>'+
        (((cardTitle && !keepOriginalTitle) || summary !== b) ? '<p class="competence-subtitle">'+escapeHtml(subtitle)+'</p>' : '')+
        '</div></li>';
    }).join('');
    var relatedA3Cards = relatedCompetences.filter(function(item){ return item.displayTitle; }).map(function(item){
      return '<li class="competence-row related-source-card" data-related-comp="'+item.codigo+'"><div class="competence-description">'+
        '<h3>'+escapeHtml(item.displayTitle)+'</h3><p class="competence-subtitle">'+escapeHtml(item.racional)+'</p></div></li>';
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
    html += '<div class="cta-row"><button class="btn btn-primary" id="btnCompResearchers">Contato do(s) pesquisador(es) responsável(eis)</button><button class="btn btn-ghost" id="btnCompFeedback">Dar opinião sobre esta competência</button></div>';
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
      button.addEventListener('click', function(){
        var relatedCode = button.getAttribute('data-related-comp');
        goCompetenciaFull(relatedCode[0], relatedCode);
      });
    });
    document.getElementById('btnCompResearchers').addEventListener('click', function(){
      openSubResearchersPanel(letter, code, sub.title);
    });
    document.getElementById('btnCompFeedback').addEventListener('click', function(){
      openFeedbackPanel('competencia', code, code+' · '+sub.title);
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
  } else if(params.has('setor') && /^\d+$/.test(params.get('setor')) && DATA.sectorsRight[Number(params.get('setor'))]){
    state.view = 'item'; state.itemKind = 'sector'; state.itemIndex = Number(params.get('setor')); state.path = [];
  }
  render();
})();
