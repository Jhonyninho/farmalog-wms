// app.js — preserva lógica do seu projeto, compatível com novo HTML/CSS
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw8nzS41FwEvecmWBSFLsAcxVij68jiKf_xH59jigYL2eS2pNyb_1jcYgxeoskwJsBc9Q/exec";

const qs = sel => document.querySelector(sel);
const qsa = sel => Array.from(document.querySelectorAll(sel));

function showScreen(screenId){
  // hide all screens
  qsa('.screen').forEach(s => s.classList.add('hidden'));
  // show the requested
  const el = qs('#' + screenId);
  if(el) el.classList.remove('hidden');
  // if history, load
  if(screenId === 'screen-historico') filtrarHistorico();
}

/* LOGIN */
function login(){
  const usuario = (qs('#user') && qs('#user').value.trim()) || '';
  const senha = (qs('#senha') && qs('#senha').value.trim()) || '';
  if(!usuario || !senha){ if(qs('#login-msg')) qs('#login-msg').innerText = 'Preencha usuário e senha'; return; }

  fetch(`${SCRIPT_URL}?acao=login&usuario=${encodeURIComponent(usuario)}&senha=${encodeURIComponent(senha)}`)
    .then(r=>r.json())
    .then(data=>{
      if(data.ok){
        if(qs('#screen-login')) qs('#screen-login').classList.add('hidden');
        if(qs('#app')) qs('#app').classList.remove('hidden');
        showScreen('screen-register');
      } else {
        if(qs('#login-msg')) qs('#login-msg').innerText = data.erro || 'Usuário ou senha incorretos';
      }
    })
    .catch(()=> { if(qs('#login-msg')) qs('#login-msg').innerText = 'Erro na requisição'; });
}

function logout(){
  if(qs('#app')) qs('#app').classList.add('hidden');
  if(qs('#screen-login')) qs('#screen-login').classList.remove('hidden');
  if(qs('#user')) qs('#user').value='';
  if(qs('#senha')) qs('#senha').value='';
}

/* BUSCAR PRODUTO (Registrar) */
function buscarProduto(){
  const chave = (qs('#busca') && qs('#busca').value.trim()) || '';
  if(!chave){ alert('Digite EAN ou COD'); return; }

  fetch(`${SCRIPT_URL}?acao=buscar_produto&chave=${encodeURIComponent(chave)}`)
    .then(r=>r.json())
    .then(data=>{
      if(data.erro){ alert(data.erro); return; }

      if(qs('#reg_ean')) qs('#reg_ean').value = data.ean || '';
      if(qs('#reg_codind')) qs('#reg_codind').value = data.cod_ind || '';
      if(qs('#reg_codint')) qs('#reg_codint').value = data.cod_int || '';
      if(qs('#reg_nome')) qs('#reg_nome').value = data.nome_produto || '';
      if(qs('#reg_endprat')) qs('#reg_endprat').value = data.endereco_prat || '';

      const loteSel = qs('#reg_lote');
      if(loteSel){
        loteSel.innerHTML = '';
        (data.lotes || []).forEach(l=>{
          const opt = document.createElement('option');
          opt.value = l.lote || '';
          opt.textContent = l.lote || '';
          opt.dataset.venc = l.venc || '';
          loteSel.appendChild(opt);
        });
      }
      atualizarValidadeReg();
    })
    .catch(()=> alert('Erro ao buscar produto'));
}

function atualizarValidadeReg(){
  const sel = qs('#reg_lote');
  const inp = qs('#reg_validade');
  if(!sel || !inp){ if(inp) inp.value = ''; return; }
  const opt = sel.options[sel.selectedIndex];
  if(!opt){ inp.value=''; return; }
  let venc = opt.dataset.venc || '';
  const d = new Date(venc);
  if(!isNaN(d.getTime())) venc = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  inp.value = venc;
}

/* REGISTRAR */
function registrarProduto(){
  const usuario = (qs('#user') && qs('#user').value.trim()) || '';
  const endereco = (qs('#reg_endereco') && qs('#reg_endereco').value.trim()) || '';
  const ean = (qs('#reg_ean') && qs('#reg_ean').value.trim()) || '';
  const lote = (qs('#reg_lote') && qs('#reg_lote').value.trim()) || '';
  const qtd = (qs('#reg_qtd') && qs('#reg_qtd').value.trim()) || '';
  const cod_int = (qs('#reg_codint') && qs('#reg_codint').value.trim()) || '';
  const cod_ind = (qs('#reg_codind') && qs('#reg_codind').value.trim()) || '';
  const nome = (qs('#reg_nome') && qs('#reg_nome').value.trim()) || '';
  const endPrat = (qs('#reg_endprat') && qs('#reg_endprat').value.trim()) || '';
  const venc = (qs('#reg_validade') && qs('#reg_validade').value.trim()) || '';

  if(!endereco || !ean || !lote || !qtd){ alert('Preencha todos os campos'); return; }

  const params = [
    `acao=entrar_caixas`,
    `endereco=${encodeURIComponent(endereco)}`,
    `ean=${encodeURIComponent(ean)}`,
    `lote=${encodeURIComponent(lote)}`,
    `caixas=${encodeURIComponent(qtd)}`,
    `usuario=${encodeURIComponent(usuario)}`,
    `cod_int=${encodeURIComponent(cod_int)}`,
    `cod_ind=${encodeURIComponent(cod_ind)}`,
    `nome_produto=${encodeURIComponent(nome)}`,
    `endereco_prat=${encodeURIComponent(endPrat)}`,
    `vencimento=${encodeURIComponent(venc)}`
  ].join('&');

  fetch(`${SCRIPT_URL}?${params}`)
    .then(r=>r.json())
    .then(d=>{
      if(d.ok){ alert('Registrado com sucesso!'); if(qs('#reg_qtd')) qs('#reg_qtd').value='1'; if(qs('#reg_endereco')) qs('#reg_endereco').value=''; } 
      else alert(d.erro || 'Erro ao registrar');
    })
    .catch(()=> alert('Erro ao registrar'));
}

/* FILTRAR ESTOQUE */
function filtrarEstoque(){
  const query = (qs('#q_search') && qs('#q_search').value.trim()) || '';
  fetch(`${SCRIPT_URL}?acao=filtrar_estoque&query=${encodeURIComponent(query)}`)
    .then(r=>r.json())
    .then(list=>{
      const tbody = qs('#estoque-tabela tbody');
      if(!tbody) return;
      tbody.innerHTML = '';
      if(!list || list.length === 0){ tbody.innerHTML = '<tr><td colspan="10">Nenhum resultado</td></tr>'; return; }

      list.forEach(r=>{
        const d = new Date(r[7]);
        const venc = !isNaN(d.getTime()) ? `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}` : r[7];
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${r[0]||''}</td><td>${r[1]||''}</td><td>${r[2]||''}</td>
          <td>${r[3]||''}</td><td>${r[4]||''}</td><td>${r[5]||''}</td>
          <td>${r[6]||''}</td><td>${venc||''}</td><td>${r[8]||''}</td>
          <td><button class="btn-danger" onclick="excluirProdutoDireto('${r[0]}','${r[2]}','${r[6]}')">Excluir</button></td>
        `;
        tbody.appendChild(tr);
      });
    })
    .catch(()=> alert('Erro na consulta'));
}

/* EXCLUIR */
function excluirProdutoDireto(endereco, ean, lote){
  const usuario = (qs('#user') && qs('#user').value.trim()) || '';
  if(!confirm('Confirma exclusão?')) return;
  fetch(`${SCRIPT_URL}?acao=excluir_produto_endereco&endereco=${encodeURIComponent(endereco)}&ean=${encodeURIComponent(ean)}&lote=${encodeURIComponent(lote)}&usuario=${encodeURIComponent(usuario)}`)
    .then(r=>r.json())
    .then(d=>{
      if(d.ok){ alert('Excluído!'); filtrarEstoque(); } else alert(d.erro || 'Erro ao excluir');
    })
    .catch(()=> alert('Erro na requisição'));
}

/* ABASTECER */
let abDadosProduto = null;

function abBuscar(){
  const ean = (qs('#ab_ean') && qs('#ab_ean').value.trim()) || '';
  const endereco = (qs('#ab_endereco') && qs('#ab_endereco').value.trim()) || '';
  const prodSel = qs('#ab_produtos');
  const loteSel = qs('#ab_lotes');
  const valInp = qs('#ab_validade');

  if(prodSel) prodSel.innerHTML = '';
  if(loteSel) loteSel.innerHTML = '';
  if(valInp) valInp.value = '';
  abDadosProduto = null;

  if(ean){
    fetch(`${SCRIPT_URL}?acao=buscar_produto&chave=${encodeURIComponent(ean)}`)
      .then(r=>r.json())
      .then(data=>{
        if(data.erro){ alert(data.erro); return; }
        abDadosProduto = data;

        if(prodSel){
          const opt = document.createElement('option');
          opt.value = data.ean || '';
          opt.textContent = `${data.nome_produto || ''} | ${data.ean || ''}`;
          prodSel.appendChild(opt);
        }

        (data.lotes||[]).forEach(l=>{
          if(loteSel){
            const o = document.createElement('option');
            o.value = l.lote || '';
            o.textContent = l.lote || '';
            o.dataset.venc = l.venc || '';
            loteSel.appendChild(o);
          }
        });
        atualizarValidadeAb();
      });
    return;
  }

  if(endereco){
    fetch(`${SCRIPT_URL}?acao=listar_endereco&endereco=${encodeURIComponent(endereco)}`)
      .then(r=>r.json())
      .then(list=>{
        if(!list || list.length === 0){ alert('Nenhum produto neste endereço'); return; }
        if(prodSel) list.forEach(p=>{
          const opt = document.createElement('option');
          opt.value = `${p[2]}|${p[6]}`;
          opt.textContent = `${p[5] || ''} | L:${p[6] || ''} | Q:${p[8] || ''}`;
          prodSel.appendChild(opt);
        });
      });
    return;
  }

  alert('Informe EAN ou ENDEREÇO');
}

function atualizarValidadeAb(){
  const loteSel = qs('#ab_lotes');
  const inp = qs('#ab_validade');
  if(!loteSel || !inp) return;
  const opt = loteSel.options[loteSel.selectedIndex];
  if(!opt){ inp.value=''; return; }
  let venc = opt.dataset.venc || '';
  const d = new Date(venc);
  if(!isNaN(d.getTime())) venc = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  inp.value = venc;
}

const abLotesEl = qs('#ab_lotes');
if(abLotesEl) abLotesEl.addEventListener('change', atualizarValidadeAb);

function montarExtrasAbastecimento(ean, lote){
  if(!abDadosProduto) return null;
  const loteInfo = (abDadosProduto.lotes||[]).find(l => l.lote === lote);
  return {
    cod_int: abDadosProduto.cod_int,
    cod_ind: abDadosProduto.cod_ind,
    nome_produto: abDadosProduto.nome_produto,
    endereco_prat: abDadosProduto.endereco_prat,
    venc: loteInfo ? loteInfo.venc : ""
  };
}

function abAdicionar(){
  const usuario = (qs('#user') && qs('#user').value.trim()) || '';
  const endereco = (qs('#ab_endereco') && qs('#ab_endereco').value.trim()) || '';
  const caixas = (qs('#ab_caixas') && qs('#ab_caixas').value.trim()) || '0';
  const sel = parseSelectedProductForAb();
  const ean = sel.ean; const lote = sel.lote;
  const venc = (qs('#ab_validade') && qs('#ab_validade').value.trim()) || '';

  if(!ean || !lote){ alert('Selecione produto e lote'); return; }
  const extras = montarExtrasAbastecimento(ean, lote);
  if(!extras){ alert('Busque o produto antes de adicionar!'); return; }

  const params = [
    `acao=entrar_caixas`,
    `endereco=${encodeURIComponent(endereco)}`,
    `ean=${encodeURIComponent(ean)}`,
    `lote=${encodeURIComponent(lote)}`,
    `caixas=${encodeURIComponent(caixas)}`,
    `usuario=${encodeURIComponent(usuario)}`,
    `cod_int=${encodeURIComponent(extras.cod_int)}`,
    `cod_ind=${encodeURIComponent(extras.cod_ind)}`,
    `nome_produto=${encodeURIComponent(extras.nome_produto)}`,
    `endereco_prat=${encodeURIComponent(extras.endereco_prat)}`,
    `vencimento=${encodeURIComponent(venc)}`
  ].join('&');

  fetch(`${SCRIPT_URL}?${params}`)
    .then(r=>r.json())
    .then(d=>{
      if(d.ok){ alert('Caixas adicionadas'); abBuscar(); } else alert(d.erro || 'Erro');
    })
    .catch(()=> alert('Erro na requisição'));
}

function abRetirar(){
  const usuario = (qs('#user') && qs('#user').value.trim()) || '';
  const endereco = (qs('#ab_endereco') && qs('#ab_endereco').value.trim()) || '';
  const caixas = (qs('#ab_caixas') && qs('#ab_caixas').value.trim()) || '0';
  const sel = parseSelectedProductForAb();
  const ean = sel.ean; const lote = sel.lote;
  const venc = (qs('#ab_validade') && qs('#ab_validade').value.trim()) || '';

  if(!ean || !lote){ alert('Selecione produto e lote'); return; }
  const extras = montarExtrasAbastecimento(ean, lote);
  if(!extras){ alert('Busque o produto antes de retirar!'); return; }

  const params = [
    `acao=sair_caixas`,
    `endereco=${encodeURIComponent(endereco)}`,
    `ean=${encodeURIComponent(ean)}`,
    `lote=${encodeURIComponent(lote)}`,
    `caixas=${encodeURIComponent(caixas)}`,
    `usuario=${encodeURIComponent(usuario)}`,
    `cod_int=${encodeURIComponent(extras.cod_int)}`,
    `cod_ind=${encodeURIComponent(extras.cod_ind)}`,
    `nome_produto=${encodeURIComponent(extras.nome_produto)}`,
    `endereco_prat=${encodeURIComponent(extras.endereco_prat)}`,
    `vencimento=${encodeURIComponent(venc)}`
  ].join('&');

  fetch(`${SCRIPT_URL}?${params}`)
    .then(r=>r.json())
    .then(d=>{
      if(d.ok){ alert('Caixas retiradas'); abBuscar(); } else alert(d.erro || 'Erro');
    })
    .catch(()=> alert('Erro na requisição'));
}

/* HISTÓRICO */
function filtrarHistorico(){
  const q = (qs('#h_search') && qs('#h_search').value.trim()) || '';
  fetch(`${SCRIPT_URL}?acao=filtrar_historico&query=${encodeURIComponent(q)}`)
    .then(r=>r.json())
    .then(list=>{
      const tbody = qs('#historico-tabela tbody');
      if(!tbody) return;
      tbody.innerHTML = '';
      if(!list || list.length === 0){ tbody.innerHTML = '<tr><td colspan="7">Nenhum registro</td></tr>'; return; }

      list.forEach(r=>{
        const d = new Date(r[0]);
        const dataFmt = !isNaN(d.getTime()) ? `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()} ${d.toLocaleTimeString()}` : r[0];
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${dataFmt}</td><td>${r[1]||''}</td><td>${r[2]||''}</td>
          <td>${r[3]||''}</td><td>${r[4]||''}</td><td>${r[5]||''}</td><td>${r[6]||''}</td>
        `;
        tbody.appendChild(tr);
      });
    })
    .catch(()=> alert('Erro ao consultar histórico'));
}

/* util */
function parseSelectedProductForAb(){
  const sel = qs('#ab_produtos');
  const val = sel ? sel.value : '';
  if(!val) return { ean:'', lote:'' };
  if(val.includes('|')){ const [ean,lote] = val.split('|'); return { ean, lote }; }
  return { ean: val, lote: (qs('#ab_lotes') ? qs('#ab_lotes').value : '') };
}

/* ENTER handlers */
['busca','q_search','h_search'].forEach(id=>{
  const el = qs('#'+id);
  if(el) el.addEventListener('keypress', e=>{ if(e.key==='Enter'){ if(id==='busca') buscarProduto(); if(id==='q_search') filtrarEstoque(); if(id==='h_search') filtrarHistorico(); } });
});
