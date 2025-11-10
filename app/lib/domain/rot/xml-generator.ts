// app/lib/domain/rot/xml-generator.ts
import type { RotApplication } from './types';
import { XmlGenerationError } from './errors';
import { decryptPersonnummer } from './validation';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('RotXmlGenerator');

/**
 * Generate Skatteverket XML for ROT/RUT application
 * Format: Skatteverket's XML schema for ROT/RUT submissions
 */
export function generateSkatteverketXml(application: RotApplication): string {
  logger.info('Generating Skatteverket XML', { applicationId: application.id });

  try {
    // Decrypt personnummer for XML (only in memory, never logged)
    const personnummer = decryptPersonnummer(application.customer_personnummer);

    // Format dates
    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    // Build XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<RotRutAnsökan xmlns="http://www.skatteverket.se/rotrutansokan">
  <Ansökan>
    <AnsökanId>${application.id}</AnsökanId>
    <Arbetstyp>${mapWorkTypeToSkatteverket(application.work_type)}</Arbetstyp>
    
    <!-- Property Information -->
    <Fastighet>
      <Fastighetsbeteckning>${escapeXml(application.property_designation)}</Fastighetsbeteckning>
      ${application.apartment_number ? `<Lägenhetsnummer>${escapeXml(application.apartment_number)}</Lägenhetsnummer>` : ''}
    </Fastighet>
    
    <!-- Customer Information -->
    <Köpare>
      <Personnummer>${personnummer}</Personnummer>
      <Namn>${escapeXml(application.customer_name)}</Namn>
      <Adress>
        <Gatuadress>${escapeXml(application.customer_address)}</Gatuadress>
        <Postnummer>${application.customer_postal_code}</Postnummer>
        <Ort>${escapeXml(application.customer_city)}</Ort>
      </Adress>
    </Köpare>
    
    <!-- Work Details -->
    <Arbete>
      <Startdatum>${formatDate(application.work_start_date)}</Startdatum>
      <Slutdatum>${formatDate(application.work_end_date)}</Slutdatum>
      <Fakturadatum>${formatDate(application.invoice_date)}</Fakturadatum>
    </Arbete>
    
    <!-- Financial Details -->
    <Belopp>
      <Arbetskostnad>${application.labor_cost}</Arbetskostnad>
      <Materialkostnad>${application.material_cost}</Materialkostnad>
      <TotaltBelopp>${application.total_amount}</TotaltBelopp>
      <AvdragsgilltBelopp>${application.deductible_amount}</AvdragsgilltBelopp>
      <Avdragsprocent>${application.deduction_percentage}</Avdragsprocent>
    </Belopp>
    
    <!-- Invoice Reference -->
    <Faktura>
      <Fakturanummer>${application.invoice_id}</Fakturanummer>
    </Faktura>
  </Ansökan>
</RotRutAnsökan>`;

    logger.info('XML generated successfully', { applicationId: application.id });
    return xml;
  } catch (error) {
    logger.error('XML generation failed', error, { applicationId: application.id });
    throw new XmlGenerationError(
      error instanceof Error ? error.message : 'Unknown error',
      { applicationId: application.id }
    );
  }
}

/**
 * Map internal work type to Skatteverket format
 */
function mapWorkTypeToSkatteverket(workType: string): string {
  const mapping: Record<string, string> = {
    rot_repair: 'Reparation',
    rot_maintenance: 'Underhåll',
    rot_improvement: 'Ombyggnad',
    rut_cleaning: 'Städning',
    rut_gardening: 'Trädgårdsarbete',
  };

  return mapping[workType] || workType;
}

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Validate XML against schema (optional)
 */
export function validateXml(xml: string): boolean {
  // TODO: Implement XML schema validation
  // For now, just check if it's valid XML
  try {
    // Simple validation - can be extended with proper schema validation
    return xml.includes('<?xml') && xml.includes('</RotRutAnsökan>');
  } catch {
    return false;
  }
}

