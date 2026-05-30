import React, { useState, useEffect, useCallback, useRef } from 'react'
import { LOGO_BASE64 } from '../data/logo_base64'

// ─── Constants ───────────────────────────────────────────────────────────────
const LS_KEY = 'infraimperio_recibos_v1'
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const FUNCIONARIOS_INICIAIS = [
  {nome:"Wanderson",tipo:"diarista",diaria:77.27},
  {nome:"Rildomar",tipo:"diarista",diaria:63.63},
  {nome:"Alexandre",tipo:"diarista",diaria:50.0},
  {nome:"Mateus",tipo:"diarista",diaria:81.81},
  {nome:"Paulo",tipo:"diarista",diaria:80.0},
  {nome:"Milton",tipo:"diarista",diaria:50.0},
  {nome:"Domingos",tipo:"diarista",diaria:50.0},
  {nome:"Ronei",tipo:"diarista",diaria:70.0},
  {nome:"André",tipo:"diarista",diaria:79.09},
  {nome:"Valdo",tipo:"diarista",diaria:60.0},
  {nome:"Reginaldo",tipo:"diarista",diaria:68.18},
  {nome:"João",tipo:"diarista",diaria:0},
  {nome:"Fábio",tipo:"diarista",diaria:0},
  {nome:"César",tipo:"diarista",diaria:60.0},
  {nome:"Roberto",tipo:"diarista",diaria:80.0},
  {nome:"Manuel",tipo:"mensalista",diaria:0},
  {nome:"Sofia",tipo:"mensalista",diaria:0},
  {nome:"Vanessa",tipo:"mensalista",diaria:0},
  {nome:"Alayane",tipo:"mensalista",diaria:0},
  {nome:"Jaqueline",tipo:"mensalista",diaria:0},
  {nome:"Jardel",tipo:"prestador",diaria:80.0},
  {nome:"Elvis",tipo:"prestador",diaria:80.0},
  {nome:"Rapel Blanqui",tipo:"prestador",diaria:0},
  {nome:"José Eletricista",tipo:"prestador",diaria:0},
]

const EMPRESA_DEFAULT = {
  nome:"INFRAIMPÉRIO - OBRAS REMODELAÇÕES",
  morada:"Rua Miguel Bombarda n78",
  cp:"2830-345 Barreiro",
  pais:"Portugal",
  email:"infraimperio.obras@gmail.com",
  tel:"",
  nipc:"513674233",
  capital:"10.000,00",
  crc:"513674233",
  matricula:"513674233",
}

const CONFIG_DEFAULT = {
  subsidio_almoco_sabado:10,
  forma_pagamento_default:"transferencia",
}

const FUNC_TEMPLATE = {
  nome:'',tipo:'diarista',diaria:0,valor_fixo:0,
  funcao:'',nif:'',niss:'',morada:'',cp:'',
  forma_pagamento:'transferencia',iban:'',ativo:true,
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function parseNum(s){
  if(s===undefined||s===null||s==='') return 0
  return parseFloat(String(s).replace(',','.')) || 0
}
function fmtEur(n){ return n.toFixed(2).replace('.',',') + ' €' }
function fmtNum(n){ return n.toFixed(2).replace('.',',') }
function novoId(){ return 'f_'+Date.now()+'_'+Math.floor(Math.random()*1000) }
function chaveMes(mes,ano){ return ano+'-'+String(mes).padStart(2,'0') }

function converterInt(n){
  if(n===0) return ''
  if(n===100) return 'cem'
  const unidades=['','um','dois','três','quatro','cinco','seis','sete','oito','nove']
  const dez19=['dez','onze','doze','treze','catorze','quinze','dezasseis','dezassete','dezoito','dezanove']
  const dezenas=['','','vinte','trinta','quarenta','cinquenta','sessenta','setenta','oitenta','noventa']
  const centenas=['','cento','duzentos','trezentos','quatrocentos','quinhentos','seiscentos','setecentos','oitocentos','novecentos']
  if(n<10) return unidades[n]
  if(n<20) return dez19[n-10]
  if(n<100){ const d=Math.floor(n/10),u=n%10; return dezenas[d]+(u?' e '+unidades[u]:'') }
  if(n<1000){ const c=Math.floor(n/100),r=n%100; return centenas[c]+(r?' e '+converterInt(r):'') }
  if(n<1000000){
    const milhares=Math.floor(n/1000),r=n%1000
    let txt=(milhares===1?'mil':converterInt(milhares)+' mil')
    if(r) txt+=(r<100||r%100===0)?' e '+converterInt(r):', '+converterInt(r)
    return txt
  }
  const milhoes=Math.floor(n/1000000),r=n%1000000
  let txt=(milhoes===1?'um milhão':converterInt(milhoes)+' milhões')
  if(r) txt+=' e '+converterInt(r)
  return txt
}
function numeroPorExtenso(n){
  if(n===0) return 'zero euros'
  const negativo=n<0
  n=Math.abs(n)
  const inteiro=Math.floor(n)
  const cents=Math.round((n-inteiro)*100)
  let r=''
  if(inteiro>0) r=converterInt(inteiro)+(inteiro===1?' euro':' euros')
  if(cents>0){ if(r) r+=' e '; r+=converterInt(cents)+(cents===1?' cêntimo':' cêntimos') }
  return (negativo?'menos ':'')+r
}

function calcularLinha(reg, func){
  const faltas=parseNum(reg.faltas)
  const diasQ=parseNum(reg.dias_q1)+parseNum(reg.dias_q2)
  const dias=Math.max(0,diasQ-faltas)
  const sabados=parseNum(reg.sabados)
  const diaria=parseNum(func.diaria)
  const subAlmocoSab=10
  const semSabManual=reg.valor_sem_sab_manual
  const sabadosManual=reg.valor_sabados_manual
  const editouSemSab=(semSabManual!==undefined&&semSabManual!==null&&semSabManual!=='')
  const editouSabados=(sabadosManual!==undefined&&sabadosManual!==null&&sabadosManual!=='')
  let valorSemSab, valorSabadosAlmoco
  if(editouSemSab) valorSemSab=parseNum(semSabManual)
  else if(func.tipo==='mensalista'||func.tipo==='prestador') valorSemSab=parseNum(reg.valor_fixo)
  else valorSemSab=dias*diaria
  if(editouSabados) valorSabadosAlmoco=parseNum(sabadosManual)
  else if(func.tipo==='mensalista'||func.tipo==='prestador') valorSabadosAlmoco=0
  else valorSabadosAlmoco=sabados>0?(sabados*diaria)+(sabados*subAlmocoSab):0
  const bruto=valorSemSab+valorSabadosAlmoco
  const vales=parseNum(reg.vales)
  const seguro=parseNum(reg.seguro)
  const outros=parseNum(reg.descontos_outros)
  const subsidio=parseNum(reg.subsidio)
  const liquido=valorSemSab+subsidio-vales-seguro-outros
  return {dias,faltas,sabados,diaria,valorSemSab,valorSabadosAlmoco,bruto,vales,seguro,outros,subsidio,liquido,editouSemSab,editouSabados}
}

// ─── Local Storage helpers ────────────────────────────────────────────────────
function carregarEstado(){
  try{
    const raw=localStorage.getItem(LS_KEY)
    if(raw) return JSON.parse(raw)
  } catch(e){}
  return null
}
function salvarEstado(estado){
  try{ localStorage.setItem(LS_KEY,JSON.stringify(estado)) } catch(e){}
}
function estadoInicial(){
  const saved=carregarEstado()
  if(saved) return saved
  const funcionarios=FUNCIONARIOS_INICIAIS.map(f=>({...FUNC_TEMPLATE,...f,id:novoId()}))
  return { funcionarios, empresa:{...EMPRESA_DEFAULT}, config:{...CONFIG_DEFAULT}, folhas:{} }
}

// ─── Receipt Modal ────────────────────────────────────────────────────────────
function ReciboModal({ func, reg, mes, ano, empresa, onClose }){
  const calc=calcularLinha(reg,func)
  const hoje=new Date()
  const dataFmt=hoje.toLocaleDateString('pt-PT',{day:'2-digit',month:'long',year:'numeric'})
  const mesNome=MESES[mes-1]
  const fp=reg.forma_pagamento||func.forma_pagamento||'transferencia'
  const fpLabel=fp==='transferencia'?'Transferência Bancária':fp==='numerario'?'Numerário':'Misto'

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .recibo-print, .recibo-print * { visibility: visible !important; }
          .recibo-print { position: fixed !important; top: 0 !important; left: 0 !important; width: 100% !important; }
          .no-print { display: none !important; }
        }
      `}</style>
      <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 overflow-y-auto py-6 no-print-overlay">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4">
          {/* Modal header buttons */}
          <div className="no-print flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-800">Recibo de Pagamento</h2>
            <div className="flex gap-3">
              <button onClick={()=>window.print()} className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm font-medium">
                🖨️ Imprimir / Guardar PDF
              </button>
              <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
                Fechar
              </button>
            </div>
          </div>

          {/* Receipt content */}
          <div className="recibo-print p-8" style={{fontFamily:'Arial, sans-serif',fontSize:'13px',color:'#1a1a1a',lineHeight:'1.5'}}>
            {/* Header */}
            <table style={{width:'100%',borderCollapse:'collapse',marginBottom:'20px'}}>
              <tbody>
                <tr>
                  <td style={{width:'120px',verticalAlign:'middle'}}>
                    <img src={`data:image/jpeg;base64,${LOGO_BASE64}`} alt="Logo" style={{width:'100px',height:'auto'}} />
                  </td>
                  <td style={{verticalAlign:'middle',paddingLeft:'20px'}}>
                    <div style={{fontSize:'16px',fontWeight:'bold',color:'#1e3a5f'}}>{empresa.nome}</div>
                    <div>{empresa.morada}</div>
                    <div>{empresa.cp} — {empresa.pais}</div>
                    <div>Email: {empresa.email}{empresa.tel ? ` | Tel: ${empresa.tel}` : ''}</div>
                    <div>NIPC: {empresa.nipc}</div>
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{borderTop:'2px solid #1e3a5f',borderBottom:'2px solid #1e3a5f',padding:'8px 0',textAlign:'center',marginBottom:'20px'}}>
              <div style={{fontSize:'17px',fontWeight:'bold',letterSpacing:'2px',color:'#1e3a5f'}}>RECIBO DE PAGAMENTO</div>
              <div style={{fontSize:'13px',color:'#555',marginTop:'4px'}}>Referente a {mesNome} {ano}</div>
            </div>

            {/* Employee info */}
            <table style={{width:'100%',borderCollapse:'collapse',marginBottom:'20px',border:'1px solid #ddd'}}>
              <tbody>
                <tr style={{backgroundColor:'#f0f4fa'}}>
                  <td style={{padding:'6px 10px',fontWeight:'bold',width:'30%',border:'1px solid #ddd'}}>Nome</td>
                  <td style={{padding:'6px 10px',border:'1px solid #ddd'}}>{func.nome}</td>
                  <td style={{padding:'6px 10px',fontWeight:'bold',width:'20%',border:'1px solid #ddd'}}>Função</td>
                  <td style={{padding:'6px 10px',border:'1px solid #ddd'}}>{func.funcao||func.tipo}</td>
                </tr>
                <tr>
                  <td style={{padding:'6px 10px',fontWeight:'bold',border:'1px solid #ddd'}}>NIF</td>
                  <td style={{padding:'6px 10px',border:'1px solid #ddd'}}>{func.nif||'—'}</td>
                  <td style={{padding:'6px 10px',fontWeight:'bold',border:'1px solid #ddd'}}>NISS</td>
                  <td style={{padding:'6px 10px',border:'1px solid #ddd'}}>{func.niss||'—'}</td>
                </tr>
                <tr style={{backgroundColor:'#f0f4fa'}}>
                  <td style={{padding:'6px 10px',fontWeight:'bold',border:'1px solid #ddd'}}>Morada</td>
                  <td colSpan={3} style={{padding:'6px 10px',border:'1px solid #ddd'}}>{func.morada?(func.morada+(func.cp?' — '+func.cp:'')):'—'}</td>
                </tr>
              </tbody>
            </table>

            {/* Itemized table */}
            <table style={{width:'100%',borderCollapse:'collapse',marginBottom:'16px'}}>
              <thead>
                <tr style={{backgroundColor:'#1e3a5f',color:'white'}}>
                  <th style={{padding:'7px 10px',textAlign:'left',border:'1px solid #1e3a5f'}}>Descrição</th>
                  <th style={{padding:'7px 10px',textAlign:'center',border:'1px solid #1e3a5f',width:'70px'}}>Qtd</th>
                  <th style={{padding:'7px 10px',textAlign:'right',border:'1px solid #1e3a5f',width:'90px'}}>Unit.</th>
                  <th style={{padding:'7px 10px',textAlign:'right',border:'1px solid #1e3a5f',width:'100px'}}>Total</th>
                </tr>
              </thead>
              <tbody>
                {func.tipo==='diarista'&&(
                  <tr>
                    <td style={{padding:'6px 10px',border:'1px solid #ddd'}}>Dias trabalhados</td>
                    <td style={{padding:'6px 10px',textAlign:'center',border:'1px solid #ddd'}}>{calc.dias}</td>
                    <td style={{padding:'6px 10px',textAlign:'right',border:'1px solid #ddd'}}>{fmtEur(calc.diaria)}</td>
                    <td style={{padding:'6px 10px',textAlign:'right',border:'1px solid #ddd'}}>{fmtEur(calc.valorSemSab)}</td>
                  </tr>
                )}
                {func.tipo==='mensalista'&&(
                  <tr>
                    <td style={{padding:'6px 10px',border:'1px solid #ddd'}}>Vencimento mensal</td>
                    <td style={{padding:'6px 10px',textAlign:'center',border:'1px solid #ddd'}}>—</td>
                    <td style={{padding:'6px 10px',textAlign:'right',border:'1px solid #ddd'}}>—</td>
                    <td style={{padding:'6px 10px',textAlign:'right',border:'1px solid #ddd'}}>{fmtEur(calc.valorSemSab)}</td>
                  </tr>
                )}
                {func.tipo==='prestador'&&(
                  <tr>
                    <td style={{padding:'6px 10px',border:'1px solid #ddd'}}>Prestação de serviço</td>
                    <td style={{padding:'6px 10px',textAlign:'center',border:'1px solid #ddd'}}>—</td>
                    <td style={{padding:'6px 10px',textAlign:'right',border:'1px solid #ddd'}}>—</td>
                    <td style={{padding:'6px 10px',textAlign:'right',border:'1px solid #ddd'}}>{fmtEur(calc.valorSemSab)}</td>
                  </tr>
                )}
                <tr style={{backgroundColor:'#f8f8f8'}}>
                  <td colSpan={3} style={{padding:'6px 10px',fontWeight:'bold',border:'1px solid #ddd'}}>VALOR SEM DESCONTOS</td>
                  <td style={{padding:'6px 10px',textAlign:'right',fontWeight:'bold',border:'1px solid #ddd'}}>{fmtEur(calc.valorSemSab)}</td>
                </tr>
                {calc.subsidio>0&&(
                  <tr style={{color:'#1e7a1e'}}>
                    <td colSpan={3} style={{padding:'6px 10px',border:'1px solid #ddd'}}>+ Subsídio / Outros</td>
                    <td style={{padding:'6px 10px',textAlign:'right',border:'1px solid #ddd'}}>+{fmtEur(calc.subsidio)}</td>
                  </tr>
                )}
                {calc.vales>0&&(
                  <tr style={{color:'#c0392b'}}>
                    <td colSpan={3} style={{padding:'6px 10px',border:'1px solid #ddd'}}>− Vales / Adiantamentos</td>
                    <td style={{padding:'6px 10px',textAlign:'right',border:'1px solid #ddd'}}>−{fmtEur(calc.vales)}</td>
                  </tr>
                )}
                {calc.seguro>0&&(
                  <tr style={{color:'#c0392b'}}>
                    <td colSpan={3} style={{padding:'6px 10px',border:'1px solid #ddd'}}>− Seguro</td>
                    <td style={{padding:'6px 10px',textAlign:'right',border:'1px solid #ddd'}}>−{fmtEur(calc.seguro)}</td>
                  </tr>
                )}
                {calc.outros>0&&(
                  <tr style={{color:'#c0392b'}}>
                    <td colSpan={3} style={{padding:'6px 10px',border:'1px solid #ddd'}}>− Outros descontos</td>
                    <td style={{padding:'6px 10px',textAlign:'right',border:'1px solid #ddd'}}>−{fmtEur(calc.outros)}</td>
                  </tr>
                )}
                <tr style={{backgroundColor:'#1e3a5f',color:'white'}}>
                  <td colSpan={3} style={{padding:'8px 10px',fontWeight:'bold',border:'1px solid #1e3a5f',fontSize:'14px'}}>VALOR LÍQUIDO A RECEBER</td>
                  <td style={{padding:'8px 10px',textAlign:'right',fontWeight:'bold',border:'1px solid #1e3a5f',fontSize:'14px'}}>{fmtEur(calc.liquido)}</td>
                </tr>
              </tbody>
            </table>

            {/* Sabados note */}
            {calc.sabados>0&&(
              <p style={{fontSize:'12px',color:'#555',fontStyle:'italic',marginBottom:'12px'}}>
                * Valor referente a sábados ({calc.sabados} dia(s), {fmtEur(calc.valorSabadosAlmoco)} incluindo subsídio de almoço) pago em separado.
              </p>
            )}

            {/* Por extenso */}
            <div style={{backgroundColor:'#f0f4fa',border:'1px solid #c8d8f0',borderRadius:'6px',padding:'10px 14px',marginBottom:'16px'}}>
              <span style={{fontWeight:'bold'}}>Valor por extenso: </span>
              <span style={{textTransform:'capitalize'}}>{numeroPorExtenso(calc.liquido)}</span>
            </div>

            {/* Payment */}
            <div style={{marginBottom:'16px'}}>
              {fp==='misto'?(
                <table style={{width:'100%',borderCollapse:'collapse',border:'1px solid #ddd'}}>
                  <thead>
                    <tr style={{backgroundColor:'#f0f4fa'}}>
                      <th style={{padding:'6px 10px',textAlign:'left',border:'1px solid #ddd'}}>Forma de Pagamento</th>
                      <th style={{padding:'6px 10px',textAlign:'right',border:'1px solid #ddd'}}>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{padding:'6px 10px',border:'1px solid #ddd'}}>Transferência Bancária {func.iban?'('+func.iban+')':''}</td>
                      <td style={{padding:'6px 10px',textAlign:'right',border:'1px solid #ddd'}}>{fmtEur(parseNum(reg.valor_transferencia))}</td>
                    </tr>
                    <tr>
                      <td style={{padding:'6px 10px',border:'1px solid #ddd'}}>Numerário</td>
                      <td style={{padding:'6px 10px',textAlign:'right',border:'1px solid #ddd'}}>{fmtEur(parseNum(reg.valor_numerario))}</td>
                    </tr>
                  </tbody>
                </table>
              ):(
                <div style={{padding:'8px 12px',border:'1px solid #ddd',borderRadius:'4px'}}>
                  <span style={{fontWeight:'bold'}}>Forma de pagamento: </span>{fpLabel}
                  {fp==='transferencia'&&func.iban&&<span> — <span style={{fontWeight:'bold'}}>IBAN: </span>{func.iban}</span>}
                </div>
              )}
            </div>

            {/* Legal */}
            <div style={{fontSize:'11px',color:'#666',marginBottom:'20px',padding:'8px',border:'1px solid #eee',borderRadius:'4px'}}>
              O presente recibo serve de quitação plena e total da quantia acima indicada, referente à prestação de trabalho/serviço no período indicado, declarando o trabalhador/prestador nada mais ter a receber pela referida prestação.
            </div>

            {/* Date + signatures */}
            <div style={{marginBottom:'24px'}}>
              <p>Barreiro, {dataFmt}</p>
            </div>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <tbody>
                <tr>
                  <td style={{width:'45%',textAlign:'center',paddingTop:'40px',borderTop:'1px solid #555'}}>
                    <div style={{fontSize:'12px',color:'#555'}}>Assinatura do Trabalhador/Prestador</div>
                    <div style={{fontWeight:'bold'}}>{func.nome}</div>
                  </td>
                  <td style={{width:'10%'}}></td>
                  <td style={{width:'45%',textAlign:'center',paddingTop:'40px',borderTop:'1px solid #555'}}>
                    <div style={{fontSize:'12px',color:'#555'}}>Pela Empresa</div>
                    <div style={{fontWeight:'bold'}}>{empresa.nome}</div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Footer */}
            <div style={{marginTop:'30px',borderTop:'1px solid #ccc',paddingTop:'8px',fontSize:'10px',color:'#888',textAlign:'center'}}>
              {empresa.nome} | NIPC: {empresa.nipc} | {empresa.morada}, {empresa.cp} | Capital Social: {empresa.capital}€ | Matrícula CRC: {empresa.crc}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Employee Modal ───────────────────────────────────────────────────────────
function FuncionarioModal({ func, onSave, onClose }){
  const [form, setForm]=useState(func||{...FUNC_TEMPLATE})
  const set=(k,v)=>setForm(p=>({...p,[k]:v}))
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 overflow-y-auto py-6">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">{func?.id?'Editar Colaborador':'Novo Colaborador'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Nome *</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={form.nome} onChange={e=>set('nome',e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tipo *</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={form.tipo} onChange={e=>set('tipo',e.target.value)}>
              <option value="diarista">Diarista</option>
              <option value="mensalista">Mensalista</option>
              <option value="prestador">Prestador</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Diária (€)</label>
            <input type="number" step="0.01" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={form.diaria} onChange={e=>set('diaria',e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Valor Fixo (€)</label>
            <input type="number" step="0.01" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={form.valor_fixo} onChange={e=>set('valor_fixo',e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Função</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={form.funcao} onChange={e=>set('funcao',e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">NIF</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={form.nif} onChange={e=>set('nif',e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">NISS</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={form.niss} onChange={e=>set('niss',e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Morada</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={form.morada} onChange={e=>set('morada',e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Código Postal</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={form.cp} onChange={e=>set('cp',e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Forma de Pagamento</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={form.forma_pagamento} onChange={e=>set('forma_pagamento',e.target.value)}>
              <option value="transferencia">Transferência</option>
              <option value="numerario">Numerário</option>
              <option value="misto">Misto</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">IBAN</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={form.iban} onChange={e=>set('iban',e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 text-sm font-medium">Cancelar</button>
          <button onClick={()=>onSave(form)} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm font-medium">Guardar</button>
        </div>
      </div>
    </div>
  )
}

// ─── Import CSV Modal ─────────────────────────────────────────────────────────
function ImportCSVModal({ onImport, onClose }){
  const [texto, setTexto]=useState('')
  const [erro, setErro]=useState('')

  function parsear(){
    const linhas=texto.trim().split('\n')
    if(linhas.length<2){ setErro('Ficheiro inválido: precisa de cabeçalho e pelo menos uma linha.'); return }
    // detect separator
    const cab=linhas[0]
    let sep=';'
    if(cab.includes('\t')) sep='\t'
    else if(cab.split(';').length>cab.split(',').length) sep=';'
    else sep=','
    const cols=cab.split(sep).map(c=>c.trim().toLowerCase().replace(/"/g,''))
    const funcs=[]
    for(let i=1;i<linhas.length;i++){
      const parts=linhas[i].split(sep).map(c=>c.trim().replace(/"/g,''))
      const obj={}
      cols.forEach((c,j)=>{ obj[c]=parts[j]||'' })
      if(!obj.nome) continue
      funcs.push({
        id:novoId(),
        nome:obj.nome||'',
        tipo:obj.tipo||'diarista',
        diaria:parseNum(obj.diaria),
        valor_fixo:parseNum(obj.valor_fixo),
        funcao:obj.funcao||'',
        nif:obj.nif||'',
        niss:obj.niss||'',
        morada:obj.morada||'',
        cp:obj.cp||'',
        forma_pagamento:obj.forma_pagamento||'transferencia',
        iban:obj.iban||'',
        ativo:obj.ativo==='false'?false:true,
      })
    }
    if(!funcs.length){ setErro('Nenhuma linha válida encontrada.'); return }
    onImport(funcs)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Importar CSV</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-3">Cole o conteúdo CSV abaixo. Separadores aceites: <code>;</code>, <code>,</code>, TAB. Colunas: nome, tipo, diaria, valor_fixo, funcao, nif, niss, morada, cp, forma_pagamento, iban, ativo</p>
          <textarea className="w-full h-48 border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500" value={texto} onChange={e=>setTexto(e.target.value)} placeholder="nome;tipo;diaria;..." />
          {erro&&<p className="text-red-600 text-sm mt-2">{erro}</p>}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 text-sm font-medium">Cancelar</button>
          <button onClick={parsear} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm font-medium">Importar</button>
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Folha de Ponto ──────────────────────────────────────────────────────
function TabFolhaPonto({ estado, setEstado, setTab, initialMesAno }){
  const hoje=new Date()
  const [mes, setMes]=useState(initialMesAno?initialMesAno.mes:hoje.getMonth()+1)
  const [ano, setAno]=useState(initialMesAno?initialMesAno.ano:hoje.getFullYear())
  const [reciboAberto, setReciboAberto]=useState(null) // {func, reg}

  // Get or create sheet for current month
  function getFolha(est, m, a){
    const chave=chaveMes(m,a)
    let folha=est.folhas[chave]
    if(!folha){
      const registos=est.funcionarios.filter(f=>f.ativo!==false).map(f=>({
        funcionario_id:f.id,
        faltas:'',dias_q1:'',dias_q2:'',sabados:'',
        valor_fixo:f.valor_fixo||0,
        vales:'',seguro:'',descontos_outros:'',subsidio:'',
        observacoes:'',
        forma_pagamento:f.forma_pagamento||'transferencia',
        valor_transferencia:'',valor_numerario:'',
        valor_sem_sab_manual:'',valor_sabados_manual:'',
      }))
      folha={registos, data_guardado:null}
    } else {
      // add any new active employees not in the sheet
      const idsExistentes=new Set(folha.registos.map(r=>r.funcionario_id))
      const novos=est.funcionarios.filter(f=>f.ativo!==false&&!idsExistentes.has(f.id))
      if(novos.length){
        folha={...folha, registos:[...folha.registos, ...novos.map(f=>({
          funcionario_id:f.id,faltas:'',dias_q1:'',dias_q2:'',sabados:'',
          valor_fixo:f.valor_fixo||0,vales:'',seguro:'',descontos_outros:'',subsidio:'',
          observacoes:'',forma_pagamento:f.forma_pagamento||'transferencia',
          valor_transferencia:'',valor_numerario:'',valor_sem_sab_manual:'',valor_sabados_manual:'',
        }))]}
      }
    }
    return folha
  }

  const folha=getFolha(estado, mes, ano)
  const chave=chaveMes(mes,ano)

  function updateReg(funcId, field, value){
    setEstado(prev=>{
      const f=getFolha(prev,mes,ano)
      const registos=f.registos.map(r=>r.funcionario_id===funcId?{...r,[field]:value}:r)
      const novaFolha={...f,registos}
      return {...prev, folhas:{...prev.folhas,[chave]:novaFolha}}
    })
  }

  function guardarMes(){
    setEstado(prev=>{
      const f=getFolha(prev,mes,ano)
      const novaFolha={...f, data_guardado:new Date().toISOString()}
      return {...prev, folhas:{...prev.folhas,[chave]:novaFolha}}
    })
  }

  function copiarMesAnterior(){
    const prevMes=mes===1?12:mes-1
    const prevAno=mes===1?ano-1:ano
    const prevChave=chaveMes(prevMes,prevAno)
    const prevFolha=estado.folhas[prevChave]
    if(!prevFolha){ alert('Não existe folha para o mês anterior.'); return }
    setEstado(prev=>{
      const f=getFolha(prev,mes,ano)
      const registos=f.registos.map(r=>{
        const prevReg=prevFolha.registos.find(pr=>pr.funcionario_id===r.funcionario_id)
        if(!prevReg) return r
        return {
          ...r,
          dias_q1:prevReg.dias_q1,dias_q2:prevReg.dias_q2,sabados:prevReg.sabados,
          faltas:'',vales:'',seguro:'',descontos_outros:'',subsidio:'',
          forma_pagamento:prevReg.forma_pagamento,
          valor_sem_sab_manual:'',valor_sabados_manual:'',
          valor_transferencia:'',valor_numerario:'',
        }
      })
      const novaFolha={...f,registos, data_guardado:null}
      return {...prev, folhas:{...prev.folhas,[chave]:novaFolha}}
    })
  }

  function exportarCSV(){
    const cabecalho=['Colaborador','Tipo','Faltas','1ª Q','2ª Q','Sáb','Dias','Diária','S/Sáb','Sáb+Alm','Vales','Seguro','Outros','Subsídio','Líquido','Pagamento']
    const rows=folha.registos.map(r=>{
      const func=estado.funcionarios.find(f=>f.id===r.funcionario_id)
      if(!func) return null
      const c=calcularLinha(r,func)
      return [func.nome,func.tipo,c.faltas,parseNum(r.dias_q1),parseNum(r.dias_q2),c.sabados,c.dias,fmtNum(c.diaria),fmtNum(c.valorSemSab),fmtNum(c.valorSabadosAlmoco),fmtNum(c.vales),fmtNum(c.seguro),fmtNum(c.outros),fmtNum(c.subsidio),fmtNum(c.liquido),r.forma_pagamento]
    }).filter(Boolean)
    const csv=[cabecalho,...rows].map(r=>r.join(';')).join('\n')
    const blob=new Blob(['﻿'+csv],{type:'text/csv;charset=utf-8'})
    const url=URL.createObjectURL(blob)
    const a=document.createElement('a'); a.href=url; a.download=`folha_${chave}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  // Totals
  let totSemSab=0, totSabAlm=0, totDescontos=0, totLiquido=0, totTransferencia=0, totNumerario=0
  folha.registos.forEach(r=>{
    const func=estado.funcionarios.find(f=>f.id===r.funcionario_id)
    if(!func) return
    const c=calcularLinha(r,func)
    totSemSab+=c.valorSemSab
    totSabAlm+=c.valorSabadosAlmoco
    totDescontos+=c.vales+c.seguro+c.outros
    totLiquido+=c.liquido
    const fp=r.forma_pagamento||func.forma_pagamento||'transferencia'
    if(fp==='transferencia') totTransferencia+=c.liquido
    else if(fp==='numerario') totNumerario+=c.liquido
    else { totTransferencia+=parseNum(r.valor_transferencia); totNumerario+=parseNum(r.valor_numerario) }
  })

  const anos=Array.from({length:11},(_,i)=>2020+i)

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <select className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={mes} onChange={e=>setMes(Number(e.target.value))}>
          {MESES.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
        </select>
        <select className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={ano} onChange={e=>setAno(Number(e.target.value))}>
          {anos.map(a=><option key={a} value={a}>{a}</option>)}
        </select>
        {folha.data_guardado&&<span className="text-xs text-green-600 bg-green-50 border border-green-200 px-2 py-1 rounded-full">✓ Guardado {new Date(folha.data_guardado).toLocaleDateString('pt-PT')}</span>}
        <div className="flex-1"/>
        <button onClick={copiarMesAnterior} className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">📋 Copiar mês anterior</button>
        <button onClick={exportarCSV} className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">⬇️ Exportar CSV</button>
        <button onClick={guardarMes} className="px-3 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700">💾 Guardar mês</button>
      </div>

      {/* Summary boxes */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {label:'Total s/Sáb',value:totSemSab,color:'text-brand-700'},
          {label:'Sáb+Almoço',value:totSabAlm,color:'text-orange-600'},
          {label:'Total Descontos',value:totDescontos,color:'text-red-600'},
          {label:'Total a Pagar',value:totLiquido,color:'text-green-700',bold:true},
          {label:'Por Transferência',value:totTransferencia,color:'text-blue-600'},
          {label:'Em Numerário',value:totNumerario,color:'text-purple-600'},
        ].map((b,i)=>(
          <div key={i} className="bg-white border rounded-xl p-3 shadow-sm text-center">
            <div className="text-xs text-gray-500 mb-1">{b.label}</div>
            <div className={`text-sm font-bold ${b.color} ${b.bold?'text-base':''}`}>{fmtEur(b.value)}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-brand-800 text-white sticky top-0 z-10">
            <tr>
              <th className="px-2 py-2 text-left whitespace-nowrap sticky left-0 bg-brand-800">Colaborador</th>
              <th className="px-2 py-2 text-center">Faltas</th>
              <th className="px-2 py-2 text-center">1ª Q</th>
              <th className="px-2 py-2 text-center">2ª Q</th>
              <th className="px-2 py-2 text-center">Sáb</th>
              <th className="px-2 py-2 text-center">Dias</th>
              <th className="px-2 py-2 text-center">Diária</th>
              <th className="px-2 py-2 text-center">Sáb+Alm</th>
              <th className="px-2 py-2 text-center">S/Sáb</th>
              <th className="px-2 py-2 text-center">Vales</th>
              <th className="px-2 py-2 text-center">Seguro</th>
              <th className="px-2 py-2 text-center">Outros</th>
              <th className="px-2 py-2 text-center">Subsídio</th>
              <th className="px-2 py-2 text-center font-bold">Líquido</th>
              <th className="px-2 py-2 text-center">Pagamento</th>
              <th className="px-2 py-2 text-center">Obs</th>
              <th className="px-2 py-2 text-center">🧾</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {folha.registos.map(r=>{
              const func=estado.funcionarios.find(f=>f.id===r.funcionario_id)
              if(!func) return null
              const c=calcularLinha(r,func)
              const tipoBadge={diarista:'bg-blue-100 text-blue-700',mensalista:'bg-green-100 text-green-700',prestador:'bg-orange-100 text-orange-700'}
              const fp=r.forma_pagamento||func.forma_pagamento||'transferencia'
              return (
                <tr key={r.funcionario_id} className="hover:bg-gray-50">
                  <td className="px-2 py-1.5 sticky left-0 bg-white whitespace-nowrap">
                    <div className="font-medium text-gray-800">{func.nome}</div>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${tipoBadge[func.tipo]||'bg-gray-100 text-gray-600'}`}>{func.tipo}</span>
                  </td>
                  {['faltas','dias_q1','dias_q2','sabados'].map(field=>(
                    <td key={field} className="px-1 py-1.5 text-center">
                      <input type="number" min="0" className="w-12 border rounded px-1 py-0.5 text-center text-xs focus:outline-none focus:ring-1 focus:ring-brand-500" value={r[field]} onChange={e=>updateReg(func.id,field,e.target.value)} />
                    </td>
                  ))}
                  <td className="px-2 py-1.5 text-center font-medium">{c.dias}</td>
                  <td className="px-2 py-1.5 text-center text-gray-500">{fmtNum(c.diaria)}</td>
                  {/* Sáb+Alm editable */}
                  <td className="px-1 py-1.5 text-center">
                    <input type="number" step="0.01" className={`w-16 border rounded px-1 py-0.5 text-center text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 ${c.editouSabados?'border-orange-400 bg-orange-50':''}`} value={c.editouSabados?r.valor_sabados_manual:fmtNum(c.valorSabadosAlmoco)} onChange={e=>updateReg(func.id,'valor_sabados_manual',e.target.value)} onFocus={e=>{if(!c.editouSabados) updateReg(func.id,'valor_sabados_manual',fmtNum(c.valorSabadosAlmoco))}} />
                  </td>
                  {/* S/Sáb editable */}
                  <td className="px-1 py-1.5 text-center">
                    <input type="number" step="0.01" className={`w-16 border rounded px-1 py-0.5 text-center text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 ${c.editouSemSab?'border-orange-400 bg-orange-50':''}`} value={c.editouSemSab?r.valor_sem_sab_manual:fmtNum(c.valorSemSab)} onChange={e=>updateReg(func.id,'valor_sem_sab_manual',e.target.value)} onFocus={e=>{if(!c.editouSemSab) updateReg(func.id,'valor_sem_sab_manual',fmtNum(c.valorSemSab))}} />
                  </td>
                  {['vales','seguro','descontos_outros','subsidio'].map(field=>(
                    <td key={field} className="px-1 py-1.5 text-center">
                      <input type="number" step="0.01" min="0" className="w-14 border rounded px-1 py-0.5 text-center text-xs focus:outline-none focus:ring-1 focus:ring-brand-500" value={r[field]} onChange={e=>updateReg(func.id,field,e.target.value)} />
                    </td>
                  ))}
                  <td className="px-2 py-1.5 text-center font-bold text-green-700">{fmtEur(c.liquido)}</td>
                  <td className="px-1 py-1.5 text-center min-w-[140px]">
                    <select className="border rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 w-full" value={fp} onChange={e=>updateReg(func.id,'forma_pagamento',e.target.value)}>
                      <option value="transferencia">Transf.</option>
                      <option value="numerario">Numerário</option>
                      <option value="misto">Misto</option>
                    </select>
                    {fp==='misto'&&(
                      <div className="flex gap-1 mt-1">
                        <input type="number" step="0.01" placeholder="Transf." className="w-14 border rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500" value={r.valor_transferencia} onChange={e=>updateReg(func.id,'valor_transferencia',e.target.value)} />
                        <input type="number" step="0.01" placeholder="Num." className="w-14 border rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500" value={r.valor_numerario} onChange={e=>updateReg(func.id,'valor_numerario',e.target.value)} />
                      </div>
                    )}
                  </td>
                  <td className="px-1 py-1.5">
                    <input className="w-20 border rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500" value={r.observacoes} onChange={e=>updateReg(func.id,'observacoes',e.target.value)} />
                  </td>
                  <td className="px-1 py-1.5 text-center">
                    <button onClick={()=>setReciboAberto({func,reg:r})} className="text-brand-600 hover:text-brand-800 text-base" title="Emitir recibo">🧾</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
          {/* Footer totals */}
          <tfoot className="bg-brand-50 border-t-2 border-brand-200 sticky bottom-0">
            <tr className="font-bold text-xs">
              <td className="px-2 py-2 sticky left-0 bg-brand-50 text-gray-700">TOTAIS</td>
              <td colSpan={6}></td>
              <td className="px-2 py-2 text-center text-orange-700">{fmtEur(totSabAlm)}</td>
              <td className="px-2 py-2 text-center text-brand-700">{fmtEur(totSemSab)}</td>
              <td colSpan={4}></td>
              <td className="px-2 py-2 text-center text-green-700 text-sm">{fmtEur(totLiquido)}</td>
              <td colSpan={3}></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Receipt modal */}
      {reciboAberto&&(
        <ReciboModal func={reciboAberto.func} reg={reciboAberto.reg} mes={mes} ano={ano} empresa={estado.empresa} onClose={()=>setReciboAberto(null)} />
      )}
    </div>
  )
}

// ─── Tab: Funcionários ────────────────────────────────────────────────────────
function TabFuncionarios({ estado, setEstado }){
  const [modalFunc, setModalFunc]=useState(null) // null = closed, {} = new, {...} = edit
  const [showImport, setShowImport]=useState(false)
  const [filtro, setFiltro]=useState('')

  function salvarFuncionario(form){
    setEstado(prev=>{
      const existe=prev.funcionarios.find(f=>f.id===form.id)
      const lista=existe
        ? prev.funcionarios.map(f=>f.id===form.id?{...f,...form}:f)
        : [...prev.funcionarios,{...form,id:novoId(),ativo:true}]
      return {...prev, funcionarios:lista}
    })
    setModalFunc(null)
  }

  function toggleAtivo(id){
    setEstado(prev=>({
      ...prev,
      funcionarios:prev.funcionarios.map(f=>f.id===id?{...f,ativo:!f.ativo}:f)
    }))
  }

  function importarFuncs(funcs){
    setEstado(prev=>({...prev, funcionarios:[...prev.funcionarios,...funcs]}))
    setShowImport(false)
  }

  function exportarCSV(){
    const cols=['nome','tipo','diaria','valor_fixo','funcao','nif','niss','morada','cp','forma_pagamento','iban','ativo']
    const rows=estado.funcionarios.map(f=>cols.map(c=>f[c]??''))
    const csv=[cols,...rows].map(r=>r.join(';')).join('\n')
    const blob=new Blob(['﻿'+csv],{type:'text/csv;charset=utf-8'})
    const url=URL.createObjectURL(blob)
    const a=document.createElement('a'); a.href=url; a.download='funcionarios.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const tipoBadge={diarista:'bg-blue-100 text-blue-700',mensalista:'bg-green-100 text-green-700',prestador:'bg-orange-100 text-orange-700'}
  const filtered=estado.funcionarios.filter(f=>f.nome.toLowerCase().includes(filtro.toLowerCase()))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 flex-1 min-w-[200px]" placeholder="Pesquisar colaborador..." value={filtro} onChange={e=>setFiltro(e.target.value)} />
        <button onClick={()=>setShowImport(true)} className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">⬆️ Importar CSV</button>
        <button onClick={exportarCSV} className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">⬇️ Exportar CSV</button>
        <button onClick={()=>setModalFunc({...FUNC_TEMPLATE})} className="px-3 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700">+ Novo Colaborador</button>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Diária</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">NIF</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pagamento</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(f=>(
              <tr key={f.id} className={`hover:bg-gray-50 ${f.ativo===false?'opacity-50':''}`}>
                <td className="px-4 py-3 font-medium text-gray-800">{f.nome}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${tipoBadge[f.tipo]||'bg-gray-100 text-gray-600'}`}>{f.tipo}</span></td>
                <td className="px-4 py-3 text-right text-gray-600">{fmtEur(parseNum(f.diaria))}</td>
                <td className="px-4 py-3 text-gray-500">{f.nif||'—'}</td>
                <td className="px-4 py-3 text-gray-500 capitalize">{f.forma_pagamento}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${f.ativo!==false?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>{f.ativo!==false?'Ativo':'Inativo'}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={()=>setModalFunc({...f})} className="text-brand-600 hover:text-brand-800 text-xs font-medium">Editar</button>
                    <button onClick={()=>toggleAtivo(f.id)} className={`text-xs font-medium ${f.ativo!==false?'text-red-500 hover:text-red-700':'text-green-600 hover:text-green-800'}`}>{f.ativo!==false?'Inativar':'Ativar'}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalFunc&&<FuncionarioModal func={modalFunc} onSave={salvarFuncionario} onClose={()=>setModalFunc(null)} />}
      {showImport&&<ImportCSVModal onImport={importarFuncs} onClose={()=>setShowImport(false)} />}
    </div>
  )
}

// ─── Tab: Recibos ─────────────────────────────────────────────────────────────
function TabRecibos({ estado }){
  const hoje=new Date()
  const [mes, setMes]=useState(hoje.getMonth()+1)
  const [ano, setAno]=useState(hoje.getFullYear())
  const [reciboAberto, setReciboAberto]=useState(null)

  const chave=chaveMes(mes,ano)
  const folha=estado.folhas[chave]

  const anos=Array.from({length:11},(_,i)=>2020+i)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={mes} onChange={e=>setMes(Number(e.target.value))}>
          {MESES.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
        </select>
        <select className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={ano} onChange={e=>setAno(Number(e.target.value))}>
          {anos.map(a=><option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {!folha?(
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center text-yellow-700">
          Não existe folha de ponto para {MESES[mes-1]} {ano}. Aceda ao separador <strong>Folha de Ponto</strong> para criar.
        </div>
      ):(
        <div className="bg-white border rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Colaborador</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Líquido</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pagamento</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Recibo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {folha.registos.map(r=>{
                const func=estado.funcionarios.find(f=>f.id===r.funcionario_id)
                if(!func||func.ativo===false) return null
                const c=calcularLinha(r,func)
                const tipoBadge={diarista:'bg-blue-100 text-blue-700',mensalista:'bg-green-100 text-green-700',prestador:'bg-orange-100 text-orange-700'}
                const fp=r.forma_pagamento||func.forma_pagamento||'transferencia'
                return (
                  <tr key={r.funcionario_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{func.nome}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${tipoBadge[func.tipo]||'bg-gray-100'}`}>{func.tipo}</span></td>
                    <td className="px-4 py-3 text-right font-bold text-green-700">{fmtEur(c.liquido)}</td>
                    <td className="px-4 py-3 text-gray-500 capitalize">{fp}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={()=>setReciboAberto({func,reg:r})} className="px-3 py-1 bg-brand-600 text-white text-xs rounded-lg hover:bg-brand-700">🧾 Emitir Recibo</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {reciboAberto&&(
        <ReciboModal func={reciboAberto.func} reg={reciboAberto.reg} mes={mes} ano={ano} empresa={estado.empresa} onClose={()=>setReciboAberto(null)} />
      )}
    </div>
  )
}

// ─── Tab: Histórico ───────────────────────────────────────────────────────────
function TabHistorico({ estado, setEstado, onAbrirMes }){
  const folhasOrdenadas=Object.entries(estado.folhas).sort((a,b)=>b[0].localeCompare(a[0]))

  function apagarFolha(chave){
    if(!window.confirm(`Apagar folha ${chave}? Esta ação não pode ser desfeita.`)) return
    setEstado(prev=>{
      const folhas={...prev.folhas}
      delete folhas[chave]
      return {...prev, folhas}
    })
  }

  return (
    <div className="space-y-4">
      {folhasOrdenadas.length===0?(
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center text-gray-500">
          Nenhuma folha de ponto encontrada.
        </div>
      ):(
        <div className="bg-white border rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mês / Ano</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Colaboradores</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Bruto</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Líquido</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Guardado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {folhasOrdenadas.map(([chave, folha])=>{
                const [a,m]=chave.split('-')
                const mesNome=MESES[parseInt(m)-1]
                let totalBruto=0, totalLiquido=0, ativos=0
                folha.registos.forEach(r=>{
                  const func=estado.funcionarios.find(f=>f.id===r.funcionario_id)
                  if(!func) return
                  const c=calcularLinha(r,func)
                  if(c.bruto>0) ativos++
                  totalBruto+=c.bruto
                  totalLiquido+=c.liquido
                })
                return (
                  <tr key={chave} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{mesNome} {a}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{ativos}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{fmtEur(totalBruto)}</td>
                    <td className="px-4 py-3 text-right font-bold text-green-700">{fmtEur(totalLiquido)}</td>
                    <td className="px-4 py-3 text-center">
                      {folha.data_guardado
                        ? <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{new Date(folha.data_guardado).toLocaleDateString('pt-PT')}</span>
                        : <span className="text-xs text-gray-400">Não guardado</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={()=>onAbrirMes(parseInt(m),parseInt(a))} className="text-brand-600 hover:text-brand-800 text-xs font-medium">Abrir</button>
                        <button onClick={()=>apagarFolha(chave)} className="text-red-500 hover:text-red-700 text-xs font-medium">Apagar</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Tab: Definições ──────────────────────────────────────────────────────────
function TabDefinicoes({ estado, setEstado }){
  const [empresa, setEmpresa]=useState({...estado.empresa})
  const [config, setConfig]=useState({...estado.config})
  const [msg, setMsg]=useState('')
  const [confirmApagar, setConfirmApagar]=useState(0)

  function salvarEmpresa(){
    setEstado(prev=>({...prev, empresa:{...empresa}}))
    setMsg('Dados guardados!')
    setTimeout(()=>setMsg(''),3000)
  }

  function salvarConfig(){
    setEstado(prev=>({...prev, config:{...config}}))
    setMsg('Configurações guardadas!')
    setTimeout(()=>setMsg(''),3000)
  }

  function exportarJSON(){
    const blob=new Blob([JSON.stringify(estado,null,2)],{type:'application/json'})
    const url=URL.createObjectURL(blob)
    const a=document.createElement('a'); a.href=url; a.download='backup_infraimperio.json'; a.click()
    URL.revokeObjectURL(url)
  }

  function importarJSON(e){
    const file=e.target.files[0]
    if(!file) return
    const reader=new FileReader()
    reader.onload=ev=>{
      try{
        const data=JSON.parse(ev.target.result)
        if(!data.funcionarios||!data.empresa){ alert('Ficheiro inválido.'); return }
        setEstado(data)
        setEmpresa({...data.empresa})
        setConfig({...data.config})
        setMsg('Backup restaurado com sucesso!')
        setTimeout(()=>setMsg(''),3000)
      } catch(err){ alert('Erro ao importar: '+err.message) }
    }
    reader.readAsText(file)
    e.target.value=''
  }

  function apagarTudo(){
    if(confirmApagar===0){ setConfirmApagar(1); return }
    if(confirmApagar===1){ setConfirmApagar(2); return }
    localStorage.removeItem(LS_KEY)
    window.location.reload()
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {msg&&<div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{msg}</div>}

      {/* Config */}
      <div className="bg-white border rounded-xl shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Configurações</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Forma de Pagamento Padrão</label>
            <select className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={config.forma_pagamento_default} onChange={e=>setConfig(p=>({...p,forma_pagamento_default:e.target.value}))}>
              <option value="transferencia">Transferência Bancária</option>
              <option value="numerario">Numerário</option>
              <option value="misto">Misto</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Subsídio Almoço Sábado (€)</label>
            <input type="number" step="0.01" className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-32" value={config.subsidio_almoco_sabado} onChange={e=>setConfig(p=>({...p,subsidio_almoco_sabado:e.target.value}))} />
          </div>
        </div>
        <button onClick={salvarConfig} className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm font-medium">Guardar Configurações</button>
      </div>

      {/* Company */}
      <div className="bg-white border rounded-xl shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Dados da Empresa</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            {k:'nome',l:'Nome',cols:2},
            {k:'morada',l:'Morada',cols:2},
            {k:'cp',l:'Código Postal'},
            {k:'pais',l:'País'},
            {k:'email',l:'Email',cols:2},
            {k:'tel',l:'Telefone'},
            {k:'nipc',l:'NIPC'},
            {k:'capital',l:'Capital Social (€)'},
            {k:'crc',l:'Matrícula CRC'},
            {k:'matricula',l:'Matrícula'},
          ].map(({k,l,cols})=>(
            <div key={k} className={cols===2?'col-span-2':''}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{l}</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={empresa[k]||''} onChange={e=>setEmpresa(p=>({...p,[k]:e.target.value}))} />
            </div>
          ))}
        </div>
        <button onClick={salvarEmpresa} className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm font-medium">Guardar Dados da Empresa</button>
      </div>

      {/* Backup */}
      <div className="bg-white border rounded-xl shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Backup & Restauro</h3>
        <div className="flex flex-wrap gap-3">
          <button onClick={exportarJSON} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">⬇️ Exportar Backup (JSON)</button>
          <label className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium cursor-pointer">
            ⬆️ Importar Backup
            <input type="file" accept=".json" className="hidden" onChange={importarJSON} />
          </label>
        </div>
        <div className="mt-6 border-t pt-4">
          <h4 className="text-sm font-medium text-red-600 mb-2">Zona de Perigo</h4>
          {confirmApagar===0&&<button onClick={apagarTudo} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-medium">Apagar todos os dados</button>}
          {confirmApagar===1&&(
            <div className="space-y-2">
              <p className="text-sm text-red-700">Tem a certeza? Esta ação irá apagar TODOS os dados permanentemente.</p>
              <button onClick={apagarTudo} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">Sim, confirmar apagar tudo</button>
              <button onClick={()=>setConfirmApagar(0)} className="ml-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">Cancelar</button>
            </div>
          )}
          {confirmApagar===2&&(
            <div className="space-y-2">
              <p className="text-sm text-red-700 font-bold">ÚLTIMA CONFIRMAÇÃO: Todos os dados serão permanentemente eliminados.</p>
              <button onClick={apagarTudo} className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 text-sm font-medium">CONFIRMAR ELIMINAÇÃO DEFINITIVA</button>
              <button onClick={()=>setConfirmApagar(0)} className="ml-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">Cancelar</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Pagamentos(){
  const estadoRef=useRef(estadoInicial())
  const [, forceRender]=useState(0)
  const [tab, setTab]=useState('folha')
  const [folhaMes, setFolhaMes]=useState(null) // {mes,ano} when jumping from histórico

  function setEstado(updater){
    const prev=estadoRef.current
    const next=typeof updater==='function'?updater(prev):updater
    estadoRef.current=next
    salvarEstado(next)
    forceRender(n=>n+1)
  }

  const estado=estadoRef.current

  function abrirMesHistorico(mes, ano){
    setFolhaMes({mes,ano})
    setTab('folha')
  }

  const tabs=[
    {id:'folha',label:'📋 Folha de Ponto'},
    {id:'funcionarios',label:'👥 Colaboradores'},
    {id:'recibos',label:'🧾 Recibos'},
    {id:'historico',label:'🗂️ Histórico'},
    {id:'definicoes',label:'⚙️ Definições'},
  ]

  return (
    <div className="max-w-[1600px] mx-auto">
      {/* Tabs */}
      <div className="flex gap-1 bg-white border-b px-2 pt-2 overflow-x-auto">
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${tab===t.id?'border-brand-600 text-brand-700':'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-4">
        {tab==='folha'&&<TabFolhaPonto estado={estado} setEstado={setEstado} setTab={setTab} initialMesAno={folhaMes} key={folhaMes?`${folhaMes.mes}-${folhaMes.ano}`:undefined} />}
        {tab==='funcionarios'&&<TabFuncionarios estado={estado} setEstado={setEstado} />}
        {tab==='recibos'&&<TabRecibos estado={estado} />}
        {tab==='historico'&&<TabHistorico estado={estado} setEstado={setEstado} onAbrirMes={abrirMesHistorico} />}
        {tab==='definicoes'&&<TabDefinicoes estado={estado} setEstado={setEstado} />}
      </div>
    </div>
  )
}
