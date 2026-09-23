"""Operational Delivery Report PDF generator."""
import base64 as b64module
import io
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.enums import TA_LEFT, TA_CENTER


PRIMARY = colors.HexColor("#0066FF")
SUCCESS = colors.HexColor("#16a34a")
DARK = colors.HexColor("#0A0A0B")
MUTED = colors.HexColor("#71717A")
LINE = colors.HexColor("#E4E4E7")


def _logo_flowable(logo_b64: str, max_w_mm: int = 32, max_h_mm: int = 18):
    if not logo_b64:
        return None
    try:
        if "," in logo_b64[:100]:
            logo_b64 = logo_b64.split(",", 1)[1]
        img = Image(io.BytesIO(b64module.b64decode(logo_b64)))
        # Fit while preserving aspect ratio
        max_w = max_w_mm * mm
        max_h = max_h_mm * mm
        iw, ih = img.imageWidth, img.imageHeight
        ratio = min(max_w / iw, max_h / ih)
        img.drawWidth = iw * ratio
        img.drawHeight = ih * ratio
        return img
    except Exception:
        return None


def generate_delivery_report_pdf(delivery: dict, company: dict, logo_b64: str = "", driver_name: str = "") -> bytes:
    """Generate a professional Delivery Report PDF and return bytes."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=18 * mm, rightMargin=18 * mm,
        topMargin=18 * mm, bottomMargin=15 * mm,
        title=f"Rapport livraison {delivery.get('tracking_id', '')}",
    )
    styles = getSampleStyleSheet()
    h1 = ParagraphStyle("h1", parent=styles["Heading1"], fontSize=18, textColor=DARK, leading=22, spaceAfter=2, alignment=TA_LEFT)
    h2 = ParagraphStyle("h2", parent=styles["Heading2"], fontSize=11, textColor=PRIMARY, spaceAfter=6, leading=14, fontName="Helvetica-Bold")
    muted = ParagraphStyle("muted", parent=styles["Normal"], fontSize=8, textColor=MUTED, leading=11)
    normal = ParagraphStyle("normal", parent=styles["Normal"], fontSize=9.5, textColor=DARK, leading=13)
    mono = ParagraphStyle("mono", parent=styles["Normal"], fontSize=9.5, textColor=DARK, fontName="Helvetica-Bold", leading=13)

    story = []

    # ---------- HEADER (logo + title) ----------
    logo = _logo_flowable(logo_b64)
    title_block = [
        Paragraph("Rapport de Livraison Opérationnel", h1),
        Paragraph(
            f"Émis le {datetime.utcnow().strftime('%d/%m/%Y à %H:%M UTC')} — Transporter-Pro",
            muted,
        ),
    ]
    if logo:
        header_table = Table(
            [[logo, title_block]],
            colWidths=[36 * mm, None],
        )
    else:
        header_table = Table([[title_block]], colWidths=[None])
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 6))
    story.append(Table([[""]], colWidths=[doc.width], style=TableStyle([("LINEBELOW", (0, 0), (-1, -1), 0.6, PRIMARY)])))
    story.append(Spacer(1, 12))

    # ---------- ÉMETTEUR ----------
    story.append(Paragraph("ÉMETTEUR", h2))
    sender_rows = [
        ["Raison sociale", company.get("company_name", "—")],
        ["SIRET", company.get("siret", "—")],
        ["TVA Intra", company.get("tva_intra", "") or "—"],
        ["Adresse du siège", company.get("address", "—")],
    ]
    sender_table = Table(
        [[Paragraph(k, muted), Paragraph(v or "—", normal)] for k, v in sender_rows],
        colWidths=[42 * mm, None],
    )
    sender_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
    ]))
    story.append(sender_table)
    story.append(Spacer(1, 14))

    # ---------- DÉTAILS COURSE ----------
    story.append(Paragraph("DÉTAILS DE LA COURSE", h2))
    delivered_at = delivery.get("delivered_at") or delivery.get("updated_at") or delivery.get("created_at")
    if isinstance(delivered_at, datetime):
        delivered_str = delivered_at.strftime("%d/%m/%Y à %H:%M")
    elif isinstance(delivered_at, str) and delivered_at:
        try:
            delivered_str = datetime.fromisoformat(delivered_at.replace("Z", "+00:00")).strftime("%d/%m/%Y à %H:%M")
        except Exception:
            delivered_str = delivered_at
    else:
        delivered_str = "—"

    details_rows = [
        ["N° de tracking", Paragraph(f"<b>{delivery.get('tracking_id', '—')}</b>", mono)],
        ["Chauffeur", Paragraph(driver_name or "Non assigné", normal)],
        ["Date / heure", Paragraph(delivered_str, normal)],
        ["Poids", Paragraph(f"{delivery.get('weight_kg', '—')} kg", normal)],
        ["Description colis", Paragraph(delivery.get("package_description", "—"), normal)],
    ]
    details_table = Table(
        [[Paragraph(k, muted), v] for k, v in details_rows],
        colWidths=[42 * mm, None],
    )
    details_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
    ]))
    story.append(details_table)
    story.append(Spacer(1, 14))

    # ---------- EXPÉDITEUR / DESTINATAIRE ----------
    sender_name = company.get("company_name", "—")
    sender_addr = company.get("address", "—")
    recipient_name = delivery.get("recipient_name", "—")
    recipient_addr = delivery.get("recipient_address", "—")
    recipient_phone = delivery.get("recipient_phone", "")

    parties = Table(
        [
            [Paragraph("EXPÉDITEUR", h2), Paragraph("DESTINATAIRE", h2)],
            [
                Paragraph(f"<b>{sender_name}</b><br/>{sender_addr}", normal),
                Paragraph(
                    f"<b>{recipient_name}</b><br/>{recipient_addr}" + (f"<br/>{recipient_phone}" if recipient_phone else ""),
                    normal,
                ),
            ],
        ],
        colWidths=[doc.width / 2 - 4, doc.width / 2 - 4],
    )
    parties.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOX", (0, 0), (0, -1), 0.5, LINE),
        ("BOX", (1, 0), (1, -1), 0.5, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
    ]))
    story.append(parties)
    story.append(Spacer(1, 18))

    # ---------- STATUT (big green badge) ----------
    status = (delivery.get("status") or "").lower()
    if status == "delivered":
        badge_text = "LIVRÉ · DELIVERED"
        badge_bg = SUCCESS
    elif status == "in_transit":
        badge_text = "EN TRANSIT · IN TRANSIT"
        badge_bg = colors.HexColor("#f59e0b")
    else:
        badge_text = (status or "—").upper()
        badge_bg = colors.HexColor("#71717A")

    badge_style = ParagraphStyle(
        "badge", fontName="Helvetica-Bold", fontSize=14, textColor=colors.white, alignment=TA_CENTER, leading=18,
    )
    badge = Table(
        [[Paragraph(badge_text, badge_style)]],
        colWidths=[doc.width],
    )
    badge.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), badge_bg),
        ("TOPPADDING", (0, 0), (-1, -1), 14),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
        ("ROUNDEDCORNERS", [8, 8, 8, 8]),
    ]))
    story.append(badge)
    story.append(Spacer(1, 18))

    # ---------- FOOTER ----------
    footer = Paragraph(
        f"Document généré automatiquement par Transporter-Pro · {company.get('company_name', '')} · "
        f"Conforme RGPD / eFTI / eIDAS · Ce rapport opérationnel est un outil de gestion interne.",
        muted,
    )
    story.append(footer)

    doc.build(story)
    pdf_bytes = buf.getvalue()
    buf.close()
    return pdf_bytes
