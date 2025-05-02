from typing import Dict, Any, List, Optional
import io
import os
import logging
import qrcode
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak
from reportlab.platypus.flowables import Flowable
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from app.db.models.invoice import InvoiceInDB
from app.db.models.user import UserInDB
from app.db.models.client import ClientInDB
from app.core.config import settings

logger = logging.getLogger(__name__)

class Watermark(Flowable):
    """Custom flowable for adding a watermark to the invoice."""
    
    def __init__(self, text, width=200, height=100):
        Flowable.__init__(self)
        self.text = text
        self.width = width
        self.height = height
        
    def draw(self):
        self.canv.saveState()
        self.canv.setFont("Helvetica-Bold", 72)
        self.canv.setFillColor(colors.lightgrey)
        self.canv.setFillAlpha(0.3)  # Transparency
        self.canv.translate(A4[0]/2, A4[1]/2)
        self.canv.rotate(45)
        self.canv.drawCentredString(0, 0, self.text)
        self.canv.restoreState()

class PageNumberFooter(Flowable):
    """Custom flowable for adding page numbers to the invoice."""
    
    def __init__(self, page_size=A4):
        Flowable.__init__(self)
        self.page_size = page_size
        self.width = page_size[0]
        self.height = 20
        
    def draw(self):
        page_num = self.canv.getPageNumber()
        text = f"Seite {page_num}"
        self.canv.saveState()
        self.canv.setFont("Helvetica", 8)
        self.canv.setFillColor(colors.black)
        self.canv.drawRightString(self.page_size[0] - 20, 20, text)
        self.canv.restoreState()

class QRCodeFlowable(Flowable):
    """Custom flowable for adding QR codes to the invoice."""
    
    def __init__(self, data, size=40*mm):
        Flowable.__init__(self)
        self.data = data
        self.size = size
        self.width = size
        self.height = size
        
    def draw(self):
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(self.data)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        img_path = "/tmp/qrcode_temp.png"
        img.save(img_path)
        
        self.canv.drawImage(img_path, 0, 0, self.size, self.size)
        os.remove(img_path)  # Clean up temporary file

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
        self.styles.add(ParagraphStyle(
            name='Footer',
            fontName='Helvetica',
            fontSize=8,
            alignment=TA_CENTER
        ))
        self.styles.add(ParagraphStyle(
            name='RightAlign',
            fontName='Helvetica',
            fontSize=10,
            alignment=TA_RIGHT
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
        try:
            logger.info(f"Generating PDF for invoice {invoice.invoice_number}")
            
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(
                buffer,
                pagesize=A4,
                rightMargin=72,
                leftMargin=72,
                topMargin=72,
                bottomMargin=72,
                title=f"Rechnung {invoice.invoice_number}",
                author=user.company_name or f"{user.first_name} {user.last_name}",
                subject=f"Rechnung für {client.name}"
            )
            
            content = []
            
            if invoice.status == "draft":
                content.append(Watermark("ENTWURF"))
                
            if hasattr(user, 'logo_url') and user.logo_url:
                try:
                    logo_path = user.logo_url
                    if os.path.exists(logo_path):
                        logo = Image(logo_path, width=150, height=70)
                        content.append(logo)
                        content.append(Spacer(1, 12))
                except Exception as e:
                    logger.warning(f"Could not load company logo: {str(e)}")
            
            content.append(Paragraph(f"Rechnung Nr. {invoice.invoice_number}", self.styles['InvoiceTitle']))
            content.append(Spacer(1, 12))
            
            sender_info = [
                [Paragraph("Absender:", self.styles['InvoiceSubtitle']), Paragraph("Empfänger:", self.styles['InvoiceSubtitle'])],
                [
                    Paragraph(f"{user.company_name or f'{user.first_name} {user.last_name}'}", self.styles['InvoiceInfo']),
                    Paragraph(f"{client.name}", self.styles['InvoiceInfo'])
                ]
            ]
            
            if hasattr(user, 'address') and user.address:
                sender_info[1][0] = Paragraph(
                    f"{user.company_name or f'{user.first_name} {user.last_name}'}<br/>"
                    f"{user.address.street}<br/>"
                    f"{user.address.zip} {user.address.city}<br/>"
                    f"{user.address.country}",
                    self.styles['InvoiceInfo']
                )
            
            if hasattr(client, 'address') and client.address:
                sender_info[1][1] = Paragraph(
                    f"{client.name}<br/>"
                    f"{client.address.street}<br/>"
                    f"{client.address.zip} {client.address.city}<br/>"
                    f"{client.address.country}",
                    self.styles['InvoiceInfo']
                )
            
            sender_recipient_table = Table(sender_info, colWidths=[doc.width/2.0]*2)
            sender_recipient_table.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ]))
            content.append(sender_recipient_table)
            content.append(Spacer(1, 24))
            
            invoice_date = invoice.invoice_date.strftime("%d.%m.%Y") if hasattr(invoice, 'invoice_date') else datetime.now().strftime("%d.%m.%Y")
            due_date = invoice.due_date.strftime("%d.%m.%Y") if hasattr(invoice, 'due_date') and invoice.due_date else None
            
            invoice_details = [
                ["Rechnungsdatum:", invoice_date],
                ["Fälligkeitsdatum:", due_date or "14 Tage nach Erhalt"],
            ]
            
            if hasattr(user, 'tax_id') and user.tax_id:
                invoice_details.append(["Steuernummer:", user.tax_id])
            
            if hasattr(user, 'vat_id') and user.vat_id:
                invoice_details.append(["USt-IdNr.:", user.vat_id])
            
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
            
            if hasattr(user, 'bank_details') and user.bank_details:
                payment_info = [
                    [Paragraph("Zahlungsinformationen:", self.styles['InvoiceSubtitle'])],
                    [Paragraph(f"Kontoinhaber: {user.bank_details.account_holder}", self.styles['InvoiceInfo'])],
                    [Paragraph(f"IBAN: {user.bank_details.iban}", self.styles['InvoiceInfo'])],
                ]
                
                if hasattr(user.bank_details, 'bic') and user.bank_details.bic:
                    payment_info.append([Paragraph(f"BIC: {user.bank_details.bic}", self.styles['InvoiceInfo'])])
                
                if hasattr(user.bank_details, 'bank_name') and user.bank_details.bank_name:
                    payment_info.append([Paragraph(f"Bank: {user.bank_details.bank_name}", self.styles['InvoiceInfo'])])
                
                payment_table = Table(payment_info, colWidths=[doc.width])
                payment_table.setStyle(TableStyle([
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('TOPPADDING', (0, 0), (-1, -1), 3),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
                ]))
                content.append(payment_table)
                
                try:
                    qr_data = (
                        f"BCD\n001\n1\nSCT\n{user.bank_details.bic if hasattr(user.bank_details, 'bic') else ''}\n"
                        f"{user.company_name or f'{user.first_name} {user.last_name}'}\n"
                        f"{user.bank_details.iban}\nEUR{invoice.total}\n\n\n"
                        f"Rechnung {invoice.invoice_number}"
                    )
                    
                    qr_table_data = [
                        [QRCodeFlowable(qr_data), 
                         Paragraph("Scannen Sie diesen QR-Code mit Ihrer Banking-App, um die Zahlung zu tätigen.", 
                                  self.styles['InvoiceInfo'])]
                    ]
                    
                    qr_table = Table(qr_table_data, colWidths=[40*mm, doc.width - 40*mm - 10])
                    qr_table.setStyle(TableStyle([
                        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                        ('TOPPADDING', (0, 0), (-1, -1), 10),
                        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
                    ]))
                    
                    content.append(Spacer(1, 12))
                    content.append(qr_table)
                except Exception as e:
                    logger.warning(f"Could not generate payment QR code: {str(e)}")
                
                content.append(Spacer(1, 24))
            
            if hasattr(invoice, 'notes') and invoice.notes:
                content.append(Paragraph("Anmerkungen:", self.styles['InvoiceSubtitle']))
                content.append(Paragraph(invoice.notes, self.styles['InvoiceInfo']))
                content.append(Spacer(1, 24))
            
            legal_text = (
                "Gemäß § 19 UStG enthält der ausgewiesene Betrag keine Umsatzsteuer. "
                "Bitte überweisen Sie den Gesamtbetrag bis zum Fälligkeitsdatum. "
                "Vielen Dank für Ihr Vertrauen."
            )
            
            if hasattr(user, 'is_small_business') and user.is_small_business:
                legal_text = (
                    "Gemäß § 19 UStG enthält der ausgewiesene Betrag keine Umsatzsteuer. "
                    "Bitte überweisen Sie den Gesamtbetrag bis zum Fälligkeitsdatum. "
                    "Vielen Dank für Ihr Vertrauen."
                )
            
            content.append(Paragraph(legal_text, self.styles['Footer']))
            
            content.append(PageNumberFooter())
            
            doc.build(content)
            pdf_bytes = buffer.getvalue()
            buffer.close()
            
            return pdf_bytes
            
        except Exception as e:
            logger.error(f"Error generating PDF for invoice {invoice.invoice_number}: {str(e)}")
            raise
