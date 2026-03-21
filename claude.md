# CLAUDE.md — n8n Polish Nodes

## PROJEKT
Zestaw community nodes n8n dla polskich serwisów. Każdy node to osobny npm package.
Monorepo z wieloma node'ami, wspólne tooling, osobne publikacje.

Autor: Michał Płoneczka (codersgroup.pl)
Licencja: MIT
Repozytorium: github.com/michalploneczka/n8n-polish-nodes

## CEL
Stać się standardowym zestawem polskich integracji dla n8n.
Żaden z poniższych serwisów NIE MA dedykowanego n8n community node (stan: marzec 2026).
Zweryfikowano: npm registry, n8n community forum, n8n official integrations list.

## STACK
- TypeScript (strict mode)
- @n8n/node-cli (oficjalne CLI do scaffoldu, buildu, lintu, dev mode)
- Styl: **deklaratywny (low-code)** gdzie możliwe — definiujesz operacje jako config, n8n sam robi HTTP requesty
- Styl: **programmatic (execute method)** tylko gdy API wymaga niestandardowej logiki
- Publikacja: npm z provenance attestation (wymagane od 1 maja 2026)
- CI/CD: GitHub Actions (.github/workflows/publish.yml z oficjalnego starter)
- w /Users/mploneczka/projects/n8nexamples/n8n istnieje oficjalne repo nodow - dodaje jako wzorzec

## STRUKTURA MONOREPO

```
n8n-polish-nodes/
├── README.md                         # Opis projektu, lista node'ów, badges
├── LICENSE                           # MIT
├── .github/
│   └── workflows/
│       └── publish.yml               # Reusable publish workflow
├── packages/
│   ├── n8n-nodes-smsapi/             # NODE #1
│   │   ├── nodes/
│   │   │   └── Smsapi/
│   │   │       ├── Smsapi.node.ts
│   │   │       ├── Smsapi.node.json  # Codex file (metadata)
│   │   │       └── smsapi.svg        # Ikona (60x60 SVG)
│   │   ├── credentials/
│   │   │   └── SmsapiApi.credentials.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   ├── n8n-nodes-fakturownia/        # NODE #2
│   ├── n8n-nodes-inpost/             # NODE #3
│   ├── n8n-nodes-przelewy24/         # NODE #4
│   ├── n8n-nodes-baselinker/         # NODE #5
│   ├── n8n-nodes-shoper/             # NODE #6
│   ├── n8n-nodes-wfirma/             # NODE #7
│   ├── n8n-nodes-ifirma/             # NODE #8
│   ├── n8n-nodes-allegro/            # NODE #9
│   ├── n8n-nodes-ceidg/              # NODE #10
│   └── n8n-nodes-gus-regon/          # NODE #11
└── docs/
    └── PUBLISHING.md                 # Instrukcja publikacji na npm
```

## ABSOLUTNE ZASADY

1. **Każdy node to osobny npm package.** Nazwa: `n8n-nodes-{serwis}`. Keyword: `n8n-community-node-package`.
2. **Styl deklaratywny domyślnie.** Używaj `routing` w `operations` zamiast pisania `execute()`. Przejdź na programmatic tylko gdy API wymaga podpisu, paginacji, lub niestandardowego flow.
3. **Credentials oddzielnie.** Nigdy nie hardcoduj tokenów. Używaj n8n credential types (API Key, OAuth2, Header Auth).
4. **Testy.** Każdy node musi mieć test z mockiem HTTP (nock). Testuj happy path + error handling.
5. **README per node.** Opis, screenshot, example workflow JSON, link do API docs serwisu.
6. **Ikona SVG.** Pobierz oficjalne logo serwisu, konwertuj na SVG 60x60. Kwadratowy aspect ratio.
7. **Linter musi przechodzić.** `npm run lint` bez errorów przed każdym publishem.
8. **Prowenance attestation.** Publish TYLKO przez GitHub Actions, nie ręcznie z CLI.
9. **Obsługa błędów.** Każdy HTTP error z API musi być złapany i zwrócony jako `NodeApiError` z czytelnym komunikatem po angielsku.
10. **Nie łam API rate limitów.** Dodaj retry z exponential backoff gdzie API to dokumentuje.

## KONWENCJE

### package.json (każdy node)
```json
{
  "name": "n8n-nodes-smsapi",
  "version": "1.0.0",
  "description": "n8n community node for SMSAPI.pl - Polish SMS gateway",
  "keywords": ["n8n-community-node-package", "n8n", "smsapi", "sms", "poland", "polish"],
  "license": "MIT",
  "author": {
    "name": "Michał Płoneczka",
    "email": "mp@codersgroup.pl",
    "url": "https://codersgroup.pl"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/michalploneczka/n8n-polish-nodes.git",
    "directory": "packages/n8n-nodes-smsapi"
  },
  "n8n": {
    "n8nNodesApiVersion": 1,
    "credentials": ["dist/credentials/SmsapiApi.credentials.js"],
    "nodes": ["dist/nodes/Smsapi/Smsapi.node.js"]
  }
}
```

### Credentials template
```typescript
import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class SmsapiApi implements ICredentialType {
  name = 'smsapiApi';
  displayName = 'SMSAPI API';
  documentationUrl = 'https://www.smsapi.pl/docs';
  properties: INodeProperties[] = [
    {
      displayName: 'API Token',
      name: 'apiToken',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
      description: 'API token from SMSAPI.pl panel → API Settings',
    },
  ];
}
```

### Node codex file (.node.json)
```json
{
  "node": "n8n-nodes-smsapi.smsapi",
  "nodeVersion": "1.0",
  "codexVersion": "1.0",
  "categories": ["Communication"],
  "subcategories": {
    "Communication": ["SMS"]
  },
  "resources": {
    "primaryDocumentation": [
      { "url": "https://www.smsapi.pl/docs" }
    ]
  }
}
```

---

## NODES — SZCZEGÓŁY (w kolejności priorytetowej)

---

### NODE #1: SMSAPI.pl
**Priorytet:** NAJWYŻSZY — najprostszy API, potwierdzony demand (feature request z 2022 na community.n8n.io)
**Czas:** 1-2 dni
**API docs:** https://www.smsapi.pl/docs
**Auth:** Bearer Token (OAuth token z panelu SMSAPI)
**Base URL:** https://api.smsapi.pl
**SDK:** oficjalne JS SDK istnieje (github.com/smsapi/smsapi-javascript-client) — ale dla n8n node lepiej użyć deklaratywnego stylu z HTTP bezpośrednio
**Styl:** deklaratywny

**Operacje do zaimplementowania:**

| Resource | Operation | Endpoint | Metoda | Opis |
|----------|-----------|----------|--------|------|
| SMS | Send | /sms.do | POST | Wyślij SMS na podany numer |
| SMS | Send Group | /sms.do | POST | Wyślij SMS do grupy kontaktów |
| SMS | Get Report | /sms.do | GET | Sprawdź status wysłanego SMS |
| Contacts | List | /contacts | GET | Lista kontaktów |
| Contacts | Create | /contacts | POST | Dodaj kontakt |
| Contacts | Update | /contacts/{id} | PUT | Zaktualizuj kontakt |
| Contacts | Delete | /contacts/{id} | DELETE | Usuń kontakt |
| Groups | List | /contacts/groups | GET | Lista grup kontaktów |
| Account | Balance | /profile | GET | Sprawdź saldo konta |

**Pola formularza (SMS Send):**
- `to` (string, required) — numer telefonu (format: 48XXXXXXXXX)
- `message` (string, required) — treść SMS (max 160 znaków lub multi-part)
- `from` (string, optional) — nazwa nadawcy (max 11 znaków, musi być zarejestrowana w SMSAPI)
- `encoding` (options: default/utf-8, optional)
- `date` (datetime, optional) — zaplanuj wysyłkę
- `test` (boolean, optional) — tryb testowy (nie wysyła, nie pobiera punktów)

**Uwagi:**
- API zwraca format custom (nie JSON) dla starszych endpointów — trzeba parsować
- Nowsze endpointy (/contacts) zwracają JSON
- Zawsze dodawaj `format=json` do query params żeby wymusić JSON response
- Opt-out: SMS musi zawierać informację STOP — to obowiązek prawny, ale nie wymuszaj tego w node

---

### NODE #2: Fakturownia.pl
**Priorytet:** WYSOKI — duży rynek (100k+ firm), prosty REST API
**Czas:** 2-3 dni
**API docs:** https://app.fakturownia.pl/api
**Auth:** API Token (w URL jako parameter `api_token` LUB w header `Authorization: Token token=XXX`)
**Base URL:** https://{subdomain}.fakturownia.pl/
**Styl:** deklaratywny

**Uwaga auth:** Każdy klient Fakturowni ma swoją subdomenę (np. `mojafirma.fakturownia.pl`). Credentials muszą zawierać DWIE wartości: `apiToken` + `subdomain`.

**Operacje do zaimplementowania:**

| Resource | Operation | Endpoint | Metoda | Opis |
|----------|-----------|----------|--------|------|
| Invoices | List | /invoices.json | GET | Lista faktur (z filtrami: data, status) |
| Invoices | Get | /invoices/{id}.json | GET | Pobierz fakturę |
| Invoices | Create | /invoices.json | POST | Wystaw fakturę |
| Invoices | Update | /invoices/{id}.json | PUT | Zaktualizuj fakturę |
| Invoices | Delete | /invoices/{id}.json | DELETE | Usuń fakturę |
| Invoices | Send by Email | /invoices/{id}/send_by_email.json | POST | Wyślij fakturę mailem do klienta |
| Invoices | Download PDF | /invoices/{id}.pdf | GET | Pobierz PDF faktury |
| Clients | List | /clients.json | GET | Lista klientów |
| Clients | Create | /clients.json | POST | Dodaj klienta |
| Clients | Get | /clients/{id}.json | GET | Pobierz klienta |
| Products | List | /products.json | GET | Lista produktów |
| Products | Create | /products.json | POST | Dodaj produkt |

**Pola faktury (Create Invoice):**
- `kind` (options: vat/proforma/receipt/estimate) — typ dokumentu
- `number` (string, optional) — numer (auto jeśli puste)
- `sell_date` (date) — data sprzedaży
- `issue_date` (date) — data wystawienia
- `payment_to` (date) — termin płatności
- `buyer_name` (string) — nazwa nabywcy
- `buyer_tax_no` (string) — NIP nabywcy
- `positions` (JSON array) — pozycje faktury [{name, quantity, unit_price, tax}]
- `payment_type` (options: transfer/cash/card/blik)

**Uwagi:**
- API paginuje po 25 elementów domyślnie — obsłuż `page` parameter
- PDF download zwraca binary — obsłuż jako binary data w n8n
- Fakturownia ma też webhook'i — rozważ Trigger node (osobny node) w przyszłości

---

### NODE #3: InPost
**Priorytet:** WYSOKI — każdy e-commerce w PL używa InPost
**Czas:** 2-3 dni
**API docs:** https://docs.inpost24.com/ (ShipX API v1)
**Auth:** Bearer Token (z panelu managera InPost)
**Base URL:** https://api-shipx-pl.easypack24.net/v1/
**Styl:** programmatic (wymaga złożonej logiki tworzenia przesyłek)

**Operacje do zaimplementowania:**

| Resource | Operation | Endpoint | Metoda | Opis |
|----------|-----------|----------|--------|------|
| Shipments | Create | /organizations/{org}/shipments | POST | Utwórz przesyłkę |
| Shipments | Get | /shipments/{id} | GET | Pobierz szczegóły przesyłki |
| Shipments | List | /organizations/{org}/shipments | GET | Lista przesyłek |
| Shipments | Get Label | /shipments/{id}/label | GET | Pobierz etykietę (PDF) |
| Shipments | Cancel | /shipments/{id} | DELETE | Anuluj przesyłkę |
| Points | List | /points | GET | Lista punktów (Paczkomaty) |
| Points | Get | /points/{name} | GET | Szczegóły punktu |
| Tracking | Get | /tracking/{tracking_number} | GET | Status przesyłki |

**Pola przesyłki (Create Shipment):**
- `service` (options: inpost_locker_standard/inpost_courier_standard/inpost_courier_express) — typ usługi
- `receiver.name` (string) — imię i nazwisko odbiorcy
- `receiver.phone` (string) — telefon
- `receiver.email` (string) — email
- `custom_attributes.target_point` (string) — kod Paczkomatu (np. "KRA010") — wymagany dla locker
- `parcels[].dimensions.length/width/height` (number, mm)
- `parcels[].weight.amount` (number, kg)
- `parcels[].is_non_standard` (boolean)
- `cod.amount` (number, opcjonalnie) — pobranie
- `insurance.amount` (number, opcjonalnie) — ubezpieczenie

**Uwagi:**
- API wymaga `organization_id` — dodaj do credentials
- Label download: format PDF, A4 lub A6 (parametr `format`)
- API ma rate limit — 100 req/min
- Sandbox/Production: dwa różne base URL — dodaj toggle w credentials

---

### NODE #4: Przelewy24
**Priorytet:** ŚREDNI — potrzebny dla e-commerce workflows
**Czas:** 2-3 dni
**API docs:** https://developers.przelewy24.pl/
**Auth:** Basic Auth (merchantId + CRC key) lub Bearer Token (API key)
**Base URL:** https://secure.przelewy24.pl/api/v1/ (prod), https://sandbox.przelewy24.pl/api/v1/ (test)
**Styl:** programmatic (wymaga weryfikacji podpisu, checksum CRC)

**Operacje do zaimplementowania:**

| Resource | Operation | Endpoint | Metoda | Opis |
|----------|-----------|----------|--------|------|
| Transactions | Register | /transaction/register | POST | Zarejestruj transakcję |
| Transactions | Verify | /transaction/verify | PUT | Zweryfikuj transakcję |
| Transactions | Get by Session | /transaction/by/sessionId/{sid} | GET | Status transakcji |
| Refunds | Create | /transaction/refund | POST | Zwrot pieniędzy |
| Payment Methods | List | /payment/methods | GET | Dostępne metody płatności |
| Account | Test Access | /testAccess | GET | Test połączenia |

**Uwagi:**
- Wymaga obliczenia CRC checksum (SHA384) — programmatic style konieczny
- Sandbox ma inne merchantId/CRC niż produkcja
- Webhook notification (transakcja opłacona) — rozważ Trigger node w przyszłości
- Kwoty w GROSZACH (integer, nie float)

---

### NODE #5: BaseLinker
**Priorytet:** ŚREDNI-WYSOKI — największy hub e-commerce w PL, ale duży API
**Czas:** 5-7 dni (duże API, wiele metod)
**API docs:** https://api.baselinker.com/
**Auth:** API Token (z panelu BaseLinker → Moje konto → API)
**Base URL:** https://api.baselinker.com/connector.php
**Styl:** programmatic (wszystkie requesty to POST z `method` parameter w body)

**UWAGA:** BaseLinker API jest nietypowe — WSZYSTKIE endpointy to POST na jeden URL, z `method` w body:
```
POST https://api.baselinker.com/connector.php
Header: X-BLToken: {token}
Body: method=getOrders&parameters={"date_from": 1234567890}
```

**Operacje do zaimplementowania (V1 — core):**

| Resource | Operation | BL Method | Opis |
|----------|-----------|-----------|------|
| Orders | List | getOrders | Lista zamówień |
| Orders | Get | getOrders (by id) | Szczegóły zamówienia |
| Orders | Update Status | setOrderStatus | Zmień status zamówienia |
| Orders | Add | addOrder | Dodaj zamówienie |
| Products | List | getInventoryProductsList | Lista produktów |
| Products | Get | getInventoryProductsData | Szczegóły produktu |
| Products | Update Stock | updateInventoryProductsStock | Zaktualizuj stan magazynowy |
| Products | Update Price | updateInventoryProductsPrices | Zaktualizuj cenę |
| Shipping | Create Package | createPackage | Utwórz paczkę u kuriera |
| Shipping | Get Label | getOrderPackages | Pobierz etykietę |

**Uwagi:**
- API rate limit: 100 requestów/minuta
- Odpowiedzi zawsze JSON, ale errory mają swój format: `{"status": "ERROR", "error_code": "..."}`
- BaseLinker ma DUŻO metod (60+) — zrób V1 z core (zamówienia + produkty + wysyłka), resztę w V2
- Daty jako Unix timestamp (nie ISO)
- Paginacja: `page` parameter, max 100 elementów per strona

---

### NODE #6: Shoper
**Priorytet:** ŚREDNI
**Czas:** 3-4 dni
**API docs:** https://developers.shoper.pl/
**Auth:** OAuth2 (client_credentials grant)
**Base URL:** https://{shop_domain}/webapi/rest/
**Styl:** programmatic (OAuth2 token refresh)

**Operacje:**
- Products: List, Get, Create, Update, Delete
- Orders: List, Get, Update Status
- Customers: List, Get, Create
- Categories: List, Get
- Stock: Update

**Uwagi:**
- OAuth2 client_credentials — automatyczny token refresh
- Rate limit: 2 req/sec
- Odpowiedzi JSON, paginacja z `limit` + `offset`

---

### NODE #7: wFirma
**Priorytet:** ŚREDNI-NISKI
**Czas:** 2-3 dni
**API docs:** https://doc.wfirma.pl/
**Auth:** Basic Auth (login + password) lub API Key
**Base URL:** https://api2.wfirma.pl/
**Styl:** deklaratywny (ale XML responses — trzeba parsować!)

**Operacje:**
- Invoices: List, Get, Create, Download PDF
- Contractors: List, Get, Create
- Expenses: List, Create
- VAT Declarations: List

**Uwagi:**
- **API zwraca XML, nie JSON!** Musisz parsować XML → JSON w execute method
- Styl programmatic wymagany ze względu na XML
- Istnieje stary npm wrapper (wfirma-api-wrapper, 6 lat) — przydatny jako reference ale nie jako dependency

---

### NODE #8: iFirma
**Priorytet:** NISKI
**Czas:** 2 dni
**API docs:** https://www.ifirma.pl/api
**Auth:** API Key (w header)
**Base URL:** https://www.ifirma.pl/iapi/
**Styl:** programmatic (wymaga HMAC signature per request)

**Operacje:**
- Invoices: List, Create, Get PDF
- Expenses: List, Create
- Contractors: List

**Uwagi:**
- Wymaga HMAC-SHA1 signature dla każdego requestu — programmatic konieczny
- Dość stare API, dokumentacja skromna

---

### NODE #9: Allegro
**Priorytet:** NISKI (ze względu na złożoność, nie na wartość)
**Czas:** 7-10 dni (złożony OAuth2 + duże API)
**API docs:** https://developer.allegro.pl/
**Auth:** OAuth2 Authorization Code (wymaga redirect URI, user consent)
**Base URL:** https://api.allegro.pl/
**Styl:** programmatic

**Operacje (V1):**
- Offers: List My, Get, Update
- Orders: List, Get, Shipment
- Shipping: Get Carriers
- Users: Get Me

**Uwagi:**
- OAuth2 Authorization Code flow — najtrudniejszy auth w n8n
- Rate limits per endpoint (różne!)
- Sandbox: https://api.allegro.pl.allegrosandbox.pl/
- Ogromne API (100+ endpointów) — V1 = minimum viable, resztę w kolejnych wersjach
- Zbuduj OSTATNI — gdy masz doświadczenie z prostszymi node'ami

---

### NODE #10: CEIDG
**Priorytet:** NISKI ale NAJŁATWIEJSZY
**Czas:** 0.5-1 dzień
**API docs:** https://dane.biznes.gov.pl/api
**Auth:** API Key (bezpłatny, rejestracja na dane.biznes.gov.pl)
**Base URL:** https://dane.biznes.gov.pl/api/ceidg/v2/
**Styl:** deklaratywny

**Operacje:**

| Resource | Operation | Endpoint | Metoda | Opis |
|----------|-----------|----------|--------|------|
| Companies | Search by NIP | /firmy?nip={nip} | GET | Wyszukaj firmę po NIP |
| Companies | Search by Name | /firmy?nazwa={name} | GET | Wyszukaj po nazwie |
| Companies | Get | /firmy/{id} | GET | Szczegóły wpisu CEIDG |

**Uwagi:**
- Najprostszy node w całym projekcie — 3 endpointy, JSON, GET only
- Przydatny jako element workflow: "sprawdź czy kontrahent istnieje w CEIDG"
- Dobry kandydat na pierwszy test publikacji npm jeśli chcesz przetestować pipeline

---

### NODE #11: GUS REGON (BIR)
**Priorytet:** NISKI
**Czas:** 2-3 dni
**API docs:** https://api.stat.gov.pl/Home/RegonApi
**Auth:** API Key (bezpłatny)
**Base URL:** https://wyszukiwarkaregon.stat.gov.pl/wsBIR/UslugaBIRzewnWorkaroundService.svc
**Styl:** programmatic — **SOAP API (!)**

**Operacje:**
- Search by NIP/REGON/KRS
- Get full company data
- Get PKD codes

**Uwagi:**
- **SOAP/XML** — najtrudniejszy technicznie ze wszystkich node'ów
- Wymaga budowania XML envelope, parsowania XML response
- Sesja: Zaloguj (DaneZaloguj) → Pobierz dane (DaneSzukajPodmioty) → Wyloguj (DaneWyloguj)
- Zbuduj po CEIDG — jeśli użytkownicy proszą o więcej niż NIP lookup

---

## KOLEJNOŚĆ BUDOWANIA

```
Tydzień 1:  SMSAPI (#1) + CEIDG (#10)    → 2 node'y, publikacja na npm, post na LinkedIn
Tydzień 2:  Fakturownia (#2)               → post "3 polskie n8n nodes w 2 tygodnie"
Tydzień 3:  InPost (#3)                    → kompletny flow: zamówienie→faktura→SMS→paczka
Tydzień 4:  Przelewy24 (#4)               → płatności zamykają ekosystem e-commerce
Tydzień 5-6: BaseLinker (#5)               → hub łączący wszystko (największy node)
Tydzień 7:  Shoper (#6) + wFirma (#7)     → rozszerzenie ekosystemu
Tydzień 8+: iFirma, Allegro, GUS REGON    → na żądanie community
```

## PUBLIKACJA — CHECKLIST PER NODE

1. [ ] `npm run lint` — zero errorów
2. [ ] `npm run build` — kompiluje bez błędów
3. [ ] `npm run dev` — node widoczny w local n8n, działa z prawdziwym API (test account)
4. [ ] README.md — opis, screenshot, example workflow JSON
5. [ ] Ikona SVG — oficjalne logo serwisu, 60x60
6. [ ] `git tag v1.0.0 && git push --tags` — tag triggera GitHub Action
7. [ ] GitHub Action publikuje na npm z provenance
8. [ ] Post na n8n Community Forum: "Community Node: {Serwis} — Polish integration"
9. [ ] Post na LinkedIn: building in public update
10. [ ] Submit do n8n Creator Portal do weryfikacji (verified badge)

## TESTOWANIE

### Konta testowe (do założenia przed rozpoczęciem):
- [ ] SMSAPI.pl — konto testowe (darmowe, bez limitu w trybie test=1)
- [ ] Fakturownia.pl — konto darmowe (trial 30 dni)
- [ ] InPost — sandbox (api-shipx-pl.easypack24.net → sandbox endpoint)
- [ ] Przelewy24 — sandbox (sandbox.przelewy24.pl)
- [ ] BaseLinker — trial 14 dni
- [ ] Shoper — konto demo (demo.myshoper.pl)
- [ ] CEIDG — API key bezpłatny (dane.biznes.gov.pl)

### Test w n8n:
```bash
cd packages/n8n-nodes-smsapi
npm run build
npm link
cd ~/.n8n/custom  # lub utwórz jeśli nie istnieje
npm link n8n-nodes-smsapi
npx n8n start
# Otwórz http://localhost:5678, szukaj "SMSAPI" w nodes panel
```

## METRYKI SUKCESU

### Po 4 tygodniach:
- 4 node'y opublikowane na npm (SMSAPI, CEIDG, Fakturownia, InPost)
- >100 npm downloads łącznie
- Post na n8n Community Forum z >10 odpowiedzi
- >10 GitHub stars

### Po 8 tygodniach:
- 7 node'ów opublikowanych
- >500 npm downloads łącznie
- Minimum 1 verified badge od n8n
- Pierwszy zewnętrzny contributor (PR lub issue)
- Kompletny workflow "Polish e-commerce" jako template do submission

### Po 12 tygodniach:
- 9+ node'ów
- >1000 npm downloads
- Rozpoznawalność jako "ten gość od polskich n8n nodes"
- Pierwszy lead na consulting/freelance z n8n community