import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import InvoicePreview from './components/invoice/InvoicePreview';
import { InvoiceData } from './types/invoice';

// Mock the invoiceService
jest.mock('./services/invoiceService', () => ({
  getPDFUrl: jest.fn((id) => `http://localhost:8000/api/invoices/${id}/pdf`),
  sendEmail: jest.fn().mockResolvedValue({ success: true }),
}));

describe('InvoicePreview Component', () => {
  const mockInvoiceData: InvoiceData = {
    client_id: 'test-client-id',
    date: '2025-05-02',
    inv_number: 'INV-2025-001',
    currency: 'EUR',
    language: 'de',
    items: [
      {
        service: 'Test Service',
        quantity: 3,
        unit_price: 80,
        vat: 0.19,
      },
    ],
  };

  const mockInvoiceId = 'test-invoice-id';

  test('renders invoice data preview correctly', () => {
    render(<InvoicePreview invoiceData={mockInvoiceData} />);
    
    expect(screen.getByText('Test Client')).toBeInTheDocument();
    expect(screen.getByText('Test Service')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('80.00 EUR')).toBeInTheDocument();
    expect(screen.getByText('19%')).toBeInTheDocument();
    expect(screen.getByText('240.00 EUR')).toBeInTheDocument();
  });

  test('renders PDF preview when invoiceId is provided', () => {
    render(<InvoicePreview invoiceId={mockInvoiceId} />);
    
    const iframe = screen.getByTitle('Rechnungsvorschau');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute('src', `http://localhost:8000/api/invoices/${mockInvoiceId}/pdf`);
  });

  test('shows edit form when edit button is clicked', () => {
    render(<InvoicePreview invoiceData={mockInvoiceData} />);
    
    fireEvent.click(screen.getByText('Bearbeiten'));
    
    expect(screen.getByLabelText('Kunde')).toHaveValue('Test Client');
    expect(screen.getByLabelText('Leistung')).toHaveValue('Test Service');
    expect(screen.getByLabelText('Menge')).toHaveValue(3);
    expect(screen.getByLabelText('Einzelpreis')).toHaveValue(80);
    expect(screen.getByLabelText('MwSt. (%)')).toHaveValue(19);
  });

  test('shows email dialog when send button is clicked', () => {
    render(<InvoicePreview invoiceId={mockInvoiceId} />);
    
    fireEvent.click(screen.getByText('Per E-Mail senden'));
    
    expect(screen.getByText('Rechnung per E-Mail senden')).toBeInTheDocument();
    expect(screen.getByLabelText('Empfänger E-Mail')).toBeInTheDocument();
  });

  test('handles email sending correctly', async () => {
    render(<InvoicePreview invoiceId={mockInvoiceId} />);
    
    fireEvent.click(screen.getByText('Per E-Mail senden'));
    
    fireEvent.change(screen.getByLabelText('Empfänger E-Mail'), {
      target: { value: 'test@example.com' },
    });
    
    fireEvent.click(screen.getByText('Senden'));
    
    // Wait for success message
    expect(await screen.findByText('Rechnung wurde erfolgreich per E-Mail versendet')).toBeInTheDocument();
  });
});

