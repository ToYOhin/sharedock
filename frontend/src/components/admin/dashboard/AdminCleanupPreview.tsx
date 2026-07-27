import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  createStyles,
  Group,
  Paper,
  Skeleton,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import moment from "moment";
import { useEffect, useMemo, useState } from "react";
import { TbAlertCircle, TbDatabaseSearch, TbRefresh } from "react-icons/tb";
import { FormattedMessage } from "react-intl";
import { HoverTip } from "../../core/HoverTip";
import useTranslate from "../../../hooks/useTranslate.hook";
import cleanupPreviewService from "../../../services/cleanupPreview.service";
import {
  CleanupPreview,
  CleanupPreviewCandidate,
} from "../../../types/cleanupPreview.type";
import {
  CleanupPreviewDisplayGroup,
  getCleanupPreviewGroups,
  getCleanupPreviewTotal,
  hasCleanupPreviewWork,
} from "../../../utils/cleanupPreview.util";
import { byteToHumanSizeString } from "../../../utils/fileSize.util";

const countFormatter = new Intl.NumberFormat();
const CANDIDATE_DISPLAY_LIMIT = 3;

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

    [theme.fn.smallerThan("sm")]: {
      flexDirection: "column",
    },
  },

  heading: {
    minWidth: 0,
  },

  icon: {
    flex: "0 0 auto",
    color: theme.white,
    backgroundColor: theme.colors[theme.primaryColor][theme.colorScheme === "dark" ? 8 : 7],
  },

  body: {
    minHeight: 70,
  },

  tableWrap: {
    overflowX: "auto",
    border: `1px solid ${
      theme.colorScheme === "dark" ? theme.colors.dark[4] : theme.colors.gray[2]
    }`,
    borderRadius: 0,
  },
}));

const formatDate = (value: string) => moment(value).format("LLL");

const getCandidateTitle = (candidate: CleanupPreviewCandidate) => {
  if ("relativePath" in candidate) {
    return candidate.relativePath;
  }

  if ("username" in candidate) {
    return candidate.username;
  }

  if ("name" in candidate) {
    return candidate.name || candidate.id;
  }

  return candidate.id;
};

const getCandidateKey = (candidate: CleanupPreviewCandidate) => {
  if ("relativePath" in candidate) {
    return candidate.relativePath;
  }

  return candidate.id;
};

const AdminCleanupPreview = () => {
  const t = useTranslate();
  const { classes } = useStyles();
  const [preview, setPreview] = useState<CleanupPreview | null>();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadPreview = () => {
    setIsRefreshing(true);
    cleanupPreviewService
      .getCleanupPreview()
      .then(setPreview)
      .catch(() => setPreview(null))
      .finally(() => setIsRefreshing(false));
  };

  useEffect(() => {
    let isMounted = true;

    setIsRefreshing(true);
    cleanupPreviewService
      .getCleanupPreview()
      .then((cleanupPreview) => {
        if (isMounted) {
          setPreview(cleanupPreview);
        }
      })
      .catch(() => {
        if (isMounted) {
          setPreview(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsRefreshing(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const groups = useMemo(
    () => (preview ? getCleanupPreviewGroups(preview) : []),
    [preview],
  );
  const isLoading = preview === undefined;
  const total = preview ? getCleanupPreviewTotal(preview) : 0;

  const renderCandidateMeta = (
    candidate: CleanupPreviewCandidate,
    group: CleanupPreviewDisplayGroup,
  ) => {
    if (group.key === "temporaryFiles" && "modifiedAt" in candidate) {
      return `${formatDate(candidate.modifiedAt)} - ${byteToHumanSizeString(
        candidate.size,
      )}`;
    }

    if (group.key === "unactivatedUsers" && "email" in candidate) {
      return `${candidate.email} - ${formatDate(candidate.createdAt)} - ${t(
        "admin.cleanupPreview.candidates.shareCount",
        {
          count: countFormatter.format(candidate.shareCount),
        },
      )}`;
    }

    if (
      group.key === "expiredReverseShares" &&
      "shareExpiration" in candidate
    ) {
      return `${formatDate(candidate.shareExpiration)} - ${t(
        "admin.cleanupPreview.candidates.shareCount",
        { count: countFormatter.format(candidate.shareCount) },
      )} - ${t("admin.cleanupPreview.candidates.remainingUses", {
        count: countFormatter.format(candidate.remainingUses),
      })}`;
    }

    if ("expiration" in candidate) {
      const date =
        group.key === "unfinishedShares"
          ? candidate.updatedAt || candidate.createdAt
          : candidate.expiration;

      return `${formatDate(date)} - ${t(
        "admin.cleanupPreview.candidates.files",
        {
          count: countFormatter.format(candidate.fileCount),
          size: byteToHumanSizeString(candidate.size),
        },
      )}`;
    }

    return candidate.reason;
  };

  const renderGroupCandidates = (group: CleanupPreviewDisplayGroup) => {
    if (group.key === "expiredAuthTokens" && preview) {
      return (
        <Text size="sm" color="dimmed">
          {t("admin.cleanupPreview.candidates.tokens", {
            refreshTokens: countFormatter.format(
              preview.expiredAuthTokens.refreshTokens,
            ),
            loginTokens: countFormatter.format(
              preview.expiredAuthTokens.loginTokens,
            ),
            resetPasswordTokens: countFormatter.format(
              preview.expiredAuthTokens.resetPasswordTokens,
            ),
          })}
        </Text>
      );
    }

    if (group.candidates.length === 0) {
      return (
        <Text size="sm" color="dimmed">
          <FormattedMessage id="admin.cleanupPreview.candidates.empty" />
        </Text>
      );
    }

    const candidates = group.candidates.slice(0, CANDIDATE_DISPLAY_LIMIT);

    return (
      <Stack spacing={4}>
        {candidates.map((candidate) => (
          <Stack spacing={0} key={`${group.key}-${getCandidateKey(candidate)}`}>
            <Text size="sm" weight={500} lineClamp={1}>
              {getCandidateTitle(candidate)}
            </Text>
            <Text size="xs" color="dimmed" lineClamp={1}>
              {renderCandidateMeta(candidate, group)}
            </Text>
          </Stack>
        ))}
        {group.total > candidates.length && (
          <Text size="xs" color="dimmed">
            {t("admin.cleanupPreview.candidates.more", {
              shown: countFormatter.format(candidates.length),
              total: countFormatter.format(group.total),
            })}
          </Text>
        )}
      </Stack>
    );
  };

  return (
    <Paper className={classes.panel} p="lg" radius={0}>
      <Stack spacing="md">
        <Group className={classes.header} position="apart" spacing="sm">
          <Group className={classes.heading} align="flex-start" noWrap>
            <ThemeIcon className={classes.icon} radius={0} size={42}>
              <TbDatabaseSearch size={23} />
            </ThemeIcon>
            <Stack spacing={2}>
              <Title order={4}>
                <FormattedMessage id="admin.cleanupPreview.title" />
              </Title>
              <Text size="sm" color="dimmed">
                <FormattedMessage id="admin.cleanupPreview.description" />
              </Text>
            </Stack>
          </Group>
          <Group spacing="xs" noWrap>
            <Badge color="green" variant="light">
              <FormattedMessage id="admin.cleanup.readOnly" />
            </Badge>
            {preview && (
              <Badge
                color={hasCleanupPreviewWork(preview) ? "orange" : "gray"}
                variant="light"
              >
                {t("admin.cleanupPreview.total", {
                  count: countFormatter.format(total),
                })}
              </Badge>
            )}
            <HoverTip label={t("admin.cleanupPreview.refresh")}>
              <ActionIcon
                variant="light"
                color="blue"
                loading={isRefreshing}
                onClick={loadPreview}
              >
                <TbRefresh size={18} />
              </ActionIcon>
            </HoverTip>
          </Group>
        </Group>
        <Box className={classes.body}>
          {isLoading ? (
            <Stack spacing="xs">
              {[...Array(4)].map((_, index) => (
                <Skeleton key={index} height={32} radius="sm" />
              ))}
            </Stack>
          ) : preview === null ? (
            <Alert
              color="red"
              icon={<TbAlertCircle size={18} />}
              title={t("admin.cleanupPreview.error.title")}
            >
              <FormattedMessage id="admin.cleanupPreview.error.description" />
            </Alert>
          ) : !hasCleanupPreviewWork(preview) ? (
            <Stack spacing={4}>
              <Text size="sm" color="dimmed">
                <FormattedMessage id="admin.cleanupPreview.empty" />
              </Text>
              <Text size="xs" color="dimmed">
                {t("admin.cleanupPreview.generatedAt", {
                  time: formatDate(preview.generatedAt),
                })}
              </Text>
            </Stack>
          ) : (
            <Stack spacing="xs">
              <Text size="xs" color="dimmed">
                {t("admin.cleanupPreview.generatedAt", {
                  time: formatDate(preview.generatedAt),
                })}
              </Text>
              <Box className={classes.tableWrap}>
                <Table highlightOnHover verticalSpacing="xs">
                  <thead>
                    <tr>
                      <th>
                        <FormattedMessage id="admin.cleanupPreview.table.group" />
                      </th>
                      <th>
                        <FormattedMessage id="admin.cleanupPreview.table.count" />
                      </th>
                      <th>
                        <FormattedMessage id="admin.cleanupPreview.table.candidates" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map((group) => (
                      <tr key={group.key}>
                        <td>
                          <Stack spacing={0}>
                            <Text size="sm" weight={500}>
                              {t(`admin.cleanupPreview.group.${group.key}`)}
                            </Text>
                            <Text size="xs" color="dimmed">
                              {t(`admin.cleanupPreview.reason.${group.reason}`)}
                            </Text>
                          </Stack>
                        </td>
                        <td>
                          <Badge color={group.total > 0 ? "orange" : "gray"}>
                            {countFormatter.format(group.total)}
                          </Badge>
                        </td>
                        <td>{renderGroupCandidates(group)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Box>
            </Stack>
          )}
        </Box>
      </Stack>
    </Paper>
  );
};

export default AdminCleanupPreview;
