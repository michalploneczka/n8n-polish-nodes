# n8n-nodes-vies

This is an n8n community node for [VIES](https://ec.europa.eu/taxation_customs/vies/) (VAT Information Exchange System) -- the European Commission service for validating EU VAT numbers.

No API key or registration is required. VIES is a free, public service.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Operations

| Resource   | Operation | Description                                              |
|------------|-----------|----------------------------------------------------------|
| VAT Number | Validate  | Validate an EU VAT number and get company name & address |

## Supported Countries

All 27 EU member states plus Northern Ireland:

AT (Austria), BE (Belgium), BG (Bulgaria), CY (Cyprus), CZ (Czech Republic), DE (Germany), DK (Denmark), EE (Estonia), EL (Greece), ES (Spain), FI (Finland), FR (France), HR (Croatia), HU (Hungary), IE (Ireland), IT (Italy), LT (Lithuania), LU (Luxembourg), LV (Latvia), MT (Malta), NL (Netherlands), PL (Poland), PT (Portugal), RO (Romania), SE (Sweden), SI (Slovenia), SK (Slovakia), XI (Northern Ireland).

## No Credentials Required

VIES is a public API provided by the European Commission. No API key, registration, or authentication is needed.

## Response Fields

| Field       | Type    | Description                                          |
|-------------|---------|------------------------------------------------------|
| isValid     | boolean | Whether the VAT number is valid                      |
| name        | string  | Company name (or "---" if invalid/unavailable)       |
| address     | string  | Company address (or "---" if invalid/unavailable)    |
| vatNumber   | string  | The VAT number that was checked                      |
| userError   | string  | Status: VALID, INVALID, or MS_UNAVAILABLE            |

### Note on MS_UNAVAILABLE

Individual country VIES services may be temporarily offline. When this happens, the API returns `userError: "MS_UNAVAILABLE"` and `isValid: false`. This does not mean the VAT number is invalid -- it means the country's service could not be reached. Retry later.

## Installation

### In n8n Desktop / Self-hosted

1. Go to **Settings > Community Nodes**
2. Select **Install a community node**
3. Enter `n8n-nodes-vies`
4. Agree to the risks and click **Install**

### Using npm (for custom setups)

```bash
cd ~/.n8n/custom
npm install n8n-nodes-vies
```

Restart n8n after installation.

## Example Workflow

```json
{
  "nodes": [
    {
      "parameters": {
        "countryCode": "PL",
        "vatNumber": "5213017228"
      },
      "name": "VIES",
      "type": "n8n-nodes-vies.vies",
      "typeVersion": 1,
      "position": [450, 300]
    }
  ]
}
```

## Resources

- [VIES Portal](https://ec.europa.eu/taxation_customs/vies/)
- [VIES REST API](https://ec.europa.eu/taxation_customs/vies/rest-api)
- [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/community-nodes/)

## License

[MIT](https://github.com/michalploneczka/n8n-polish-nodes/blob/main/LICENSE)
