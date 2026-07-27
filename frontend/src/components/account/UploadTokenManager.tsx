import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  createStyles,
  Divider,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { useForm, yupResolver } from "@mantine/form";
import { useClipboard } from "@mantine/hooks";
import { useModals } from "@mantine/modals";
import moment from "moment";
import { useEffect, useMemo, useState } from "react";
import {
  TbBrandPowershell,
  TbCheck,
  TbClipboard,
  TbCloudUpload,
  TbDownload,
  TbKey,
  TbPlus,
  TbScript,
  TbTerminal2,
  TbTrash,
  TbWebhook,
} from "react-icons/tb";
import { FormattedMessage } from "react-intl";
import * as yup from "yup";
import useTranslate from "../../hooks/useTranslate.hook";
import useConfig from "../../hooks/config.hook";
import uploadTokenService from "../../services/uploadToken.service";
import { CreatedUploadToken, UploadToken } from "../../types/uploadToken.type";
import toast from "../../utils/toast.util";
import {
  getUploadTokenStatus,
  isUploadTokenRevoked,
  sortUploadTokensByCreatedAt,
} from "../../utils/uploadToken.util";
import {
  getCurlUploadCommand,
  getPowerShellUploadCommand,
  getShareXCustomUploaderJson,
} from "../../utils/sharexUploader.util";
import { HoverTip } from "../core/HoverTip";

const createdTokenToMetadata = ({
  token: _token,
  ...metadata
}: CreatedUploadToken): UploadToken => metadata;

const useStyles = createStyles((theme) => ({
  panel: {
    backgroundColor: "transparent",
    border: 0,
    borderTop: `2px solid ${theme.colors[theme.primaryColor][theme.colorScheme === "dark" ? 4 : 6]}`,
    borderRadius: 0,
    boxShadow: "none",
  },

  header: {
    alignItems: "flex-start",
    gap: theme.spacing.md,

    [theme.fn.smallerThan("sm")]: {
      flexDirection: "column",
    },
  },

  heading: {
    minWidth: 0,
  },

  heroIcon: {
    flex: "0 0 auto",
    color: theme.white,
    backgroundColor: theme.colors[theme.primaryColor][theme.colorScheme === "dark" ? 8 : 7],
  },

  automationItem: {
    minHeight: 52,
    padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
    borderRadius: 0,
    borderTop: `1px solid ${theme.colorScheme === "dark" ? theme.colors.dark[4] : "rgba(24, 25, 28, 0.14)"}`,
    backgroundColor: "transparent",
  },

  createRow: {
    alignItems: "flex-start",

    [theme.fn.smallerThan("sm")]: {
      alignItems: "stretch",
      flexDirection: "column",
    },
  },

  createButton: {
    flexShrink: 0,

    [theme.fn.smallerThan("sm")]: {
      width: "100%",
    },
  },

  tableWrap: {
    display: "block",
    overflowX: "auto",
    border: `1px solid ${
      theme.colorScheme === "dark" ? theme.colors.dark[4] : theme.colors.gray[2]
    }`,
    borderRadius: 0,
  },

  tokenPrefix: {
    display: "inline-block",
    padding: "2px 6px",
    borderRadius: 0,
    backgroundColor:
      theme.colorScheme === "dark"
        ? theme.colors.dark[5]
        : theme.colors.gray[1],
  },

  onboarding: {
    padding: theme.spacing.md,
    borderRadius: 0,
    border: `1px solid ${
      theme.colorScheme === "dark"
        ? theme.colors[theme.primaryColor][7]
        : theme.colors[theme.primaryColor][2]
    }`,
    backgroundColor:
      theme.colorScheme === "dark"
        ? theme.fn.rgba(theme.colors[theme.primaryColor][9], 0.16)
        : theme.colors[theme.primaryColor][0],
  },

  codeBlock: {
    maxHeight: 260,
    margin: 0,
    overflow: "auto",
    padding: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    border: `1px solid ${
      theme.colorScheme === "dark" ? theme.colors.dark[4] : theme.colors.gray[3]
    }`,
    backgroundColor:
      theme.colorScheme === "dark" ? theme.colors.dark[7] : theme.white,
    fontFamily: theme.fontFamilyMonospace,
    fontSize: theme.fontSizes.xs,
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
}));

const UploadTokenManager = () => {
  const [tokens, setTokens] = useState<UploadToken[]>();
  const [createdToken, setCreatedToken] = useState<CreatedUploadToken | null>(
    null,
  );
  const [isCreating, setIsCreating] = useState(false);
  const [revokingTokenId, setRevokingTokenId] = useState<string | null>(null);

  const clipboard = useClipboard();
  const modals = useModals();
  const t = useTranslate();
  const config = useConfig();
  const { classes } = useStyles();

  const automationAppUrl =
    (config.get("general.appUrl") as string | null) ||
    (typeof window === "undefined" ? "" : window.location.origin);

  const createTokenForm = useForm({
    initialValues: {
      name: "",
    },
    validate: yupResolver(
      yup.object().shape({
        name: yup.string().max(80, t("common.error.too-long", { length: 80 })),
      }),
    ),
  });

  const refreshTokens = () => {
    uploadTokenService
      .list()
      .then((tokens) => setTokens(tokens))
      .catch(toast.axiosError);
  };

  useEffect(() => {
    refreshTokens();
  }, []);

  const sortedTokens = useMemo(
    () => sortUploadTokensByCreatedAt(tokens ?? []),
    [tokens],
  );

  const activeTokenCount = sortedTokens.filter(
    (token) => !isUploadTokenRevoked(token),
  ).length;
  const revokedTokenCount = sortedTokens.length - activeTokenCount;

  const shareXCustomUploaderJson = useMemo(() => {
    if (!createdToken) return null;

    return getShareXCustomUploaderJson({
      appUrl: automationAppUrl,
      token: createdToken.token,
      tokenName: createdToken.name,
    });
  }, [automationAppUrl, createdToken]);

  const powerShellUploadCommand = useMemo(() => {
    if (!createdToken) return null;

    return getPowerShellUploadCommand({
      appUrl: automationAppUrl,
      token: createdToken.token,
    });
  }, [automationAppUrl, createdToken]);

  const curlUploadCommand = useMemo(() => {
    if (!createdToken) return null;

    return getCurlUploadCommand({
      appUrl: automationAppUrl,
      token: createdToken.token,
    });
  }, [automationAppUrl, createdToken]);

  const copyAutomationValue = (value: string) => {
    clipboard.copy(value);
    toast.success(t("account.uploadTokens.notify.config-copied"));
  };

  const downloadShareXConfig = () => {
    if (!shareXCustomUploaderJson) return;

    const url = URL.createObjectURL(
      new Blob([shareXCustomUploaderJson], { type: "application/json" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "sharedock.sxcu";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const automationEntrypoints = [
    {
      icon: <TbCloudUpload size={18} />,
      title: "account.uploadTokens.entrypoint.sharex.title",
      description: "account.uploadTokens.entrypoint.sharex.description",
    },
    {
      icon: <TbBrandPowershell size={18} />,
      title: "account.uploadTokens.entrypoint.powershell.title",
      description: "account.uploadTokens.entrypoint.powershell.description",
    },
    {
      icon: <TbScript size={18} />,
      title: "account.uploadTokens.entrypoint.scripts.title",
      description: "account.uploadTokens.entrypoint.scripts.description",
    },
  ];

  const revokeToken = (token: UploadToken) => {
    modals.openConfirmModal({
      title: t("account.uploadTokens.modal.revoke.title", {
        token: token.name || token.tokenPrefix,
      }),
      children: (
        <Text size="sm">
          <FormattedMessage id="account.uploadTokens.modal.revoke.description" />
        </Text>
      ),
      labels: {
        confirm: t("account.uploadTokens.button.revoke"),
        cancel: t("common.button.cancel"),
      },
      confirmProps: {
        color: "red",
      },
      onConfirm: () => {
        setRevokingTokenId(token.id);
        uploadTokenService
          .revoke(token.id)
          .then((revokedToken) => {
            setTokens((currentTokens) =>
              currentTokens?.map((currentToken) =>
                currentToken.id === revokedToken.id
                  ? revokedToken
                  : currentToken,
              ),
            );
            toast.success(t("account.uploadTokens.notify.revoke.success"));
          })
          .catch(toast.axiosError)
          .finally(() => setRevokingTokenId(null));
      },
    });
  };

  return (
    <Paper className={classes.panel} p="xl" mt="lg" radius={0}>
      <Group className={classes.header} position="apart" mb="md" noWrap>
        <Group className={classes.heading} align="flex-start" noWrap>
          <ThemeIcon className={classes.heroIcon} radius={0} size={46}>
            <TbWebhook size={25} />
          </ThemeIcon>
          <Box>
            <Title order={5}>
              <FormattedMessage id="account.card.uploadTokens.title" />
            </Title>
            <Text color="dimmed" size="sm" mt={4}>
              <FormattedMessage id="account.card.uploadTokens.description" />
            </Text>
          </Box>
        </Group>
        <Group spacing="xs" noWrap>
          <Badge leftSection={<TbKey size={12} />} variant="light">
            <FormattedMessage id="account.uploadTokens.scope.upload" />
          </Badge>
          <Badge color="green" variant="light">
            {t("account.uploadTokens.stats.active", {
              count: activeTokenCount,
            })}
          </Badge>
          {revokedTokenCount > 0 && (
            <Badge color="gray" variant="light">
              {t("account.uploadTokens.stats.revoked", {
                count: revokedTokenCount,
              })}
            </Badge>
          )}
        </Group>
      </Group>

      <Stack spacing="md">
        <SimpleGrid
          cols={3}
          spacing="sm"
          breakpoints={[{ maxWidth: "sm", cols: 1 }]}
        >
          {automationEntrypoints.map((entrypoint) => (
            <Group
              className={classes.automationItem}
              key={entrypoint.title}
              spacing="sm"
              noWrap
            >
              <ThemeIcon radius="xl" size={30} variant="light">
                {entrypoint.icon}
              </ThemeIcon>
              <Box>
                <Text size="sm" weight={700}>
                  <FormattedMessage id={entrypoint.title} />
                </Text>
                <Text color="dimmed" size="xs">
                  <FormattedMessage id={entrypoint.description} />
                </Text>
              </Box>
            </Group>
          ))}
        </SimpleGrid>

        <Alert
          color="blue"
          icon={<TbKey size={18} />}
          title={t("account.uploadTokens.onboarding.persistent.title")}
          variant="light"
        >
          <Text size="sm">
            <FormattedMessage id="account.uploadTokens.onboarding.persistent.description" />
          </Text>
        </Alert>

        {createdToken && (
          <Alert
            color="green"
            icon={<TbCheck size={18} />}
            title={t("account.uploadTokens.created.title")}
          >
            <Stack spacing="xs">
              <Text size="sm">
                <FormattedMessage id="account.uploadTokens.created.description" />
              </Text>
              <Group align="end" spacing="xs">
                <TextInput
                  readOnly
                  value={createdToken.token}
                  aria-label={t("account.uploadTokens.created.token")}
                  sx={{ flex: "1 1 260px", minWidth: 0 }}
                />
                <Button
                  leftIcon={<TbClipboard size={16} />}
                  variant="light"
                  sx={{ flexShrink: 0 }}
                  onClick={() => {
                    clipboard.copy(createdToken.token);
                    toast.success(t("common.notify.copied"));
                  }}
                >
                  <FormattedMessage id="common.button.copy" />
                </Button>
              </Group>

              <Box className={classes.onboarding}>
                <Stack spacing="sm">
                  <Box>
                    <Text size="sm" weight={700}>
                      <FormattedMessage id="account.uploadTokens.onboarding.title" />
                    </Text>
                    <Text color="dimmed" size="xs" mt={2}>
                      <FormattedMessage id="account.uploadTokens.onboarding.description" />
                    </Text>
                  </Box>

                  <Tabs defaultValue="sharex" variant="outline">
                    <Tabs.List grow>
                      <Tabs.Tab
                        icon={<TbCloudUpload size={14} />}
                        value="sharex"
                      >
                        ShareX
                      </Tabs.Tab>
                      <Tabs.Tab
                        icon={<TbBrandPowershell size={14} />}
                        value="powershell"
                      >
                        PowerShell
                      </Tabs.Tab>
                      <Tabs.Tab icon={<TbScript size={14} />} value="script">
                        <FormattedMessage id="account.uploadTokens.onboarding.script.tab" />
                      </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel pt="sm" value="sharex">
                      <Stack spacing="xs">
                        <Text color="dimmed" size="xs">
                          <FormattedMessage id="account.uploadTokens.onboarding.sharex.description" />
                        </Text>
                        <Text className={classes.codeBlock} component="pre">
                          {shareXCustomUploaderJson}
                        </Text>
                        <Group spacing="xs">
                          <Button
                            leftIcon={<TbClipboard size={16} />}
                            onClick={() =>
                              shareXCustomUploaderJson &&
                              copyAutomationValue(shareXCustomUploaderJson)
                            }
                            size="xs"
                            variant="light"
                          >
                            <FormattedMessage id="account.uploadTokens.button.copy-sharex" />
                          </Button>
                          <Button
                            leftIcon={<TbDownload size={16} />}
                            onClick={downloadShareXConfig}
                            size="xs"
                            variant="light"
                          >
                            <FormattedMessage id="account.uploadTokens.button.download-sharex" />
                          </Button>
                        </Group>
                      </Stack>
                    </Tabs.Panel>

                    <Tabs.Panel pt="sm" value="powershell">
                      <Stack spacing="xs">
                        <Text color="dimmed" size="xs">
                          <FormattedMessage id="account.uploadTokens.onboarding.powershell.description" />
                        </Text>
                        <Text className={classes.codeBlock} component="pre">
                          {powerShellUploadCommand}
                        </Text>
                        <Button
                          leftIcon={<TbClipboard size={16} />}
                          onClick={() =>
                            powerShellUploadCommand &&
                            copyAutomationValue(powerShellUploadCommand)
                          }
                          size="xs"
                          variant="light"
                        >
                          <FormattedMessage id="account.uploadTokens.button.copy-command" />
                        </Button>
                      </Stack>
                    </Tabs.Panel>

                    <Tabs.Panel pt="sm" value="script">
                      <Stack spacing="xs">
                        <Text color="dimmed" size="xs">
                          <FormattedMessage id="account.uploadTokens.onboarding.script.description" />
                        </Text>
                        <Text className={classes.codeBlock} component="pre">
                          {curlUploadCommand}
                        </Text>
                        <Button
                          leftIcon={<TbClipboard size={16} />}
                          onClick={() =>
                            curlUploadCommand &&
                            copyAutomationValue(curlUploadCommand)
                          }
                          size="xs"
                          variant="light"
                        >
                          <FormattedMessage id="account.uploadTokens.button.copy-command" />
                        </Button>
                      </Stack>
                    </Tabs.Panel>
                  </Tabs>
                </Stack>
              </Box>
            </Stack>
          </Alert>
        )}

        <form
          onSubmit={createTokenForm.onSubmit((values) => {
            setIsCreating(true);
            const name = values.name.trim();
            uploadTokenService
              .create({ name: name || undefined })
              .then((token) => {
                setCreatedToken(token);
                setTokens((currentTokens) =>
                  sortUploadTokensByCreatedAt([
                    createdTokenToMetadata(token),
                    ...(currentTokens ?? []),
                  ]),
                );
                createTokenForm.reset();
                toast.success(t("account.uploadTokens.notify.create.success"));
              })
              .catch(toast.axiosError)
              .finally(() => setIsCreating(false));
          })}
        >
          <Divider mb="md" />
          <Group className={classes.createRow}>
            <Box sx={{ flex: "1 1 260px", minWidth: 0 }}>
              <Text weight={700} size="sm">
                <FormattedMessage id="account.uploadTokens.create.title" />
              </Text>
              <Text color="dimmed" size="xs" mb={6}>
                <FormattedMessage id="account.uploadTokens.create.description" />
              </Text>
              <TextInput
                label={t("account.uploadTokens.name.label")}
                placeholder={t("account.uploadTokens.name.placeholder")}
                {...createTokenForm.getInputProps("name")}
              />
            </Box>
            <Button
              className={classes.createButton}
              leftIcon={<TbPlus size={16} />}
              loading={isCreating}
              mt={43}
              type="submit"
            >
              <FormattedMessage id="common.button.create" />
            </Button>
          </Group>
        </form>

        <Box className={classes.tableWrap}>
          <Table highlightOnHover verticalSpacing="xs">
            <thead>
              <tr>
                <th>
                  <FormattedMessage id="account.uploadTokens.table.name" />
                </th>
                <th>
                  <FormattedMessage id="account.uploadTokens.table.token" />
                </th>
                <th>
                  <FormattedMessage id="account.uploadTokens.table.status" />
                </th>
                <th>
                  <FormattedMessage id="account.uploadTokens.table.createdAt" />
                </th>
                <th>
                  <FormattedMessage id="account.uploadTokens.table.lastUsedAt" />
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {!tokens ? (
                <tr>
                  <td colSpan={6}>
                    <Text align="center" color="dimmed" py="lg" size="sm">
                      <FormattedMessage id="account.uploadTokens.loading" />
                    </Text>
                  </td>
                </tr>
              ) : sortedTokens.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <Text align="center" color="dimmed" py="lg" size="sm">
                      <FormattedMessage id="account.uploadTokens.empty" />
                    </Text>
                  </td>
                </tr>
              ) : (
                sortedTokens.map((token) => {
                  const status = getUploadTokenStatus(token);
                  const revoked = isUploadTokenRevoked(token);

                  return (
                    <tr key={token.id}>
                      <td>
                        {token.name || (
                          <Text color="dimmed" size="sm">
                            <FormattedMessage id="account.uploadTokens.name.empty" />
                          </Text>
                        )}
                      </td>
                      <td>
                        <Text
                          className={classes.tokenPrefix}
                          ff="monospace"
                          size="sm"
                        >
                          {token.tokenPrefix}
                        </Text>
                      </td>
                      <td>
                        <Badge color={revoked ? "gray" : "green"}>
                          <FormattedMessage
                            id={`account.uploadTokens.status.${status}`}
                          />
                        </Badge>
                      </td>
                      <td>{moment(token.createdAt).format("LLL")}</td>
                      <td>
                        {token.lastUsedAt ? (
                          moment(token.lastUsedAt).format("LLL")
                        ) : (
                          <Text color="dimmed" size="sm">
                            <FormattedMessage id="account.uploadTokens.lastUsedAt.empty" />
                          </Text>
                        )}
                      </td>
                      <td>
                        <Group position="right">
                          <HoverTip
                            disabled={revoked}
                            label={t("account.uploadTokens.button.revoke")}
                          >
                            <ActionIcon
                              color="red"
                              disabled={revoked}
                              loading={revokingTokenId === token.id}
                              onClick={() => revokeToken(token)}
                              size={25}
                              variant="light"
                            >
                              <TbTrash />
                            </ActionIcon>
                          </HoverTip>
                        </Group>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </Box>
      </Stack>
    </Paper>
  );
};

export default UploadTokenManager;
