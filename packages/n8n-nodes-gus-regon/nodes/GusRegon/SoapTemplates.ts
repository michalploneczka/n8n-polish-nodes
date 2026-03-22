const NS = 'http://CIS/BIR/PUBL/2014/07';
const NS_DAT = 'http://CIS/BIR/PUBL/2014/07/DataContract';
const NS_GET_VALUE = 'http://CIS/BIR/2014/07';

export const URLS = {
	production:
		'https://wyszukiwarkaregon.stat.gov.pl/wsBIR/UslugaBIRzewnPubl.svc',
	test: 'https://wyszukiwarkaregontest.stat.gov.pl/wsBIR/UslugaBIRzewnPubl.svc',
} as const;

export const REPORT_TYPES = {
	legalEntity: 'PublDaneRaportPrawna',
	legalEntityPkd: 'PublDaneRaportDzialalnosciPrawnej',
	naturalPerson: 'PublDaneRaportFizycznaOsoba',
	naturalPersonCeidg: 'PublDaneRaportDzialalnoscFizycznejCeidg',
	naturalPersonPkd: 'PublDaneRaportDzialalnosciFizycznej',
} as const;

export function zalogujEnvelope(url: string, apiKey: string): string {
	return `<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:ns="${NS}">
  <soap:Header xmlns:wsa="http://www.w3.org/2005/08/addressing">
    <wsa:To>${url}</wsa:To>
    <wsa:Action>${NS}/IUslugaBIRzewnPubl/Zaloguj</wsa:Action>
  </soap:Header>
  <soap:Body>
    <ns:Zaloguj>
      <ns:pKluczUzytkownika>${apiKey}</ns:pKluczUzytkownika>
    </ns:Zaloguj>
  </soap:Body>
</soap:Envelope>`;
}

export function wylogujEnvelope(url: string, sid: string): string {
	return `<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:ns="${NS}">
  <soap:Header xmlns:wsa="http://www.w3.org/2005/08/addressing">
    <wsa:To>${url}</wsa:To>
    <wsa:Action>${NS}/IUslugaBIRzewnPubl/Wyloguj</wsa:Action>
  </soap:Header>
  <soap:Body>
    <ns:Wyloguj>
      <ns:pIdentyfikatorSesji>${sid}</ns:pIdentyfikatorSesji>
    </ns:Wyloguj>
  </soap:Body>
</soap:Envelope>`;
}

export function daneSzukajPodmiotyEnvelope(
	url: string,
	params: { nip?: string; regon?: string; krs?: string },
): string {
	return `<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:ns="${NS}" xmlns:dat="${NS_DAT}">
  <soap:Header xmlns:wsa="http://www.w3.org/2005/08/addressing">
    <wsa:To>${url}</wsa:To>
    <wsa:Action>${NS}/IUslugaBIRzewnPubl/DaneSzukajPodmioty</wsa:Action>
  </soap:Header>
  <soap:Body>
    <ns:DaneSzukajPodmioty>
      <ns:pParametryWyszukiwania>
        ${params.nip ? `<dat:Nip>${params.nip}</dat:Nip>` : ''}
        ${params.regon ? `<dat:Regon>${params.regon}</dat:Regon>` : ''}
        ${params.krs ? `<dat:Krs>${params.krs}</dat:Krs>` : ''}
      </ns:pParametryWyszukiwania>
    </ns:DaneSzukajPodmioty>
  </soap:Body>
</soap:Envelope>`;
}

export function danePobierzPelnyRaportEnvelope(
	url: string,
	regon: string,
	reportName: string,
): string {
	return `<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:ns="${NS}">
  <soap:Header xmlns:wsa="http://www.w3.org/2005/08/addressing">
    <wsa:To>${url}</wsa:To>
    <wsa:Action>${NS}/IUslugaBIRzewnPubl/DanePobierzPelnyRaport</wsa:Action>
  </soap:Header>
  <soap:Body>
    <ns:DanePobierzPelnyRaport>
      <ns:pRegon>${regon}</ns:pRegon>
      <ns:pNazwaRaportu>${reportName}</ns:pNazwaRaportu>
    </ns:DanePobierzPelnyRaport>
  </soap:Body>
</soap:Envelope>`;
}

export function getValueEnvelope(url: string, paramName: string): string {
	return `<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:ns="${NS_GET_VALUE}">
  <soap:Header xmlns:wsa="http://www.w3.org/2005/08/addressing">
    <wsa:To>${url}</wsa:To>
    <wsa:Action>${NS_GET_VALUE}/IUslugaBIR/GetValue</wsa:Action>
  </soap:Header>
  <soap:Body>
    <ns:GetValue>
      <ns:pNazwaParametru>${paramName}</ns:pNazwaParametru>
    </ns:GetValue>
  </soap:Body>
</soap:Envelope>`;
}
