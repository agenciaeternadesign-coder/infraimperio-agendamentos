import { workTypeLabel } from '../components/StatusBadge'
import { formatDate } from './dateUtils'

function visitRow(v) {
  const morada = `${v.address?.street ?? ''} ${v.address?.number ?? ''}${v.address?.floor ? ', ' + v.address.floor : ''}, ${v.address?.city ?? ''}`.trim()
  return {
    cliente: v.clientName ?? '',
    telefone: v.clientPhone ?? '',
    morada,
    servico: workTypeLabel(v.workType, v.workTypeOther),
    hora: v.time || 's/ hora',
  }
}

// Ordena por hora (sem hora fica no fim) e depois por data
function sortVisits(visits) {
  return [...visits].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date)
    return (a.time || '99:99').localeCompare(b.time || '99:99')
  })
}

// Gera uma planilha imprimível das visitas e abre o diálogo de impressão
export function printVisitsSheet(visits, title = 'Planilha de Visitas') {
  const rows = sortVisits(visits).map(visitRow)

  const tableRows = rows.map((r) => `
    <tr>
      <td>${escapeHtml(r.cliente)}</td>
      <td>${escapeHtml(r.telefone)}</td>
      <td>${escapeHtml(r.morada)}</td>
      <td>${escapeHtml(r.servico)}</td>
      <td class="hora">${escapeHtml(r.hora)}</td>
    </tr>`).join('')

  const html = `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; color: #1e293b; margin: 32px; }
  h1 { font-size: 20px; margin: 0 0 4px; color: #b91c1c; }
  .sub { font-size: 12px; color: #64748b; margin: 0 0 20px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  thead th { background: #b91c1c; color: #fff; text-align: left; padding: 8px 10px; font-size: 12px; text-transform: uppercase; letter-spacing: .03em; }
  tbody td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  tbody tr:nth-child(even) { background: #f8fafc; }
  .hora { font-weight: 700; white-space: nowrap; }
  .empty { text-align: center; color: #94a3b8; padding: 40px; }
  .footer { margin-top: 24px; font-size: 11px; color: #94a3b8; }
  @media print { body { margin: 12mm; } thead th { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
  <h1>Infraimpério — ${escapeHtml(title)}</h1>
  <p class="sub">${rows.length} visita${rows.length !== 1 ? 's' : ''} · gerado em ${formatDate(new Date().toISOString().slice(0, 10))}</p>
  ${rows.length === 0 ? '<p class="empty">Sem visitas para mostrar.</p>' : `
  <table>
    <thead>
      <tr>
        <th>Cliente</th>
        <th>Telefone</th>
        <th>Morada</th>
        <th>Serviço</th>
        <th>Hora</th>
      </tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>`}
  <p class="footer">Infraimpério — Obras & Remodelações</p>
  <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 250); };</script>
</body>
</html>`

  const w = window.open('', '_blank')
  if (!w) {
    alert('Permita pop-ups para abrir a planilha de impressão.')
    return
  }
  w.document.write(html)
  w.document.close()
}

// Exporta as visitas para CSV (abrível em Excel / Google Sheets)
export function downloadVisitsCsv(visits, filename = 'visitas.csv') {
  const rows = sortVisits(visits).map(visitRow)
  const header = ['Cliente', 'Telefone', 'Morada', 'Serviço', 'Hora']
  const csvRows = [
    header.join(';'),
    ...rows.map((r) => [r.cliente, r.telefone, r.morada, r.servico, r.hora].map(csvCell).join(';')),
  ]
  // BOM para o Excel reconhecer acentos
  const blob = new Blob(['﻿' + csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function csvCell(value) {
  const s = String(value ?? '')
  if (/[";\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
