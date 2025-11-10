// app/lib/rot/xml.ts
export interface RotXmlInput {
  orgNumber: string; // företag
  personalIdentityNoDecrypted: string; // "YYYYMMDDXXXX"
  invoiceNumber: string;
  invoiceDate: string; // YYYY-MM-DD
  laborAmountSEK: number;
  deductionAmountSEK: number;
  projectAddress?: string;
}

export function buildSkatteverketXml(input: RotXmlInput): string {
  // Minimal, schemakompatibel stub – anpassa enligt research-XSD
  return `<?xml version="1.0" encoding="UTF-8"?>
<SkatteverketROTAnsokan xmlns="http://skatteverket.se/rot">
  <FöretagOrgNr>${input.orgNumber}</FöretagOrgNr>
  <KundPersonNr>${input.personalIdentityNoDecrypted}</KundPersonNr>
  <Faktura>
    <Nummer>${input.invoiceNumber}</Nummer>
    <Datum>${input.invoiceDate}</Datum>
    <ArbeteBelopp>${input.laborAmountSEK.toFixed(2)}</ArbeteBelopp>
    <BegärtAvdrag>${input.deductionAmountSEK.toFixed(2)}</BegärtAvdrag>
  </Faktura>
  ${input.projectAddress ? `<Adress>${escapeXml(input.projectAddress)}</Adress>` : ''}
</SkatteverketROTAnsokan>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

