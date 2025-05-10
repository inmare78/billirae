"""Test script to generate a mock PDF."""
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.pdfgen import canvas
from io import BytesIO

def generate_mock_pdf():
    """Generate a simple mock PDF for testing."""
    buffer = BytesIO()
    
    # Create the PDF object
    pdf = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=72
    )
    
    # Get styles
    styles = getSampleStyleSheet()
    
    # Create content
    content = []
    
    # Add title
    title_style = styles["Heading1"]
    title_style.alignment = 1  # Center
    content.append(Paragraph("Test Invoice", title_style))
    content.append(Spacer(1, 20))
    
    # Add invoice details
    content.append(Paragraph("Invoice #: INV-2025-001", styles["Normal"]))
    content.append(Paragraph("Date: 2025-05-02", styles["Normal"]))
    content.append(Paragraph("Due Date: 2025-06-01", styles["Normal"]))
    content.append(Spacer(1, 20))
    
    # Add sender and recipient
    content.append(Paragraph("From:", styles["Heading3"]))
    content.append(Paragraph("Test Company GmbH", styles["Normal"]))
    content.append(Paragraph("Teststraße 123, 10115 Berlin", styles["Normal"]))
    content.append(Paragraph("Tax ID: DE123456789", styles["Normal"]))
    content.append(Spacer(1, 20))
    
    content.append(Paragraph("To:", styles["Heading3"]))
    content.append(Paragraph("Test Client GmbH", styles["Normal"]))
    content.append(Paragraph("Kundenstraße 456, 80331 München", styles["Normal"]))
    content.append(Spacer(1, 20))
    
    # Add invoice items
    data = [
        ["Description", "Quantity", "Unit Price", "Tax Rate", "Total"],
        ["Massage", "3", "€80.00", "19%", "€240.00"],
        ["", "", "", "Subtotal:", "€240.00"],
        ["", "", "", "Tax:", "€45.60"],
        ["", "", "", "Total:", "€285.60"]
    ]
    
    table = Table(data, colWidths=[200, 70, 70, 70, 70])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, -3), (-1, -1), 'Helvetica-Bold'),
    ]))
    
    content.append(table)
    content.append(Spacer(1, 20))
    
    # Add notes
    content.append(Paragraph("Notes:", styles["Heading3"]))
    content.append(Paragraph("Vielen Dank für Ihren Auftrag!", styles["Normal"]))
    
    # Build the PDF
    pdf.build(content)
    
    # Get the PDF data
    pdf_data = buffer.getvalue()
    buffer.close()
    
    return pdf_data

if __name__ == "__main__":
    pdf_data = generate_mock_pdf()
    
    # Save PDF to file
    with open("test_pdf_mock.pdf", "wb") as f:
        f.write(pdf_data)
    
    print(f"Mock PDF generated successfully ({len(pdf_data)} bytes)")
