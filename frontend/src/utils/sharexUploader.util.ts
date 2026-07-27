export const shareXUploadPath = "/api/integrations/sharex/upload";

export type ShareXCustomUploader = {
  Version: string;
  Name: string;
  DestinationType: string;
  RequestMethod: "POST";
  RequestURL: string;
  Headers: {
    Authorization: string;
  };
  Body: "MultipartFormData";
  FileFormName: "file";
  URL: "{json:url}";
  DeletionURL: "{json:deletionUrl}";
};

type AutomationUploadConfig = {
  appUrl: string;
  token: string;
};

type ShareXUploaderConfig = AutomationUploadConfig & {
  tokenName?: string | null;
};

const trimTrailingSlashes = (value: string) => value.trim().replace(/\/+$/, "");

export const getShareXUploadUrl = (appUrl: string) =>
  `${trimTrailingSlashes(appUrl)}${shareXUploadPath}`;

export const buildShareXCustomUploader = ({
  appUrl,
  token,
  tokenName,
}: ShareXUploaderConfig): ShareXCustomUploader => ({
  // ShareX documents its current `.sxcu` schema with this compatibility version.
  Version: "17.0.0",
  Name: tokenName?.trim() ? `ShareDock - ${tokenName.trim()}` : "ShareDock",
  DestinationType: "ImageUploader, FileUploader",
  RequestMethod: "POST",
  RequestURL: getShareXUploadUrl(appUrl),
  Headers: {
    Authorization: `Bearer ${token}`,
  },
  Body: "MultipartFormData",
  FileFormName: "file",
  URL: "{json:url}",
  DeletionURL: "{json:deletionUrl}",
});

export const getShareXCustomUploaderJson = (config: ShareXUploaderConfig) =>
  JSON.stringify(buildShareXCustomUploader(config), null, 2);

export const getPowerShellUploadCommand = ({
  appUrl,
  token,
}: AutomationUploadConfig) => `$token = "${token}"
$file = "C:\\path\\to\\file.png"

curl.exe -X POST "${getShareXUploadUrl(appUrl)}" \
  -H "Authorization: Bearer $token" \
  -F "file=@$file"`;

export const getCurlUploadCommand = ({
  appUrl,
  token,
}: AutomationUploadConfig) => `curl -X POST "${getShareXUploadUrl(appUrl)}" \\
  -H "Authorization: Bearer ${token}" \\
  -F "file=@./artifact.zip"`;
