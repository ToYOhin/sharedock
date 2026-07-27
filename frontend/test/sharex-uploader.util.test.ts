import * as assert from "node:assert/strict";
import {
  buildShareXCustomUploader,
  getShareXCustomUploaderJson,
  getShareXUploadUrl,
} from "../src/utils/sharexUploader.util";

const appUrl = "https://dock.example.test/";
const token = "sdock_test_token";

const uploader = buildShareXCustomUploader({
  appUrl,
  token,
  tokenName: "Desktop screenshots",
});

assert.deepEqual(uploader, {
  Version: "17.0.0",
  Name: "ShareDock - Desktop screenshots",
  DestinationType: "ImageUploader, FileUploader",
  RequestMethod: "POST",
  RequestURL: "https://dock.example.test/api/integrations/sharex/upload",
  Headers: {
    Authorization: "Bearer sdock_test_token",
  },
  Body: "MultipartFormData",
  FileFormName: "file",
  URL: "{json:url}",
  DeletionURL: "{json:deletionUrl}",
});

assert.equal(
  getShareXUploadUrl(appUrl),
  "https://dock.example.test/api/integrations/sharex/upload",
);
assert.equal(
  JSON.parse(getShareXCustomUploaderJson({ appUrl, token })).Name,
  "ShareDock",
);

console.log("SHAREX_UPLOADER_FRONTEND_UTIL_TEST_OK");
