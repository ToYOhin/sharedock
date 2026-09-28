import * as assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { LogoService } from "../src/config/logo.service";

async function main() {
  const originalDirectory = process.cwd();
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "sharedock-logo-test-"));
  const backend = path.join(root, "backend");
  const images = path.join(root, "frontend", "public", "img");
  fs.mkdirSync(backend, { recursive: true });
  fs.mkdirSync(images, { recursive: true });

  try {
    process.chdir(backend);
    await new LogoService().createDark(
      Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20"><rect width="40" height="20" fill="red"/></svg>',
      ),
    );

    // Verify real native decoding/resizing and output, not a mocked Sharp import.
    const output = fs.readFileSync(path.join(images, "logo-dark.png"));
    assert.deepEqual(output.subarray(0, 8), Buffer.from("89504e470d0a1a0a", "hex"));
    assert.equal(output.readUInt32BE(16), 900);
    assert.equal(output.readUInt32BE(20), 450);
  } finally {
    process.chdir(originalDirectory);
    fs.rmSync(root, { recursive: true, force: true });
  }
}

main().then(() => console.log("LOGO_SERVICE_TEST_OK"));
