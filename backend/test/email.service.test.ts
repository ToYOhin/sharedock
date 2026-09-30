import * as assert from "node:assert/strict";
import * as nodemailer from "nodemailer";
import { EmailService } from "../src/email/email.service";

async function main() {
  const values: Record<string, unknown> = {
    "smtp.enabled": true,
    "smtp.host": "smtp.example.test",
    "smtp.port": 465,
    "smtp.username": "fixture-user",
    "smtp.password": "fixture-only",
    "smtp.email": "sender@example.test",
    "smtp.allowUnauthorizedCertificates": false,
    "general.appName": "ShareDock",
    "general.appUrl": "http://127.0.0.1:3000",
    "email.sendHtmlEmails": false,
    "email.resetPasswordSubject": "Reset password",
    "email.resetPasswordMessage": "Reset at {url}",
    "email.verificationSubject": "Verify account",
    "email.verificationMessage": "Verify at {url}",
  };
  const service = new EmailService(
    { get: (key: string) => values[key] } as ConstructorParameters<
      typeof EmailService
    >[0],
    { t: (key: string) => key } as ConstructorParameters<
      typeof EmailService
    >[1],
  );
  const smtp = service.getTransporter();
  const options = smtp.options as nodemailer.TransportOptions & {
    host: string;
    secure: boolean;
    auth: { user: string; pass: string };
    tls: { rejectUnauthorized: boolean };
  };
  assert.equal(options.host, "smtp.example.test");
  assert.equal(options.secure, true);
  assert.equal(options.auth.user, "fixture-user");
  assert.equal(options.tls.rejectUnauthorized, true);
  smtp.close();
  values["smtp.enabled"] = false;
  assert.throws(() => service.getTransporter(), /email.smtpDisabled/);
  values["smtp.enabled"] = true;

  // Compose real MIME messages entirely in memory: no SMTP, DNS or credentials.
  const stream = nodemailer.createTransport({
    streamTransport: true,
    buffer: true,
  });
  const messages: { envelope: { to: string[] }; message: Buffer }[] = [];
  service.getTransporter = () =>
    ({
      sendMail: async (mail: nodemailer.SendMailOptions) => {
        const info = await stream.sendMail(mail);
        assert.ok(Buffer.isBuffer(info.message));
        messages.push({ envelope: info.envelope, message: info.message });
        return info;
      },
    }) as ReturnType<EmailService["getTransporter"]>;
  await service.sendTestMail("receiver@example.test");
  await service.sendResetPasswordEmail(
    "receiver@example.test",
    "fixture-reset",
  );
  values["email.sendHtmlEmails"] = true;
  await service.sendVerificationEmail(
    "receiver@example.test",
    "fixture-verify",
  );
  assert.equal(messages.length, 3);
  for (const info of messages)
    assert.deepEqual(info.envelope.to, ["receiver@example.test"]);
  assert.match(
    messages[1].message.toString(),
    /Reset at http:\/\/127\.0\.0\.1:3000\/auth\/resetPassword\/fixture-reset/,
  );
  assert.match(messages[2].message.toString(), /Content-Type: text\/html/);
  stream.close();
}

main().then(() => console.log("EMAIL_SERVICE_TEST_OK"));
