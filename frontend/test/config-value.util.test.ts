import * as assert from "assert";
import Config from "../src/types/config.type";
import { getConfigValue } from "../src/utils/configValue.util";

const configs: Config[] = [
  {
    key: "feature.enabled",
    value: "true",
    defaultValue: "false",
    type: "boolean",
  },
  {
    key: "share.limit",
    value: "42",
    defaultValue: "5",
    type: "number",
  },
  {
    key: "share.size",
    value: "1024",
    defaultValue: "512",
    type: "filesize",
  },
  {
    key: "general.name",
    value: "ShareDock",
    defaultValue: "FallbackDock",
    type: "string",
  },
  {
    key: "share.expiration",
    value: "7 days",
    defaultValue: "1 day",
    type: "timespan",
  },
  {
    key: "legal.notice",
    value: "",
    defaultValue: "Default notice",
    type: "text",
  },
];

assert.equal(getConfigValue("feature.enabled", configs), true);
assert.equal(getConfigValue("share.limit", configs), 42);
assert.equal(getConfigValue("share.size", configs), 1024);
assert.equal(getConfigValue("general.name", configs), "ShareDock");
assert.deepEqual(getConfigValue("share.expiration", configs), {
  value: 7,
  unit: "days",
});
assert.equal(getConfigValue("legal.notice", configs, true), "Default notice");
assert.equal(getConfigValue("missing.null", null as unknown as Config[]), null);
assert.throws(
  () => getConfigValue("missing.value", configs),
  /Config variable missing.value not found/,
);

console.log("CONFIG_VALUE_UTIL_TEST_OK");
