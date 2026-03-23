# n8n-nodes-biala-lista-vat

n8n community node for **Biala Lista VAT** (White List of VAT Taxpayers) -- verify Polish VAT taxpayers and bank accounts via the official Ministry of Finance API.

This is a **public API** that requires **no credentials** or registration.

## Operations

### Subject (Search)

| Operation | Description |
|-----------|-------------|
| Search by NIP | Search VAT taxpayer by NIP number |
| Search by NIPs (Batch) | Batch search up to 30 NIP numbers |
| Search by REGON | Search VAT taxpayer by REGON number |
| Search by REGONs (Batch) | Batch search up to 30 REGON numbers |
| Search by Bank Account | Find VAT taxpayer by bank account number |
| Search by Bank Accounts (Batch) | Batch search up to 30 bank account numbers |

### Verification (Check)

| Operation | Description |
|-----------|-------------|
| Check NIP + Bank Account | Verify if a bank account belongs to a NIP holder |
| Check REGON + Bank Account | Verify if a bank account belongs to a REGON holder |

## Important Notes

### Date Parameter

The `date` parameter is **required** on every request (format: `YYYY-MM-DD`). The API returns the taxpayer status as of the specified date.

### Bank Account Format

Bank account numbers must be in **NRB format** -- 26 digits, no spaces, no dashes.

Example: `12345678901234567890123456`

### Batch Operations

Batch operations accept a maximum of **30 comma-separated values** (no spaces between values).

Example: `5213017228,1234567890,9876543210`

### VAT Status Values

The `statusVat` field in responses can have the following values:

| Value | Meaning |
|-------|---------|
| `Czynny` | Active VAT taxpayer |
| `Zwolniony` | Exempt from VAT |
| `Niezarejestrowany` | Not registered for VAT |

### Rate Limits

The API enforces daily rate limits (reset at 00:00 CET):

| Endpoint Type | Daily Limit |
|---------------|-------------|
| Search (`/api/search/...`) | 10 requests/day |
| Check (`/api/check/...`) | 5,000 requests/day |

Use batch operations to maximize efficiency within the search limit.

## Installation

### In n8n (Community Nodes)

1. Go to **Settings > Community Nodes**
2. Select **Install**
3. Enter `n8n-nodes-biala-lista-vat`
4. Agree to the risks and click **Install**

### Manual Installation

```bash
cd ~/.n8n/custom
npm install n8n-nodes-biala-lista-vat
```

Then restart n8n.

## API Documentation

- [Ministry of Finance - API Wykazu Podatnikow VAT](https://www.gov.pl/web/kas/api-wykazu-podatnikow-vat)

## License

[MIT](https://github.com/michalploneczka/n8n-polish-nodes/blob/main/LICENSE)
