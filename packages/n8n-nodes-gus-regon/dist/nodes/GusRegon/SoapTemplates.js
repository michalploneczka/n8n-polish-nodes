"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REPORT_TYPES = exports.URLS = void 0;
exports.zalogujEnvelope = zalogujEnvelope;
exports.wylogujEnvelope = wylogujEnvelope;
exports.daneSzukajPodmiotyEnvelope = daneSzukajPodmiotyEnvelope;
exports.danePobierzPelnyRaportEnvelope = danePobierzPelnyRaportEnvelope;
exports.getValueEnvelope = getValueEnvelope;
const NS = 'http://CIS/BIR/PUBL/2014/07';
const NS_DAT = 'http://CIS/BIR/PUBL/2014/07/DataContract';
const NS_GET_VALUE = 'http://CIS/BIR/2014/07';
exports.URLS = {
    production: 'https://wyszukiwarkaregon.stat.gov.pl/wsBIR/UslugaBIRzewnPubl.svc',
    test: 'https://wyszukiwarkaregontest.stat.gov.pl/wsBIR/UslugaBIRzewnPubl.svc',
};
exports.REPORT_TYPES = {
    legalEntity: 'BIR11OsPrawna',
    legalEntityPkd: 'BIR11OsPrawnaPkd',
    naturalPerson: 'BIR11OsFizycznaDaneOgolne',
    naturalPersonCeidg: 'BIR11OsFizycznaDzialalnoscCeidg',
    naturalPersonPkd: 'BIR11OsFizycznaPkd',
};
function zalogujEnvelope(url, apiKey) {
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
function wylogujEnvelope(url, sid) {
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
function daneSzukajPodmiotyEnvelope(url, params) {
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
function danePobierzPelnyRaportEnvelope(url, regon, reportName) {
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
function getValueEnvelope(url, paramName) {
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
//# sourceMappingURL=SoapTemplates.js.map