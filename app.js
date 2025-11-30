// ================================================================
// app.js FINAL — FARMALOG WMS (cliente)
// Atualizado: corrige lógica STATUS na CONFERÊNCIA (ERP - APP)
// ================================================================

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw8nzS41FwEvecmWBSFLsAcxVij68jiKf_xH59jigYL2eS2pNyb_1jcYgxeoskwJsBc9Q/exec";

const qs  = (sel)=>document.querySelector(sel);
const qsa = (sel)=>Array.from(document.querySelectorAll(sel));

// =============================
// EXIBIR TELA
// =============================
function showScreen(id){
    qsa(".screen").forEach(s=>s.classList.add("hidden"));
    const el = qs("#"+id);
    if(el) el.classList.remove("hidden");

    if(id==="screen-historico") filtrarHistorico();
    if(id==="screen-conferencia") buscarConferencia();
    if(id==="screen-validade") buscarValidade(true);
}

// ================================================================
// FUNÇÕES AUXILIARES
// ================================================================
function safeJson(r){ return r.json().catch(()=>({erro:"JSON inválido"})); }

function formatDDMMYYYY(dateLike){
    if(!dateLike) return "";
    try{
        if(typeof dateLike==="string" && /^\d{4}-\d{2}-\d{2}/.test(dateLike)){
            const d = new Date(dateLike);
            if(!isNaN(d.getTime()))
                return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
        }
        const n = Number(dateLike);
        if(!isNaN(n) && n>1000000000){
            const d = new Date(n);
            return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
        }
        if(typeof dateLike==="string" && /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(dateLike)){
            let p=dateLike.split("/");
            let d=p[0].padStart(2,'0');
            let m=p[1].padStart(2,'0');
            let y=p[2].length===2?("20"+p[2]):p[2];
            return `${d}/${m}/${y}`;
        }
        const d = new Date(dateLike);
        if(!isNaN(d.getTime()))
            return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
    }catch(e){}
    return "";
}

function forceISO(dateLike){
    if(!dateLike) return "";
    if(/^\d{4}-\d{2}-\d{2}/.test(dateLike)) return dateLike.split("T")[0];
    if(/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(dateLike)){
        let p=dateLike.split("/");
        let d=p[0].padStart(2,'0');
        let m=p[1].padStart(2,'0');
        let y=p[2].length===2?("20"+p[2]):p[2];
        return `${y}-${m}-${d}`;
    }
    const n = Number(dateLike);
    if(!isNaN(n) && n>1000000000) return new Date(n).toISOString().slice(0,10);
    const d = new Date(dateLike);
    if(!isNaN(d.getTime())) return d.toISOString().slice(0,10);
    return "";
}

// ================================================================
// LOGIN
// ================================================================
function login(){
    const usuario = (qs("#user") ? qs("#user").value.trim() : "");
    const senha   = (qs("#senha") ? qs("#senha").value.trim() : "");
    if(!usuario || !senha){
        if(qs("#login-msg")) qs("#login-msg").innerText = "Preencha usuário e senha";
        return;
    }

    fetch(`${SCRIPT_URL}?acao=login&usuario=${encodeURIComponent(usuario)}&senha=${encodeURIComponent(senha)}`)
    .then(safeJson)
    .then(r=>{
        if(r.ok){
            if(qs("#screen-login")) qs("#screen-login").classList.add("hidden");
            if(qs("#app")) qs("#app").classList.remove("hidden");
            showScreen("screen-register");
        } else {
            if(qs("#login-msg")) qs("#login-msg").innerText = r.erro||"Erro login";
        }
    })
    .catch(()=> { if(qs("#login-msg")) qs("#login-msg").innerText = "Erro na requisição"; });
}

function logout(){
    if(qs("#app")) qs("#app").classList.add("hidden");
    if(qs("#screen-login")) qs("#screen-login").classList.remove("hidden");
}

// ================================================================
// BUSCAR PRODUTO (Registrar)
// ================================================================
function buscarProduto(){
    const chave = (qs("#busca") ? qs("#busca").value.trim() : "");
    if(!chave){ alert("Digite código"); return;}

    fetch(`${SCRIPT_URL}?acao=buscar_produto&chave=${encodeURIComponent(chave)}`)
    .then(safeJson)
    .then(r=>{
        if(r.erro){ alert(r.erro); return; }

        if(qs("#reg_ean")) qs("#reg_ean").value = r.ean||"";
        if(qs("#reg_codind")) qs("#reg_codind").value = r.cod_ind||"";
        if(qs("#reg_codint")) qs("#reg_codint").value = r.cod_int||"";
        if(qs("#reg_nome")) qs("#reg_nome").value = r.nome_produto||"";
        if(qs("#reg_endprat")) qs("#reg_endprat").value = r.endereco_prat||"";

        const sel = qs("#reg_lote");
        if(sel){
            sel.innerHTML="";
            (r.lotes||[]).forEach(l=>{
                const o=document.createElement("option");
                o.value = l.lote || "";
                o.textContent = l.lote || "";
                o.dataset.venc = forceISO(l.venc || "");
                sel.appendChild(o);
            });
            if(sel.options.length>0) sel.selectedIndex=0;
        }
        atualizarValidadeReg();
    })
    .catch(()=> alert("Erro ao buscar produto"));
}

function atualizarValidadeReg(){
    const sel = qs("#reg_lote");
    const inp = qs("#reg_validade");
    if(!sel || !inp){ if(inp) inp.value=""; return; }
    const opt = sel.options[sel.selectedIndex];
    if(!opt){ inp.value=""; return; }
    inp.value = formatDDMMYYYY(opt.dataset.venc);
}

// ================================================================
// REGISTRAR MOVIMENTAÇÃO
// ================================================================
function registrarProduto(){
    const usuario = (qs("#user") ? qs("#user").value.trim() : "");

    const params = {
        acao:"entrar_caixas",
        endereco:(qs("#reg_endereco")?qs("#reg_endereco").value.trim():""),
        ean:(qs("#reg_ean")?qs("#reg_ean").value.trim():""),
        lote:(qs("#reg_lote")?qs("#reg_lote").value.trim():""),
        caixas:(qs("#reg_qtd")?qs("#reg_qtd").value.trim():""),
        usuario,
        cod_int:(qs("#reg_codint")?qs("#reg_codint").value.trim():""),
        cod_ind:(qs("#reg_codind")?qs("#reg_codind").value.trim():""),
        nome_produto:(qs("#reg_nome")?qs("#reg_nome").value.trim():""),
        endereco_prat:(qs("#reg_endprat")?qs("#reg_endprat").value.trim():""),
        vencimento:(qs("#reg_validade")?qs("#reg_validade").value.trim():"")
    };

    if(!params.endereco || !params.ean || !params.lote || !params.caixas){
        alert("Preencha todos os campos");
        return;
    }

    const q = Object.entries(params)
        .map(([k,v])=>`${k}=${encodeURIComponent(v)}`).join("&");

    fetch(`${SCRIPT_URL}?${q}`)
    .then(safeJson)
    .then(r=>{
        if(r.ok){
            alert("Registrado!");
            if(qs("#reg_endereco")) qs("#reg_endereco").value="";
            if(qs("#reg_qtd")) qs("#reg_qtd").value="1";
        } else alert(r.erro||"Erro registrar");
    })
    .catch(()=> alert("Erro ao registrar"));
}

// ================================================================
// ESTOQUE (Consulta)
// ================================================================
function filtrarEstoque(){
    const q = (qs("#q_search")?qs("#q_search").value.trim():"");
    fetch(`${SCRIPT_URL}?acao=filtrar_estoque&query=${encodeURIComponent(q)}`)
    .then(safeJson)
    .then(list=>{
        const tbody = qs("#estoque-tabela tbody");
        if(!tbody) return;
        tbody.innerHTML="";
        if(!list || list.length===0){
            tbody.innerHTML="<tr><td colspan=10>Nenhum</td></tr>";
            return;
        }

        list.forEach(r=>{
            const venc = formatDDMMYYYY(r[7]);
            const tr=document.createElement("tr");
            tr.innerHTML=`
                <td>${r[0]||""}</td>
                <td>${r[1]||""}</td>
                <td>${r[2]||""}</td>
                <td>${r[3]||""}</td>
                <td>${r[4]||""}</td>
                <td>${r[5]||""}</td>
                <td>${r[6]||""}</td>
                <td>${venc||""}</td>
                <td>${r[8]||0}</td>
                <td><button class="btn-danger" onclick="excluirProdutoDireto('${r[0]}','${r[2]}','${r[6]}')">Excluir</button></td>
            `;
            tbody.appendChild(tr);
        });
    })
    .catch(()=> alert('Erro na consulta'));
}

function excluirProdutoDireto(end,ean,lote){
    const usuario = (qs("#user")?qs("#user").value.trim():"");
    if(!confirm("Excluir item?")) return;

    fetch(`${SCRIPT_URL}?acao=excluir_produto_endereco&endereco=${encodeURIComponent(end)}&ean=${encodeURIComponent(ean)}&lote=${encodeURIComponent(lote)}&usuario=${encodeURIComponent(usuario)}`)
    .then(safeJson)
    .then(r=>{
        if(r.ok){ alert("Excluído"); filtrarEstoque(); }
        else alert(r.erro||"Erro ao excluir");
    })
    .catch(()=> alert('Erro na requisição'));
}

// ================================================================
// ABASTECER
// ================================================================
let abDadosProduto=null;

function abBuscar(){
    const ean = (qs("#ab_ean")?qs("#ab_ean").value.trim():"");
    const end = (qs("#ab_endereco")?qs("#ab_endereco").value.trim():"");
    const prodSel = qs("#ab_produtos");
    const loteSel = qs("#ab_lotes");

    if(prodSel) prodSel.innerHTML="";
    if(loteSel) loteSel.innerHTML="";
    if(qs("#ab_validade")) qs("#ab_validade").value="";
    abDadosProduto=null;

    if(ean){
        fetch(`${SCRIPT_URL}?acao=buscar_produto&chave=${encodeURIComponent(ean)}`)
        .then(safeJson)
        .then(r=>{
            if(r.erro){ alert(r.erro); return; }
            abDadosProduto=r;
            if(prodSel){
                const opt=document.createElement("option");
                opt.value=r.ean||"";
                opt.textContent=`${r.nome_produto||""} | ${r.ean||""}`;
                prodSel.appendChild(opt);
            }
            (r.lotes||[]).forEach(l=>{
                if(loteSel){
                    const o=document.createElement("option");
                    o.value = l.lote || "";
                    o.textContent = l.lote || "";
                    o.dataset.venc = forceISO(l.venc || "");
                    loteSel.appendChild(o);
                }
            });
            if(loteSel && loteSel.options.length>0) loteSel.selectedIndex=0;
            atualizarValidadeAb();
        });
        return;
    }

    if(end){
        fetch(`${SCRIPT_URL}?acao=listar_endereco&endereco=${encodeURIComponent(end)}`)
        .then(safeJson)
        .then(list=>{
            if(!list||list.length===0){ alert("Nenhum produto neste endereço"); return; }
            list.forEach(p=>{
                if(prodSel){
                    const opt=document.createElement("option");
                    opt.value=`${p[2]}|${p[6]}`;
                    opt.textContent=`${p[5] || ''} | L:${p[6] || ''} | Q:${p[8] || 0}`;
                    prodSel.appendChild(opt);
                }
            });
        });
        return;
    }

    alert("Informe EAN ou Endereço");
}

function atualizarValidadeAb(){
    const loteSel=qs("#ab_lotes");
    const inp=qs("#ab_validade");
    if(!loteSel||!inp) return;
    const opt=loteSel.options[loteSel.selectedIndex];
    if(!opt){ inp.value=""; return; }
    inp.value = formatDDMMYYYY(opt.dataset.venc);
}

function parseSelectedProductForAb(){
    const v = (qs("#ab_produtos")?qs("#ab_produtos").value:"");
    if(!v) return {ean:"", lote:""};
    if(v.includes("|")){
        const [ean,lote] = v.split("|");
        return {ean:ean||"", lote:lote||""};
    }
    return {ean:v, lote:(qs("#ab_lotes")?qs("#ab_lotes").value:"")};
}

function montarExtrasAb(ean,lote){
    if(!abDadosProduto) return null;
    const l = (abDadosProduto.lotes||[]).find(x=>x.lote===lote);
    return {
        cod_int:abDadosProduto.cod_int||"",
        cod_ind:abDadosProduto.cod_ind||"",
        nome_produto:abDadosProduto.nome_produto||"",
        endereco_prat:abDadosProduto.endereco_prat||"",
        venc:(l?l.venc:"")
    };
}

function abAdicionar(){
    const usuario = (qs("#user")?qs("#user").value.trim():"");
    const end = (qs("#ab_endereco")?qs("#ab_endereco").value.trim():"");
    const caixas = (qs("#ab_caixas")?qs("#ab_caixas").value.trim():"0");

    const sel = parseSelectedProductForAb();
    const extras = montarExtrasAb(sel.ean, sel.lote);
    if(!extras){ alert("Busque o produto antes."); return; }

    const venc = formatDDMMYYYY(extras.venc);

    const params = {
        acao:"entrar_caixas",
        endereco:end,
        ean:sel.ean,
        lote:sel.lote,
        caixas,
        usuario,
        cod_int:extras.cod_int,
        cod_ind:extras.cod_ind,
        nome_produto:extras.nome_produto,
        endereco_prat:extras.endereco_prat,
        vencimento:venc
    };

    const q = Object.entries(params).map(([k,v])=>`${k}=${encodeURIComponent(v)}`).join("&");

    fetch(`${SCRIPT_URL}?${q}`)
    .then(safeJson)
    .then(r=>{
        if(r.ok){ alert("Adicionado"); abBuscar(); }
        else alert(r.erro||"Erro");
    })
    .catch(()=> alert("Erro na requisição"));
}

function abRetirar(){
    const usuario = (qs("#user")?qs("#user").value.trim():"");
    const end = (qs("#ab_endereco")?qs("#ab_endereco").value.trim():"");
    const caixas = (qs("#ab_caixas")?qs("#ab_caixas").value.trim():"0");

    const sel = parseSelectedProductForAb();
    const extras = montarExtrasAb(sel.ean, sel.lote);
    if(!extras){ alert("Busque o produto antes."); return; }

    const venc = formatDDMMYYYY(extras.venc);

    const params = {
        acao:"sair_caixas",
        endereco:end,
        ean:sel.ean,
        lote:sel.lote,
        caixas,
        usuario,
        cod_int:extras.cod_int,
        cod_ind:extras.cod_ind,
        nome_produto:extras.nome_produto,
        endereco_prat:extras.endereco_prat,
        vencimento:venc
    };

    const q = Object.entries(params).map(([k,v])=>`${k}=${encodeURIComponent(v)}`).join("&");

    fetch(`${SCRIPT_URL}?${q}`)
    .then(safeJson)
    .then(r=>{
        if(r.ok){ alert("Retirado"); abBuscar(); }
        else alert(r.erro||"Erro");
    })
    .catch(()=> alert('Erro na requisição'));
}

// ================================================================
// HISTÓRICO
// ================================================================
function filtrarHistorico(){
    const q = (qs("#h_search")?qs("#h_search").value.trim():"");
    fetch(`${SCRIPT_URL}?acao=filtrar_historico&query=${encodeURIComponent(q)}`)
    .then(safeJson)
    .then(list=>{
        const tbody = qs("#historico-tabela tbody");
        if(!tbody) return;
        tbody.innerHTML="";
        if(!list || list.length===0){
            tbody.innerHTML="<tr><td colspan=7>Nenhum</td></tr>";
            return;
        }
        list.forEach(r=>{
            const d = new Date(r[0]);
            const data = isNaN(d.getTime()) ? r[0] :
                `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()} ${d.toLocaleTimeString()}`;
            const tr=document.createElement("tr");
            tr.innerHTML=`
                <td>${data}</td>
                <td>${r[1]||""}</td>
                <td>${r[2]||""}</td>
                <td>${r[3]||""}</td>
                <td>${r[4]||""}</td>
                <td>${r[5]||""}</td>
                <td>${r[6]||""}</td>
            `;
            tbody.appendChild(tr);
        });
    })
    .catch(()=>{/* ignore */});
}

// ================================================================
// CONFERÊNCIA — ajuste completo
//  - busca conferencia (ERP x APP) no servidor
//  - depois busca ESTOQUE e corrige o valor APP localmente
// ================================================================
function buscarConferencia(){
    const chave = (qs("#conf-chave")?qs("#conf-chave").value.trim():"");

    // 1) Pega resultados do servidor (SIS)
    fetch(`${SCRIPT_URL}?acao=conferencia&filtro=${encodeURIComponent(chave)}`)
    .then(safeJson)
    .then(list=>{
        if(!list || list.erro){
            renderConferencia([]);
            return;
        }
        // 2) Pega ESTOQUE para consolidar APP
        fetch(`${SCRIPT_URL}?acao=filtrar_estoque&query=`)
        .then(safeJson)
        .then(estoqueList=>{
            // build map ean||lote => qtd sum
            const map = {};
            if(Array.isArray(estoqueList)){
                estoqueList.forEach(r=>{
                    // r: row from ESTOQUE (col mapping expected)
                    const ean = String(r[2]||"").trim();
                    const lote = String(r[6]||"").trim();
                    const qtd = Number(r[8]||0);
                    const key = ean + "||" + lote;
                    if(!map[key]) map[key] = 0;
                    map[key] += qtd;
                });
            }
            // attach map to each item
            const merged = (list||[]).map(it=>{
                const key = (it.ean||"") + "||" + (it.lote||"");
                const appQtd = map[key] || 0;
                // Ensure numeric values exist
                return Object.assign({}, it, { saldo_estoque: Number(appQtd) });
            });
            renderConferencia(merged);
        })
        .catch(()=>{
            // if falha ao buscar estoque, rendera o que veio do servidor
            renderConferencia(list);
        });
    })
    .catch(()=> renderConferencia([]));
}

function renderConferencia(list){
    const div = qs("#conf-result");
    if(!div) return;
    div.innerHTML="";

    if(!list || list.length===0){
        div.innerHTML="<p>Nenhum resultado</p>";
        return;
    }

    let html=`
        <table class="table">
            <thead>
                <tr>
                    <th>EAN</th>
                    <th>COD_IND</th>
                    <th>COD_INT</th>
                    <th>PRODUTO</th>
                    <th>LOTE</th>
                    <th>SIS</th>
                    <th>APP</th>
                    <th>DIF</th>
                    <th>STATUS</th>
                </tr>
            </thead>
            <tbody>
    `;

    list.forEach(item=>{
        const sis = Number(item.saldo_produtos||0);     // ERP (SIS)
        const app = Number(item.saldo_estoque||0);      // APP (somado do ESTOQUE)
        const diff = sis - app;                         // ERP - APP (positivo -> app está com menos)
        // CORREÇÃO: diff > 0 => FALTANDO (o APP deve ter esse valor), diff < 0 => SOBRANDO
        let status = "OK";
        if(diff > 0) status = "FALTANDO";
        if(diff < 0) status = "SOBRANDO";

        html += `
            <tr>
                <td>${item.ean||""}</td>
                <td>${item.cod_ind||""}</td>
                <td>${item.cod_int||""}</td>
                <td>${item.nome_produto||""}</td>
                <td>${item.lote||""}</td>
                <td>${sis}</td>
                <td>${app}</td>
                <td>${diff}</td>
                <td>${status}</td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    div.innerHTML = html;
}

// ================================================================
// VALIDADE — FEFO
// ================================================================

function renderValidade(list){
    const div = qs("#val-result");
    if(!div) return;
    div.innerHTML="";

    if(!list || list.length===0){
        div.innerHTML="<p>Nenhum resultado</p>";
        return;
    }

    let html=`
        <table class="table">
            <thead>
                <tr>
                    <th>EAN</th>
                    <th>LOTE</th>
                    <th>VENC</th>
                    <th>QTDE</th>
                    <th>DIAS</th>
                </tr>
            </thead><tbody>
    `;

    list.forEach(item=>{
        html+=`
            <tr>
                <td>${item.ean||""}</td>
                <td>${item.lote||""}</td>
                <td>${formatDDMMYYYY(item.vencimento_iso)}</td>
                <td>${item.qtd_estoque||0}</td>
                <td>${item.dias_restantes||0}</td>
            </tr>
        `;
    });

    html+="</tbody></table>";
    div.innerHTML=html;
}

// ================================================================
// ENTER KEYS
// ================================================================
["busca","q_search","h_search","conf-chave","val-chave","validade_dias"]
.forEach(id=>{
    const el = qs("#"+id);
    if(!el) return;
    el.addEventListener("keypress", e=>{
        if(e.key === "Enter"){
            if(id==="busca") buscarProduto();
            if(id==="q_search") filtrarEstoque();
            if(id==="h_search") filtrarHistorico();
            if(id==="conf-chave") buscarConferencia();
            if(id==="val-chave"||id==="validade_dias") buscarValidade(true);
        }
    });
});

// ================================================================
// EXPORTA FUNÇÕES GLOBALMENTE
// ================================================================
window.login = login;
window.logout = logout;
window.buscarProduto = buscarProduto;
window.registrarProduto = registrarProduto;
window.filtrarEstoque = filtrarEstoque;
window.excluirProdutoDireto = excluirProdutoDireto;
window.abBuscar = abBuscar;
window.abAdicionar = abAdicionar;
window.abRetirar = abRetirar;
window.buscarConferencia = buscarConferencia;
window.buscarValidade = buscarValidade;



function renderValidadeFull(list){
    const div = qs("#val-result");
    if(!div) return;
    div.innerHTML = "";

    if(!list || list.length===0){
        div.innerHTML = "<p>Nenhum resultado</p>";
        return;
    }

    // ------------------------------
    // ORDENAR
    // 1º validade (dias)
    // 2º lote menor
    // ------------------------------
    list.sort((a,b)=>{
        const da = Number(a.dias_restantes || 999999);
        const db = Number(b.dias_restantes || 999999);

        if(da !== db) return da - db;

        const la = String(a.lote||"");
        const lb = String(b.lote||"");

        const na = Number(la), nb = Number(lb);

        if(!isNaN(na) && !isNaN(nb)) return na - nb;

        return la.localeCompare(lb);
    });

    // ------------------------------
    // MONTAR TABELA
    // ------------------------------
    let html = `
        <table class="table">
            <thead>
                <tr>
                    <th>EAN</th>
                    <th>COD_IND</th>
                    <th>COD_INT</th>
                    <th>NOME_PRODUTO</th>
                    <th>ENDEREÇO ESTOQ</th>
                    <th>ENDEREÇO PRAT</th>
                    <th>LOTE</th>
                    <th>VENCIMENTO</th>
                    <th>SALDO_SISTEMA</th>
                    <th>DIAS</th>
                </tr>
            </thead>
            <tbody>
    `;

    // ------------------------------
    // LINHAS
    // ------------------------------
    list.forEach(item=>{
        const isCritical = Number(item.dias_restantes) < 60;

        html += `
            <tr ${isCritical ? 'class="color-red"' : ''}>
                <td>${item.ean||""}</td>
                <td>${item.cod_ind||""}</td>
                <td>${item.cod_int||""}</td>
                <td>${item.nome_produto||""}</td>
                <td>${item.endereco_estoq||""}</td>
                <td>${item.endereco_prat||""}</td>
                <td>${item.lote||""}</td>
                <td>${formatDDMMYYYY(item.vencimento_iso)}</td>
                <td>${item.saldo_sistema||0}</td>
                <td>${item.dias_restantes||""}</td>
            </tr>
        `;
    });

    html += "</tbody></table>";
    div.innerHTML = html;
}


function buscarValidade(onlySoon=true){
    const chave = (qs("#val-chave")?qs("#val-chave").value.trim():"");
    fetch(`${SCRIPT_URL}?acao=validade&ean=${encodeURIComponent(chave)}&onlySoon=${onlySoon}`)
    .then(safeJson)
    .then(list=>{
        if(!list || list.erro){ renderValidadeFull([]); return; }
        renderValidadeFull(list);
    })
    .catch(()=> renderValidadeFull([]));
}
