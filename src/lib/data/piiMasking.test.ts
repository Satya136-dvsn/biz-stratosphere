import { describe, it, expect } from 'vitest';
import { maskEmail, maskPhone, maskRowPII, maskRowsPII, maskPIIText } from './piiMasking';

describe('PII Masking Module', () => {
  it('masks emails to standard d***@***.com format', () => {
    expect(maskEmail('david.miller@northstarlogistics.com')).toBe('d***@***.com');
    expect(maskEmail('sarah.connor@cascadeglobal.com')).toBe('s***@***.com');
    expect(maskEmail('marcus.vance@orbitsystems.io')).toBe('m***@***.io');
    expect(maskEmail('dr.patel@meridianhealth.org')).toBe('d***@***.org');
    expect(maskEmail('alex.chen@vanguarddynamics.co')).toBe('a***@***.co');
  });

  it('masks phone numbers to standard +1-***-***-8841 format', () => {
    expect(maskPhone('+1-555-234-8841')).toBe('+1-***-***-8841');
    expect(maskPhone('+1-555-891-4432')).toBe('+1-***-***-4432');
    expect(maskPhone('555-234-8841')).toBe('+1-***-***-8841');
    expect(maskPhone('(555) 234-8841')).toBe('+1-***-***-8841');
  });

  it('masks PII in arbitrary text', () => {
    const raw = 'Reach David at david.miller@northstarlogistics.com or +1-555-234-8841.';
    const masked = maskPIIText(raw);
    expect(masked).toContain('d***@***.com');
    expect(masked).toContain('+1-***-***-8841');
  });

  it('masks row object PII correctly using maskRowPII', () => {
    const row = {
      customer_id: 'CUST-1001',
      account_name: 'Northstar Logistics',
      contact_email: 'david.miller@northstarlogistics.com',
      contact_phone: '+1-555-234-8841',
      mrr: 48200,
    };
    const masked = maskRowPII(row);
    expect(masked.contact_email).toBe('d***@***.com');
    expect(masked.contact_phone).toBe('+1-***-***-8841');
    expect(masked.account_name).toBe('Northstar Logistics');
    expect(masked.mrr).toBe(48200);
  });

  it('masks an array of rows using maskRowsPII', () => {
    const rows = [
      { contact_email: 'sarah.connor@cascadeglobal.com', contact_phone: '+1-555-891-4432' },
      { contact_email: 'alex.chen@vanguarddynamics.co', contact_phone: '+1-555-908-1122' },
    ];
    const masked = maskRowsPII(rows);
    expect(masked[0].contact_email).toBe('s***@***.com');
    expect(masked[0].contact_phone).toBe('+1-***-***-4432');
    expect(masked[1].contact_email).toBe('a***@***.co');
    expect(masked[1].contact_phone).toBe('+1-***-***-1122');
  });
});
