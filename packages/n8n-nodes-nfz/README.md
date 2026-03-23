# n8n-nodes-nfz

[![npm](https://img.shields.io/npm/v/n8n-nodes-nfz)](https://www.npmjs.com/package/n8n-nodes-nfz)

n8n community node for the [NFZ Treatment Waiting Times API](https://api.nfz.gov.pl/app-itl-api/) (Informator o Terminach Leczenia).

Search healthcare treatment waiting times, providers, and service dictionaries from NFZ (National Health Fund of Poland). No API key or registration required -- this is a public open data API.

[n8n community nodes docs](https://docs.n8n.io/integrations/community-nodes/)

## Operations

### Queue

| Operation        | Description                                                        |
| ---------------- | ------------------------------------------------------------------ |
| Search           | Search treatment waiting times by case type, province, benefit, locality |
| Get              | Get details of a specific queue entry by ID                        |
| Get Many Places  | Get alternative appointment locations for a queue entry            |

### Benefit (Dictionary)

| Operation | Description                         |
| --------- | ----------------------------------- |
| Search    | Search healthcare benefit/service names |

### Locality (Dictionary)

| Operation | Description            |
| --------- | ---------------------- |
| Search    | Search locality names  |

### Province (Dictionary)

| Operation | Description                        |
| --------- | ---------------------------------- |
| Get All   | List all 16 Polish voivodeships    |

## Credentials

No credentials required. The NFZ API is a public open data service.

## Usage Notes

- **Case Type** is required for Queue Search: Stable (stabilny) or Urgent (pilny)
- **Province** dropdown includes all 16 Polish voivodeships for easy filtering
- Responses follow JSON API format (`data[].attributes` contains the actual data)
- Rate limit: 10 requests per second -- add Wait nodes in loops if needed
- API version 1.3 is used automatically

## Example Workflow

Below is a minimal workflow that searches for orthopedic treatment waiting times in Mazowieckie province:

```json
{
  "nodes": [
    {
      "parameters": {
        "resource": "queue",
        "operation": "search",
        "case": 1,
        "province": "07",
        "benefit": "ortop"
      },
      "name": "NFZ Waiting Times",
      "type": "n8n-nodes-nfz.nfz",
      "typeVersion": 1,
      "position": [450, 300]
    }
  ]
}
```

## Compatibility

- Tested with n8n 1.x
- Requires n8n >= 0.198.0

## Installation

### Community Nodes (recommended)

1. Go to **Settings > Community Nodes** in your n8n instance
2. Select **Install a community node**
3. Enter `n8n-nodes-nfz` and click **Install**

### Manual installation

```bash
cd ~/.n8n/custom
npm install n8n-nodes-nfz
```

Restart n8n after installation.

## Resources

- [NFZ API Documentation](https://api.nfz.gov.pl/app-itl-api/)
- [n8n Community Nodes docs](https://docs.n8n.io/integrations/community-nodes/)
- [NFZ Official Website](https://www.nfz.gov.pl/)

## License

[MIT](https://opensource.org/licenses/MIT)

## Author

[Michal Ploneczka](https://codersgroup.pl) (mp@codersgroup.pl)
