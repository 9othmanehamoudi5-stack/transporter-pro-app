import jsPDF from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';

// Apply the autoTable plugin to jsPDF (required for v5.x)
applyPlugin(jsPDF);

const BLUE = [0, 102, 255];
const DARK = [18, 18, 20];
const GREY = [120, 120, 130];
const GREEN = [34, 197, 94];
const RED = [239, 68, 68];

/**
 * Generate a professional Factur-X PDF for an invoice
 */
export function generateInvoicePDF(invoice) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  // ── Header bar ──
  doc.setFillColor(...DARK);
  doc.rect(0, 0, pageW, 42, 'F');

  // Logo square
  doc.setFillColor(...BLUE);
  doc.roundedRect(margin, 10, 22, 22, 4, 4, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('TP', margin + 11, 24, { align: 'center' });

  // Company name
  doc.setFontSize(20);
  doc.text('Transporter-Pro', margin + 28, 20);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 180, 180);
  doc.text('Facture Factur-X | e-CMR', margin + 28, 28);

  // Invoice number top-right
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.invoice_id || 'INV-000', pageW - margin, 20, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 180, 180);
  const dateStr = invoice.created_at
    ? new Date(invoice.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  doc.text(dateStr, pageW - margin, 28, { align: 'right' });

  y = 56;

  // ── PAID stamp ──
  if (invoice.status === 'paid') {
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: 0.12 }));
    doc.setFillColor(...GREEN);
    doc.roundedRect(pageW / 2 - 40, y - 8, 80, 28, 4, 4, 'F');
    doc.restoreGraphicsState();

    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: 0.9 }));
    doc.setTextColor(...GREEN);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYÉ', pageW / 2, y + 12, { align: 'center' });
    doc.restoreGraphicsState();
    y += 30;
  }

  // ── Info blocks ──
  doc.setTextColor(...DARK);

  // Left block - Émetteur
  doc.setFontSize(8);
  doc.setTextColor(...GREY);
  doc.text('ÉMETTEUR', margin, y);
  y += 5;
  doc.setFontSize(11);
  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'bold');
  doc.text('Transporter-Pro SAS', margin, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...GREY);
  doc.text('12 Rue de la Logistique', margin, y); y += 4;
  doc.text('75001 Paris, France', margin, y); y += 4;
  doc.text('SIRET: 123 456 789 00001', margin, y); y += 4;
  doc.text('TVA: FR 12 123456789', margin, y);

  // Right block - Destinataire
  const rightX = pageW / 2 + 10;
  let yRight = y - 22;
  doc.setFontSize(8);
  doc.setTextColor(...GREY);
  doc.text('DESTINATAIRE', rightX, yRight);
  yRight += 5;
  doc.setFontSize(11);
  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.client_name || 'Client', rightX, yRight);
  yRight += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...GREY);
  doc.text(invoice.client_address || 'Adresse client', rightX, yRight); yRight += 4;
  doc.text(`Réf. livraison: ${invoice.delivery_id || 'N/A'}`, rightX, yRight);

  y += 16;

  // ── Separator ──
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);
  y += 10;

  // ── Table ──
  const statusLabel = invoice.status === 'paid' ? 'Payée' : invoice.status === 'ready_to_send' ? 'Prête à envoyer' : 'En attente';
  const amount = invoice.amount || 0;
  const tva = Math.round(amount * 0.2 * 100) / 100;
  const ht = Math.round((amount - tva) * 100) / 100;

  doc.autoTable({
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Description', 'Réf. Livraison', 'Montant HT', 'TVA (20%)', 'Total TTC']],
    body: [
      [
        'Service de transport et livraison',
        invoice.delivery_id || 'N/A',
        `${ht.toLocaleString('fr-FR')} €`,
        `${tva.toLocaleString('fr-FR')} €`,
        `${amount.toLocaleString('fr-FR')} €`
      ]
    ],
    headStyles: {
      fillColor: DARK,
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      cellPadding: 5
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 5,
      textColor: [50, 50, 50]
    },
    alternateRowStyles: {
      fillColor: [248, 248, 250]
    },
    columnStyles: {
      0: { cellWidth: 55 },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right', fontStyle: 'bold' }
    }
  });

  y = doc.lastAutoTable.finalY + 10;

  // ── Totals box ──
  const totalsX = pageW - margin - 70;
  doc.setFillColor(248, 248, 250);
  doc.roundedRect(totalsX - 5, y - 2, 75, 38, 3, 3, 'F');

  doc.setFontSize(9);
  doc.setTextColor(...GREY);
  doc.text('Sous-total HT:', totalsX, y + 6);
  doc.text('TVA (20%):', totalsX, y + 14);
  doc.setDrawColor(200, 200, 200);
  doc.line(totalsX, y + 18, totalsX + 65, y + 18);
  doc.setFontSize(11);
  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'bold');
  doc.text('Total TTC:', totalsX, y + 28);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...DARK);
  doc.text(`${ht.toLocaleString('fr-FR')} €`, totalsX + 65, y + 6, { align: 'right' });
  doc.text(`${tva.toLocaleString('fr-FR')} €`, totalsX + 65, y + 14, { align: 'right' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BLUE);
  doc.text(`${amount.toLocaleString('fr-FR')} €`, totalsX + 65, y + 28, { align: 'right' });

  // Status badge on the left
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...GREY);
  doc.text('Statut:', margin, y + 10);
  const badgeColor = invoice.status === 'paid' ? GREEN : invoice.status === 'ready_to_send' ? BLUE : [234, 179, 8];
  doc.setFillColor(...badgeColor);
  doc.roundedRect(margin + 18, y + 4, doc.getTextWidth(statusLabel) + 10, 10, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(statusLabel, margin + 23, y + 11);

  y += 50;

  // ── Payment info ──
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageW - margin, y);
  y += 8;
  doc.setFontSize(8);
  doc.setTextColor(...GREY);
  doc.setFont('helvetica', 'normal');
  doc.text('CONDITIONS DE PAIEMENT', margin, y);
  y += 5;
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text('Paiement à 30 jours. Pénalités de retard: 3x le taux d\'intérêt légal. Indemnité forfaitaire: 40 €.', margin, y);

  // ── Footer ──
  const footerY = doc.internal.pageSize.getHeight() - 16;
  doc.setFillColor(...DARK);
  doc.rect(0, footerY - 6, pageW, 22, 'F');
  doc.setFontSize(7);
  doc.setTextColor(140, 140, 140);
  doc.text('Transporter-Pro SAS | contact@transporter-pro.com | +33 1 23 45 67 89', pageW / 2, footerY, { align: 'center' });
  doc.text(`Facture générée le ${new Date().toLocaleDateString('fr-FR')} — Format Factur-X conforme`, pageW / 2, footerY + 5, { align: 'center' });

  // ── Download ──
  doc.save(`${invoice.invoice_id || 'facture'}.pdf`);
}

/**
 * Generate PDFs for all unpaid invoices
 */
export function generateAllInvoicesPDF(invoices) {
  const unpaid = invoices.filter(inv => inv.status !== 'paid');
  if (unpaid.length === 0) {
    return { count: 0 };
  }
  unpaid.forEach(inv => generateInvoicePDF(inv));
  return { count: unpaid.length };
}
