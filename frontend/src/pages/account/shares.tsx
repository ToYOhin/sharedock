import {
  ActionIcon,
  Box,
  Button,
  Center,
  createStyles,
  Group,
  Paper,
  Select,
  Space,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { useClipboard } from "@mantine/hooks";
import { useModals } from "@mantine/modals";
import moment from "moment";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  TbPlusMinus,
  TbInfoCircle,
  TbLink,
  TbLock,
  TbTrash,
  TbUpload,
} from "react-icons/tb";
import { FormattedMessage } from "react-intl";
import Meta from "../../components/Meta";
import showShareInformationsModal from "../../components/share/showShareInformationsModal";
import showShareLinkModal from "../../components/account/showShareLinkModal";
import { HoverTip } from "../../components/core/HoverTip";
import CenterLoader from "../../components/core/CenterLoader";
import ShareNameCell from "../../components/share/ShareNameCell";
import useConfig from "../../hooks/config.hook";
import useTranslate from "../../hooks/useTranslate.hook";
import shareService from "../../services/share.service";
import { MyShare } from "../../types/share.type";
import toast from "../../utils/toast.util";
import useEditorialPageStyles from "../../styles/editorialPage.style";

const useStyles = createStyles((theme) => ({
  header: {
    marginBottom: theme.spacing.lg,
  },

  emptyPanel: {
    maxWidth: 440,
    textAlign: "center",
  },

  emptyIcon: {
    color:
      theme.colorScheme === "dark"
        ? theme.colors[theme.primaryColor][2]
        : theme.colors[theme.primaryColor][7],
    backgroundColor:
      theme.colorScheme === "dark"
        ? theme.fn.rgba(theme.colors[theme.primaryColor][8], 0.28)
        : theme.colors[theme.primaryColor][0],
  },

  tableWrap: {
    display: "block",
    overflowX: "auto",
    border: `1px solid ${
      theme.colorScheme === "dark" ? theme.colors.dark[4] : theme.colors.gray[2]
    }`,
    borderRadius: 0,
  },
}));

const MyShares = () => {
  const modals = useModals();
  const clipboard = useClipboard();
  const config = useConfig();
  const t = useTranslate();
  const { classes } = useStyles();
  const { classes: editorialClasses } = useEditorialPageStyles();

  const [shares, setShares] = useState<MyShare[]>();
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    shareService.getMyShares().then((shares) => setShares(shares));
  }, []);

  const tagOptions = useMemo(() => {
    const tagsByKey = new Map<string, string>();

    (shares ?? []).forEach((share) => {
      (share.tags ?? []).forEach((tag) => {
        const trimmedTag = tag.trim();
        const tagKey = trimmedTag.toLowerCase();

        if (!trimmedTag || tagsByKey.has(tagKey)) return;

        tagsByKey.set(tagKey, trimmedTag);
      });
    });

    return Array.from(tagsByKey.values())
      .sort((firstTag, secondTag) =>
        firstTag.localeCompare(secondTag, undefined, {
          sensitivity: "base",
        }),
      )
      .map((tag) => ({
        value: tag,
        label: tag,
      }));
  }, [shares]);

  useEffect(() => {
    if (!selectedTag) return;

    const tagStillExists = tagOptions.some(
      (tagOption) =>
        tagOption.value.toLowerCase() === selectedTag.toLowerCase(),
    );

    if (!tagStillExists) {
      setSelectedTag(null);
    }
  }, [selectedTag, tagOptions]);

  const filteredShares = useMemo(() => {
    if (!shares || !selectedTag) return shares ?? [];

    const selectedTagKey = selectedTag.toLowerCase();

    return shares.filter((share) =>
      share.tags?.some((tag) => tag.toLowerCase() === selectedTagKey),
    );
  }, [selectedTag, shares]);

  if (!shares) return <CenterLoader />;

  return (
    <>
      <Meta title={t("account.shares.title")} />
      <Box className={editorialClasses.page}>
      <Group className={editorialClasses.header} position="apart" align="flex-start">
        <Box>
          <Text className={editorialClasses.eyebrow}>Account / shared files</Text>
          <Title className={editorialClasses.title} order={1}>
            <FormattedMessage id="account.shares.title" />
          </Title>
          <Text color="dimmed" size="sm" mt={4}>
            <FormattedMessage id="account.shares.description" />
          </Text>
        </Box>
        <Box className={editorialClasses.headerAside}>
          <Text className={editorialClasses.pageNumber}>02</Text>
          {shares.length > 0 && (
            <Button
              component={Link}
              href="/upload"
              leftIcon={<TbUpload size={16} />}
              variant="light"
            >
              <FormattedMessage id="account.shares.button.create" />
            </Button>
          )}
        </Box>
      </Group>
      {shares.length == 0 ? (
        <Center style={{ minHeight: "48vh" }}>
          <Paper className={classes.emptyPanel} withBorder p="xl" radius={0}>
            <Stack align="center" spacing="sm">
              <ThemeIcon className={classes.emptyIcon} size={48} radius="md">
                <TbUpload size={26} />
              </ThemeIcon>
              <Title order={4}>
                <FormattedMessage id="account.shares.title.empty" />
              </Title>
              <Text color="dimmed" size="sm">
                <FormattedMessage id="account.shares.description.empty" />
              </Text>
              <Space h={4} />
              <Button
                component={Link}
                href="/upload"
                leftIcon={<TbUpload size={16} />}
                variant="light"
              >
                <FormattedMessage id="account.shares.button.create" />
              </Button>
            </Stack>
          </Paper>
        </Center>
      ) : (
        <Stack spacing="sm">
          {tagOptions.length > 0 && (
            <Select
              clearable
              data={tagOptions}
              label={t("account.shares.filters.tag.label")}
              placeholder={t("account.shares.filters.tag.placeholder")}
              value={selectedTag}
              onChange={setSelectedTag}
              sx={{ maxWidth: 260 }}
            />
          )}
          <Box className={classes.tableWrap}>
            <Table highlightOnHover verticalSpacing="xs">
              <thead>
                <tr>
                  <th>
                    <FormattedMessage id="account.shares.table.id" />
                  </th>
                  <th>
                    <FormattedMessage id="account.shares.table.name" />
                  </th>
                  <th>
                    <FormattedMessage id="account.shares.table.visitors" />
                  </th>
                  <th>
                    <FormattedMessage id="account.shares.table.expiresAt" />
                  </th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredShares.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <Text align="center" color="dimmed" py="lg" size="sm">
                        <FormattedMessage id="account.shares.filters.tag.empty" />
                      </Text>
                    </td>
                  </tr>
                ) : (
                  filteredShares.map((share) => (
                    <tr key={share.id}>
                      <td>
                        <Group spacing="xs">
                          {share.id}{" "}
                          {share.security?.passwordProtected && (
                            <TbLock
                              color="orange"
                              title={t(
                                "account.shares.table.password-protected",
                              )}
                            />
                          )}
                        </Group>
                      </td>
                      <td>
                        <ShareNameCell
                          name={share.name}
                          description={share.description}
                          tags={share.tags}
                        />
                      </td>
                      <td>
                        {share.security?.maxViews ? (
                          <FormattedMessage
                            id="account.shares.table.visitor-count"
                            values={{
                              count: share.views,
                              max: share.security.maxViews,
                            }}
                          />
                        ) : (
                          share.views
                        )}
                      </td>
                      <td>
                        {moment(share.expiration).unix() === 0 ? (
                          <FormattedMessage id="account.shares.table.expiry-never" />
                        ) : (
                          moment(share.expiration).format("LLL")
                        )}
                      </td>
                      <td>
                        <Group position="right">
                          <Link href={`/share/${share.id}/edit`}>
                            <HoverTip label={t("account.shares.button.edit")}>
                              <ActionIcon
                                color="orange"
                                variant="light"
                                size={25}
                              >
                                <TbPlusMinus />
                              </ActionIcon>
                            </HoverTip>
                          </Link>
                          <HoverTip label={t("common.button.info")}>
                            <ActionIcon
                              color="blue"
                              variant="light"
                              size={25}
                              onClick={() => {
                                showShareInformationsModal(
                                  modals,
                                  share,
                                  parseInt(config.get("share.maxSize")),
                                  config.get("general.appUrl"),
                                  config.get("general.appUrl", true),
                                  config.get("share.maxExpiration"),
                                  (updatedShare) =>
                                    setShares(
                                      shares.map((item) =>
                                        item.id === updatedShare.id
                                          ? updatedShare
                                          : item,
                                      ),
                                    ),
                                );
                              }}
                            >
                              <TbInfoCircle />
                            </ActionIcon>
                          </HoverTip>
                          <HoverTip label={t("common.button.copy-link")}>
                            <ActionIcon
                              color="victoria"
                              variant="light"
                              size={25}
                              onClick={() => {
                                if (window.isSecureContext) {
                                  clipboard.copy(
                                    `${config.get("general.appUrl") !== config.get("general.appUrl", true) ? config.get("general.appUrl") : window.location.origin}/s/${share.id}`,
                                  );
                                  toast.success(t("common.notify.copied-link"));
                                } else {
                                  showShareLinkModal(
                                    modals,
                                    share.id,
                                    config.get("general.appUrl"),
                                    config.get("general.appUrl", true),
                                  );
                                }
                              }}
                            >
                              <TbLink />
                            </ActionIcon>
                          </HoverTip>
                          <HoverTip label={t("common.button.delete")}>
                            <ActionIcon
                              color="red"
                              variant="light"
                              size={25}
                              onClick={() => {
                                modals.openConfirmModal({
                                  title: t(
                                    "account.shares.modal.delete.title",
                                    {
                                      share: share.id,
                                    },
                                  ),
                                  children: (
                                    <Text size="sm">
                                      <FormattedMessage id="account.shares.modal.delete.description" />
                                    </Text>
                                  ),
                                  confirmProps: {
                                    color: "red",
                                  },
                                  labels: {
                                    confirm: t("common.button.delete"),
                                    cancel: t("common.button.cancel"),
                                  },
                                  onConfirm: () => {
                                    shareService.expire(share.id);
                                    setShares(
                                      shares.filter(
                                        (item) => item.id !== share.id,
                                      ),
                                    );
                                  },
                                });
                              }}
                            >
                              <TbTrash />
                            </ActionIcon>
                          </HoverTip>
                        </Group>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </Box>
        </Stack>
      )}
      </Box>
    </>
  );
};

export default MyShares;
