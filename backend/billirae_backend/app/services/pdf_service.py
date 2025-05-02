from typing import Dict, Any, List, Optional
import io
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from app.db.models.invoice import InvoiceInDB
from app.db.models.user import UserInDB
from app.db.models.client import ClientInDB

class PDFService:
    """Service for generating PDF invoices."""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.styles.add(ParagraphStyle(
            name='InvoiceTitle',
            fontName='Helvetica-Bold',
            fontSize=16,
            alignment=1,  # Center
            spaceAfter=12
        ))
        self.styles.add(ParagraphStyle(
            name='InvoiceSubtitle',
            fontName='Helvetica-Bold',
            fontSize=12,
            spaceAfter=6
        ))
        self.styles.add(ParagraphStyle(
            name='InvoiceInfo',
            fontName='Helvetica',
            fontSize=10,
            spaceAfter=3
        ))
    
    async def generate_invoice_pdf(
        self,
        invoice: InvoiceInDB,
        user: UserInDB,
        client: ClientInDB
    ) -> bytes:
        """
        Generate a PDF invoice.
        
        Args:
            invoice: Invoice data
            user: User data (sender)
            client: Client data (recipient)
            
        Returns:
            PDF file as bytes
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=72
        )
        
        content = []
        
        content.append(Paragraph(f"Rechnung Nr. {invoice.invoice_number}", self.styles['InvoiceTitle']))
        content.append(Spacer(1, 12))
        
        sender_info = [
            [Paragraph("Absender:", self.styles['InvoiceSubtitle']), Paragraph("Empfänger:", self.styles['InvoiceSubtitle'])],
            [
                Paragraph(f"{user.company_name or f'{user.first_name} {user.last_name}'}", self.styles['InvoiceInfo']),
                Paragraph(f"{client.name}", self.styles['InvoiceInfo'])
            ]
        ]
        
        if user.address:
            sender_info[1][0].append(Paragraph(
                f"{user.address.street}<br/>{user.address.zip} {user.address.city}<br/>{user.address.country}",
                self.styles['InvoiceInfo']
            ))
        
        if client.address:
            sender_info[1][1].append(Paragraph(
                f"{client.address.street}<br/>{client.address.zip} {client.address.city}<br/>{client.address.country}",
                self.styles['InvoiceInfo']
            ))
        
        sender_recipient_table = Table(sender_info, colWidths=[doc.width/2.0]*2)
        sender_recipient_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        content.append(sender_recipient_table)
        content.append(Spacer(1, 24))
        
        invoice_date = invoice.invoice_date.strftime("%d.%m.%Y")
        due_date = invoice.due_date.strftime("%d.%m.%Y") if invoice.due_date else None
        
        invoice_details = [
            ["Rechnungsdatum:", invoice_date],
            ["Fälligkeitsdatum:", due_date or "14 Tage nach Erhalt"],
        ]
        
        if user.tax_id:
            invoice_details.append(["Steuernummer:", user.tax_id])
        
        invoice_details_table = Table(invoice_details, colWidths=[doc.width/4.0, doc.width*3/4.0])
        invoice_details_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        content.append(invoice_details_table)
        content.append(Spacer(1, 24))
        
        items_data = [["Leistung", "Menge", "Einzelpreis", "MwSt.", "Gesamt"]]
        
        for item in invoice.items:
            tax_percent = f"{item.tax_rate * 100:.0f}%"
            item_total = item.quantity * item.unit_price
            items_data.append([
                item.service,
                str(item.quantity),
                f"{item.unit_price:.2f} €",
                tax_percent,
                f"{item_total:.2f} €"
            ])
        
        items_data.append(["", "", "", "Zwischensumme:", f"{invoice.subtotal:.2f} €"])
        items_data.append(["", "", "", "MwSt.:", f"{invoice.tax_amount:.2f} €"])
        items_data.append(["", "", "", "Gesamtbetrag:", f"{invoice.total:.2f} €"])
        
        items_table = Table(items_data, colWidths=[doc.width*0.4, doc.width*0.1, doc.width*0.15, doc.width*0.15, doc.width*0.2])
        items_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -4), colors.white),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, -3), (-1, -1), 'Helvetica-Bold'),
            ('LINEBELOW', (0, 0), (-1, 0), 1, colors.black),
            ('LINEABOVE', (0, -3), (-1, -3), 1, colors.black),
            ('LINEBELOW', (0, -1), (-1, -1), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        content.append(items_table)
        content.append(Spacer(1, 24))
        
        if user.bank_details:
            payment_info = [
                [Paragraph("Zahlungsinformationen:", self.styles['InvoiceSubtitle'])],
                [Paragraph(f"Kontoinhaber: {user.bank_details.account_holder}", self.styles['InvoiceInfo'])],
                [Paragraph(f"IBAN: {user.bank_details.iban}", self.styles['InvoiceInfo'])],
            ]
            
            if user.bank_details.bic:
                payment_info.append([Paragraph(f"BIC: {user.bank_details.bic}", self.styles['InvoiceInfo'])])
            
            payment_table = Table(payment_info, colWidths=[doc.width])
            payment_table.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('TOPPADDING', (0, 0), (-1, -1), 3),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ]))
            content.append(payment_table)
            content.append(Spacer(1, 24))
        
        if invoice.notes:
            content.append(Paragraph("Anmerkungen:", self.styles['InvoiceSubtitle']))
            content.append(Paragraph(invoice.notes, self.styles['InvoiceInfo']))
        
        doc.build(content)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        
        return pdf_bytes
