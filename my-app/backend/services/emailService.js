// backend/services/emailService.js
import dotenv from 'dotenv'
import { Resend } from 'resend'
import QRCode from 'qrcode'
import pkg from 'pdfkit'

dotenv.config()

let resendClient = null
function getResend() {
  if (resendClient) return resendClient
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  resendClient = new Resend(key)
  return resendClient
}

// Maak een A4 PDF met eventinfo, tickettype, token en QR
async function generateTicketPdf({ event, ticket, baseUrl }) {
  const PDFDocument = pkg
  const verifyUrl = `${baseUrl}/tickets/verify?token=${encodeURIComponent(ticket.token)}`
  const qrPng = await QRCode.toBuffer(verifyUrl)
  const brandBlue = process.env.BRAND_BLUE || '#0ea5e9'
  const brandBlack = '#111111'

  return await new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 })
      const chunks = []
      doc.on('data', (d) => chunks.push(d))
      doc.on('error', reject)
      doc.on('end', () => resolve(Buffer.concat(chunks)))

      // Header bar with brand blue
      doc.rect(50, 50, doc.page.width - 100, 40).fill(brandBlue)
      doc.fill('#ffffff').fontSize(18).text('TixFlow – Ticket', 60, 60, { align: 'left' })
      doc.fill('#000000')
      doc.moveDown(0.5)
      doc.fontSize(12).fillColor('#555').text(new Date(event.date).toLocaleString(), 50, 100)
      doc.fillColor('#000')
      doc.moveDown(1)

      // Event info
      doc.fontSize(16).fillColor(brandBlack).text(event.title || 'Event', { continued: false })
      if (event.location) doc.fontSize(12).text(`Locatie: ${event.location}`)
      doc.moveDown(0.5)
      doc.fontSize(12).text(`Tickettype: ${ticket.ticketTypeName}`)
      doc.fontSize(12).text(`Ticketcode: ${ticket.token}`)
      doc.moveDown(1)

      // QR
      try {
        doc.image(qrPng, { fit: [220, 220], align: 'left' })
      } catch (e) {
        doc.fontSize(11).fillColor('red').text('QR kon niet geladen worden.')
        doc.fillColor('#000')
      }

      doc.moveDown(1)
      doc.fontSize(11).fillColor('#333').text('Scan de QR bij de ingang.')
      doc.fillColor('#000')
      doc.moveDown(2)
      doc.fontSize(10).text('Bewaar dit ticket. Bij misbruik kan toegang geweigerd worden. Het ticket is uniek en éénmalig te scannen.', { align: 'left' })

      doc.end()
    } catch (err) {
      reject(err)
    }
  })
}

export async function sendTicketsEmail({ to, event, tickets, order }) {
  const resend = getResend()
  if (!resend) throw new Error('RESEND_API_KEY ontbreekt')

  const from = process.env.EMAIL_FROM || 'tickets@send.tixflow.nl'
  const normalizeBaseUrl = (value) => {
    let v = String(value || '').trim()
    if (!v) return 'http://localhost:5173'
    v = v.replace(/^ttp:\/\//i, 'http://')
    if (!/^https?:\/\//i.test(v)) v = `https://${v}`
    v = v.replace(/\/+$/, '')
    return v
  }
  const baseUrl = normalizeBaseUrl(process.env.APP_BASE_URL || 'http://localhost:5173')

  const subject = `Je tickets voor ${event?.title || 'je event'}`

  const { html, attachments } = await buildEmailHtmlAndAttachments({ event, tickets, order, baseUrl })


  const { data, error } = await resend.emails.send({
    from,
    to,
    subject,
    html,
    attachments,
  })

  if (error) {
    throw new Error(`Resend versturen mislukt: ${error.message || String(error)}`)
  }
  return data
}

// Bouw HTML en bijlagen met merkaccenten voor preview en verzending
export async function buildEmailHtmlAndAttachments({ event, tickets, order, baseUrl }) {
  const brandBlue = process.env.BRAND_BLUE || '#0ea5e9' // helder blauw
  const brandBlack = '#111111'
  const bg = '#ffffff'

  const fmt = (cents, currency) => {
    const curr = (currency || 'EUR').toUpperCase()
    try {
      return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: curr }).format((Number(cents || 0)) / 100)
    } catch (_) {
      return `${(Number(cents || 0) / 100).toFixed(2)} ${curr}`
    }
  }

  // Genereer per ticket een PDF-bijlage (betrouwbaar voor alle mailclients)
  const attachments = []
  const ticketRows = []
  for (const t of (tickets || [])) {
    const pdf = await generateTicketPdf({ event, ticket: t, baseUrl })
    const filename = `Ticket-${(t.ticketTypeName || 'type')}-${String(t.token).slice(0, 6)}.pdf`
    attachments.push({ filename, content: pdf.toString('base64') })
  }

  // Toon in de e-mail alleen type en aantal (geen bijlagetekst of link)
  const countsByType = new Map()
  for (const t of (tickets || [])) {
    const key = String(t.ticketTypeName || 'Ticket')
    countsByType.set(key, (countsByType.get(key) || 0) + 1)
  }
  for (const [typeName, count] of countsByType.entries()) {
    ticketRows.push(`
      <tr style="border-bottom:1px solid #eee;">
        <td style="padding:10px 0;">
          <div style="font-weight:700;color:${brandBlack};">${typeName}</div>
        </td>
        <td style="padding:10px 0; text-align:right; color:#555;">× ${count}</td>
      </tr>
    `)
  }

  const html = `
    <div style="background:${bg}; font-family: Inter, Arial, sans-serif; line-height: 1.7; color: ${brandBlack}; padding: 0;">
      <div style="max-width:680px;margin:0 auto;">
        <div style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
          <div style="background:${brandBlue}; color:#fff; padding:18px 20px;">
            <h2 style="margin:0;font-size:20px;">Bedankt voor je aankoop!</h2>
            <p style="margin:6px 0 0 0; font-size:14px; opacity:0.95;">Je tickets zijn bijgevoegd als PDF met QR.</p>
          </div>
          <div style="padding:18px 20px;background:#fff;">
            <p style="margin:0 0 6px 0;">Event: <strong>${event?.title || 'het event'}</strong></p>
            <p style="margin:0 0 16px 0; color:#555;">${event?.location || ''} · ${event?.date ? new Date(event.date).toLocaleString() : ''}</p>

            ${order ? `
            <div style="margin:10px 0 16px 0;">
              <h3 style="margin:0 0 8px 0; font-size:15px;">Bestelling</h3>
              <table style="width:100%; border-collapse: collapse;">
                <tbody>
                  ${(order.items || []).map(i => {
    const qty = Number(i.quantity || 0)
    const unit = fmt(Number(i.unitAmount || 0), order.currency)
    const lineTotal = fmt(Number(i.unitAmount || 0) * qty, order.currency)
    return `
                    <tr style="border-bottom:1px solid #eee;">
                      <td style="padding:8px 0;">${i.name || 'Ticket'}</td>
                      <td style="padding:8px 0; text-align:center; color:#555;">× ${qty}</td>
                      <td style="padding:8px 0; text-align:right; color:#555;">${unit}</td>
                      <td style="padding:8px 0; text-align:right; font-weight:600;">${lineTotal}</td>
                    </tr>
                    `
  }).join('')}
                </tbody>
              </table>
              <div style="margin-top:8px; text-align:right; font-weight:700;">Totaal gespendeerd: ${fmt(order.amountCents || 0, order.currency)}</div>
            </div>
            ` : ''}

            <table style="width:100%; border-collapse: collapse;">${ticketRows.join('')}</table>
            
            <p style="margin-top:12px;color:#555">Elke PDF bevat de QR en verificatielink. Je kunt de PDFs doorsturen naar medebezoekers.</p>
          </div>
          <div style="background:#f9fafb;color:#6b7280;padding:12px 20px;font-size:12px;">Verzonden door TixFlow</div>
        </div>
      </div>
    </div>
  `
  return { html, attachments }
}
