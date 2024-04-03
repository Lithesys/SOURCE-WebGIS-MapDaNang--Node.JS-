import _isFunction from "lodash/isFunction";
import _isArray from "lodash/isArray";
import GML from "ol/format/GML";
import { Buffer } from "buffer";

import { i18n } from "boot/i18n.js";
import {
  Notify
} from "quasar"
const $t = i18n.global.t;
const username = process.env.GEO_SERVER_ADMIN;
const password = process.env.GEO_SERVER_PASSWORD;
const encodedCredentials = Buffer.from(`${username}:${password}`).toString(
  "base64"
);
export const addXML = ({feature, workspace, layer, resolve = () => {}}) => {
  const gml = new GML({
    srsName: "urn:ogc:def:crs:EPSG::5899",
    multiCurve: true,
    multiSurface: true,
    surface: true,
    curve: true,
  });
  const geometryProperties = feature.getProperties();
  delete geometryProperties.geometry;
  const xmlProperties = Object.entries(geometryProperties).reduce((acc, item) => {
    acc =
      acc +
      `<${workspace}:${item[0]}>` +
      item[1] +
      `</${workspace}:${item[0]}>`;
    return acc;
  }, "");

  const geometryNode = new XMLSerializer().serializeToString(
    gml.writeGeometryNode(feature.getGeometry())
  );
  const xmlGeometry = geometryNode
    .replace(/</g, "<gml:")
    .replace(/<gml:\/\s*/g, "</gml:");
  const transactionXML =
    '<wfs:Transaction service="WFS" version="1.1.0"\n' +
    `xmlns:${workspace}="http://www.openplans.org/${workspace}"\n` +
    'xmlns:ogc="http://www.opengis.net/ogc"\n' +
    'xmlns:wfs="http://www.opengis.net/wfs"\n' +
    'xmlns:gml="http://www.opengis.net/gml"\n' +
    'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n' +
    'xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/WFS-transaction.xsd">\n' +
    "<wfs:Insert>\n" +
    `<feature:${layer} xmlns:feature="${workspace}">\n` +
    xmlGeometry +
    xmlProperties +
    // "<${workspace}:tendat>" +
    // "nguyen" +
    // "</${workspace}:tendat>\n" +
    `</feature:${layer}>\n` +
    "</wfs:Insert>\n" +
    "</wfs:Transaction>\n";
  const insertRequestUrl = `${process.env.GEO_SERVER_URL}/${workspace}/wfs`;
  fetch(insertRequestUrl, {
    method: "POST",
    body: transactionXML,
    headers: {
      "Content-Type": "text/xml",
      Authorization: `Basic ${encodedCredentials}`,
    },
  })
    .then(function (response) {
     if (response.status !== 200 || response.status === 400) {
        Notify.create({
          message:  $t("Cannot insert feature!"),
          type: "negative",
        })
      } else {
        Notify.create({
          message:  $t('Insert success!'),
          color: 'primary',
          icon: 'check_circle'
        })
        if(_isFunction(resolve)) resolve()
      }
      return response.text();
    })
    .then(function (responseText) {
      console.log(responseText);  
      // Handle the response
    });
};

export const deleteXML = ({feature, workspace, layer, resolve = () => {}}) => {
  const rid = feature?.getId?.() || null
  const transactionXML =
    '<wfs:Transaction xmlns:wfs="http://www.opengis.net/wfs/2.0" xmlns:fes="http://www.opengis.net/fes/2.0" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/wfs/2.0 http://schemas.opengis.net/wfs/2.0/wfs.xsd">' +
    `<wfs:Delete typeName="feature:${layer}" xmlns:feature="${workspace}">` +
    "<wfs:Filter>" +
    "<fes:Filter>" +
    `<fes:ResourceId rid="${rid}" />` +
    "</fes:Filter>" +
    "</wfs:Filter>" +
    "</wfs:Delete>" +
    "</wfs:Transaction>";
  const insertRequestUrl = `${process.env.GEO_SERVER_URL}/${workspace}/wfs`;
  fetch(insertRequestUrl, {
    method: "POST",
    body: transactionXML,
    headers: {
      "Content-Type": "text/xml",
      Authorization: `Basic ${encodedCredentials}`,
    },
  })
    .then(function (response) {
      if (response.status !== 200 || response.status === 400) {
        Notify.create({
          message:  $t("Cannot delete feature!"),
          type: "negative",
        })
      } else {
        Notify.create({
          message:  $t('Delete success!'),
          color: 'primary',
          icon: 'check_circle'
        })
        if(_isFunction(resolve)) resolve()
      }
      return response.text();
    })
    .then(function (responseText) {
      // Handle the response
    });
};

export const updateXML = ({feature, workspace='danang', layer='bien_utm', resolve = () => {}}) => {
  const rid = feature?.getId?.() || null
  const a = feature.getProperties()
  delete a.geometry
  const xmlProperties = Object.entries(a).reduce((acc, item) => {
    acc =
      acc +
      '<wfs:Property>\n<wfs:ValueReference>' + item[0] + '</wfs:ValueReference>\n' +'<wfs:Value>' + item[1] + '</wfs:Value>\n</wfs:Property>\n';
    return acc;
  }, '');
  const transactionXML =
    '<wfs:Transaction xmlns:wfs="http://www.opengis.net/wfs/2.0" xmlns:fes="http://www.opengis.net/fes/2.0" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/wfs/2.0 http://schemas.opengis.net/wfs/2.0/wfs.xsd">\n' +
    `<wfs:Update typeName="feature:${layer}" xmlns:feature="${workspace}">\n` +
    xmlProperties +
    // '<wfs:Property>\n' +
    // '<wfs:ValueReference>OBJECTID</wfs:ValueReference>' +
    // '<wfs:Value>1</wfs:Value>' +
    // '</wfs:Property>\n' +
    '<fes:Filter>\n' +
    `<fes:ResourceId rid="${rid}" />\n` +
    '</fes:Filter>\n' +
    '</wfs:Update>\n' +
    '</wfs:Transaction>\n';
  const insertRequestUrl = `${process.env.GEO_SERVER_URL}/${workspace}/wfs`;
  fetch(insertRequestUrl, {
    method: "POST",
    body: transactionXML,
    headers: {
      "Content-Type": "text/xml",
      Authorization: `Basic ${encodedCredentials}`,
    },
  })
    .then(function (response) {
      if (response.status !== 200 || response.status === 400) {
        Notify.create({
          message:  $t("Cannot update feature!"),
          type: "negative",
        })
      } else {
        Notify.create({
          message:  $t('Update success!'),
          color: 'primary',
          icon: 'check_circle'
        })
        if(_isFunction(resolve)) resolve()
      }
      return response.text();
    })
    .then(function (responseText) {
      // Handle the response
    });
};
