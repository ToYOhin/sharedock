import "reflect-metadata";
import * as assert from "node:assert/strict";
import * as path from "node:path";
import { Body, Controller, Get, Post } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import {
  HeaderResolver,
  I18n,
  I18nContext,
  I18nModule,
  I18nValidationExceptionFilter,
  I18nValidationPipe,
} from "nestjs-i18n";
import { UserDTO } from "../src/user/dto/user.dto";

const english =
  "Username can only contain letters, numbers, dots and underscores";
const chinese = "用户名只能包含字母、数字、点和下划线";

@Controller()
class TranslationFixtureController {
  @Get("message")
  message(@I18n() context: I18nContext) {
    return {
      message: context.t("validation.usernamePattern"),
      languages: context.service.getSupportedLanguages(),
    };
  }

  @Get("interpolation")
  interpolation(@I18n() context: I18nContext) {
    return context.t("auth.userAlreadyExists", { args: { field: "email" } });
  }

  @Post("validate")
  validate(@Body() user: UserDTO) {
    return { username: user.username };
  }
}

async function main() {
  // Real module, repository JSON assets and existing DTO; no mocked translator,
  // database, external services, filesystem watchers or generated translation types.
  const module = await Test.createTestingModule({
    imports: [
      I18nModule.forRoot({
        fallbackLanguage: "en-US",
        loaderOptions: {
          path: path.join(__dirname, "../src/i18n"),
          watch: false,
        },
        resolvers: [{ use: HeaderResolver, options: ["x-test-language"] }],
      }),
    ],
    controllers: [TranslationFixtureController],
  }).compile();
  const app = module.createNestApplication({ logger: false });
  app.useGlobalPipes(new I18nValidationPipe({ whitelist: true }));
  app.useGlobalFilters(new I18nValidationExceptionFilter());

  try {
    await app.listen(0, "127.0.0.1");
    const baseUrl = await app.getUrl();
    const request = (route: string, language?: string, body?: object) =>
      fetch(`${baseUrl}/${route}`, {
        method: body ? "POST" : "GET",
        headers: {
          ...(language ? { "x-test-language": language } : {}),
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(5000),
      });

    const localized = await request("message", "zh-CN");
    assert.equal(localized.status, 200);
    const translated = await localized.json();
    assert.equal(translated.message, chinese);
    assert.ok(translated.languages.includes("en-US"));
    assert.ok(translated.languages.includes("zh-CN"));

    for (const language of [undefined, "en-US", "xx-YY"]) {
      const response = await request("message", language);
      assert.equal(response.status, 200);
      assert.equal((await response.json()).message, english);
    }

    for (const [language, expected] of [
      ["en-US", "A user with this email already exists"],
      ["zh-CN", "使用此 email 的用户已存在"],
    ]) {
      const response = await request("interpolation", language);
      assert.equal(response.status, 200);
      assert.equal(await response.text(), expected);
    }

    const validUser = {
      username: "safe_name",
      email: "fixture@example.test",
      password: "fixture-password-123",
    };
    const valid = await request("validate", "zh-CN", validUser);
    assert.equal(valid.status, 201);
    assert.deepEqual(await valid.json(), { username: "safe_name" });

    for (const [language, expected] of [
      ["en-US", english],
      ["zh-CN", chinese],
    ]) {
      const response = await request("validate", language, {
        ...validUser,
        username: "invalid#name",
      });
      assert.equal(response.status, 400);
      const rejected = await response.json();
      assert.equal(rejected.statusCode, 400);
      const usernameError = rejected.message.find(
        (error: { property: string }) => error.property === "username",
      );
      assert.equal(usernameError.constraints.matches, expected);
    }
    console.log(
      "I18N_RUNTIME_TEST_OK: real JSON loading, language fallback, interpolation, valid DTO, localized validation",
    );
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
