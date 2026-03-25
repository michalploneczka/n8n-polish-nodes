# n8n-nodes-smsapi

[![npm](https://img.shields.io/npm/v/n8n-nodes-smsapi)](https://www.npmjs.com/package/n8n-nodes-smsapi)

n8n community node for **[SMSAPI.pl](https://www.smsapi.pl)** -- a Polish SMS gateway for sending SMS messages, managing contacts, and checking account balance.

## Operations

| Resource | Operation   | Description                          |
| -------- | ----------- | ------------------------------------ |
| SMS      | Send        | Send an SMS to a phone number        |
| SMS      | Send Group  | Send an SMS to a contact group       |
| SMS      | Get Report  | Get the delivery status of a sent SMS |
| Contact  | List        | List all contacts                    |
| Contact  | Create      | Create a new contact                 |
| Contact  | Update      | Update an existing contact           |
| Contact  | Delete      | Delete a contact                     |
| Group    | List        | List contact groups                  |
| Account  | Get Balance | Get account balance and profile info |

## Credentials

This node uses a **Bearer Token** for authentication.

1. Log in to your [SMSAPI.pl panel](https://ssl.smsapi.pl)
2. Navigate to **API Settings** and generate an API token
3. In n8n, create a new **SMSAPI API** credential
4. Paste the token into the **API Token** field

## Installation

### Community Nodes (recommended)

1. Go to **Settings > Community Nodes** in your n8n instance
2. Select **Install a community node**
3. Enter `n8n-nodes-smsapi` and click **Install**

### Manual installation

```bash
cd ~/.n8n/custom
npm install n8n-nodes-smsapi
```

Restart n8n after installation.

## Usage

1. Add the **SMSAPI** node to your workflow
2. Select a credential with your API token
3. Choose a resource (SMS, Contact, Group, or Account) and an operation
4. Fill in the required fields

### Test Mode

The **Send** and **Send Group** operations support a **Test Mode** toggle in Additional Fields. When enabled, the message is not actually sent and your account is not charged. This is useful for verifying your workflow before going live.

### JSON Format

This node automatically adds `format=json` to all API requests. This ensures consistent JSON responses from SMSAPI endpoints, including legacy ones that would otherwise return a custom text format.

### SMS Send Fields

| Field          | Required | Description                                                    |
| -------------- | -------- | -------------------------------------------------------------- |
| Phone Number   | Yes      | Recipient phone number in format `48XXXXXXXXX`                 |
| Message        | Yes      | SMS text content (max 160 chars for single SMS)                |
| Sender Name    | No       | Registered sender name (max 11 characters)                     |
| Encoding       | No       | Message encoding: Default or UTF-8                             |
| Scheduled Date | No       | Schedule the message for a future date                         |
| Test Mode      | No       | When enabled, does not send and does not charge                |

## Example Workflow

Below is a minimal workflow that sends a test SMS:

```json
{
  "nodes": [
    {
      "parameters": {
        "resource": "sms",
        "operation": "send",
        "to": "48123456789",
        "message": "Hello from n8n!",
        "additionalFields": {
          "test": true
        }
      },
      "name": "Send Test SMS",
      "type": "n8n-nodes-smsapi.smsapi",
      "typeVersion": 1,
      "position": [450, 300]
    }
  ]
}
```

## API Documentation

Full API reference: [https://www.smsapi.pl/docs](https://www.smsapi.pl/docs)

## License

[MIT](https://opensource.org/licenses/MIT)

## Author

[Michal Ploneczka](https://codersgroup.pl) (michal.ploneczka@gmail.com)
