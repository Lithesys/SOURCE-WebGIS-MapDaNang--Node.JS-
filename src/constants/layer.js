import { i18n } from "boot/i18n.js";
const $t = i18n.global.t;

export const MAP_LAYERS = Object.freeze({
  ID: 'id',
  DESCRIPTION: 'description',
  locationId: 'locationId',
  name: 'name',
  url: 'url',
})

export const CQL_OPERATORS = Object.freeze([
  {
    name: $t("EQUALS"),
    function: (key, val) => `${key}='${val}'`,
  },
  {
    name: $t("NOT EQUALS"),
    function: (key, val) => `${key}!='${val}'`
  },
  {
    name: $t("GREATER THAN"),
    function: (key, val) => `${key} > '${val}'`
  },
  {
    name: $t("GREATER THAN EQUALS"),
    function: (key, val) => `${key} >= '${val}'`
  },
  {
    name: $t("LESS THAN"),
    function: (key, val) => `${key} < '${val}'`
  },
  {
    name: $t("LESS THAN EQUALS"),
    function: (key, val) => `${key} <= '${val}'`
  },
  {
    name: $t("ILIKE"),
    function: (key, val) => {
      try {
        var replacedStr = val.replace(/[^\x00-\x7F]/g, '%');
        return `${key} LIKE '%${replacedStr}%'`
      } catch {
        return `${key} LIKE '%${val}%'`
      }
    }
  },
])
