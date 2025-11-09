# API Examples - Supplier Invoices

## Create Manual Invoice

```json
POST /api/supplier-invoices
Content-Type: application/json

{
  "supplier_id": "550e8400-e29b-41d4-a716-446655440000",
  "project_id": "660e8400-e29b-41d4-a716-446655440000",
  "invoice_number": "LF-2025-001",
  "invoice_date": "2025-01-08",
  "due_date": "2025-02-08",
  "currency": "SEK",
  "exchange_rate": 1.0,
  "items": [
    {
      "item_type": "material",
      "name": "Gipsplattor",
      "description": "12.5mm gipsplattor",
      "quantity": 20,
      "unit": "st",
      "unit_price": 50.00,
      "vat_rate": 25.0,
      "order_index": 1
    },
    {
      "item_type": "labor",
      "name": "Montering",
      "description": "Timmar för montering",
      "quantity": 8,
      "unit": "tim",
      "unit_price": 450.00,
      "vat_rate": 25.0,
      "order_index": 2
    }
  ],
  "notes": "Leverans till byggplats"
}
```

## Upload & OCR

```bash
POST /api/supplier-invoices/upload
Content-Type: multipart/form-data

supplier_id: 550e8400-e29b-41d4-a716-446655440000
project_id: 660e8400-e29b-41d4-a716-446655440000
file: [PDF or image file]
```

## Approve Invoice (Apply Markup)

```json
PATCH /api/supplier-invoices/{id}
Content-Type: application/json

{
  "status": "approved"
}
```

## Record Payment

```json
POST /api/supplier-invoices/{id}/payments
Content-Type: application/json

{
  "amount": 1250.00,
  "paymentDate": "2025-01-10",
  "method": "bankgiro",
  "notes": "Betalning via bankgiro"
}
```

## Convert to Customer Invoice

```bash
POST /api/supplier-invoices/{id}/to-customer-invoice
```

## List Invoices

```bash
GET /api/supplier-invoices?status=approved&projectId=660e8400-e29b-41d4-a716-446655440000&page=1&limit=20
```

## Get Invoice History

```bash
GET /api/supplier-invoices/{id}/history
```

