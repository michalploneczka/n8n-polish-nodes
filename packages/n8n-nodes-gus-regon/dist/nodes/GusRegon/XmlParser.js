"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unsoapResult = unsoapResult;
exports.parseSearchResponse = parseSearchResponse;
exports.parseReportResponse = parseReportResponse;
const entities_1 = require("entities");
const fast_xml_parser_1 = require("fast-xml-parser");
const parser = new fast_xml_parser_1.XMLParser({ parseTagValue: false });
function unsoapResult(soapXml) {
    const match = /<\S+Result>(.+)<\/\S+Result>/s.exec(soapXml);
    if (!(match === null || match === void 0 ? void 0 : match[1]))
        return '';
    return match[1];
}
function parseSearchResponse(soapXml) {
    var _a;
    const raw = unsoapResult(soapXml);
    if (!raw.trim())
        return [];
    const decoded = (0, entities_1.decodeXML)(raw);
    const parsed = parser.parse(decoded);
    const dane = (_a = parsed === null || parsed === void 0 ? void 0 : parsed.root) === null || _a === void 0 ? void 0 : _a.dane;
    if (!dane)
        return [];
    return Array.isArray(dane) ? dane : [dane];
}
function parseReportResponse(soapXml) {
    var _a;
    const raw = unsoapResult(soapXml);
    if (!raw.trim())
        return {};
    const decoded = (0, entities_1.decodeXML)(raw);
    const parsed = parser.parse(decoded);
    const dane = (_a = parsed === null || parsed === void 0 ? void 0 : parsed.root) === null || _a === void 0 ? void 0 : _a.dane;
    return dane || (parsed === null || parsed === void 0 ? void 0 : parsed.root) || {};
}
//# sourceMappingURL=XmlParser.js.map