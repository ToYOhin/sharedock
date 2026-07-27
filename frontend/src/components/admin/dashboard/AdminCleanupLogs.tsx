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
import { TbAlertCircle, TbHistory, TbRefresh } from "react-icons/tb";
import { FormattedMessage } from "react-intl";
import { HoverTip } from "../../core/HoverTip";
import useTranslate from "../../../hooks/useTranslate.hook";
import cleanupLogService from "../../../services/cleanupLog.service";
import { CleanupLog } from "../../../types/cleanupLog.type";
import {
  getCleanupLogDetailsText,
  getCleanupLogStatusColor,
  getCleanupLogTotalDeleted,
} from "../../../utils/cleanupLog.util";

const LOG_DISPLAY_LIMIT = 5;
const countFormatter = new Intl.NumberFormat();

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

const AdminCleanupLogs = () => {
  const t = useTranslate();
  const { classes } = useStyles();
  const [logs, setLogs] = useState<CleanupLog[] | null>();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadLogs = () => {
    setIsRefreshing(true);
    cleanupLogService
      .getCleanupLogs()
      .then(setLogs)
      .catch(() => setLogs(null))
      .finally(() => setIsRefreshing(false));
  };

  useEffect(() => {
    let isMounted = true;

    setIsRefreshing(true);
    cleanupLogService
      .getCleanupLogs()
      .then((cleanupLogs) => {
        if (isMounted) {
          setLogs(cleanupLogs);
        }
      })
      .catch(() => {
        if (isMounted) {
          setLogs(null);
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

  const isLoading = logs === undefined;
  const displayedLogs = useMemo(
    () => logs?.slice(0, LOG_DISPLAY_LIMIT) ?? [],
    [logs],
  );
  const totalDeleted = logs ? getCleanupLogTotalDeleted(logs) : 0;

  const getLogDetails = (log: CleanupLog) => {
    if (log.errorMessage) return log.errorMessage;

    return (
      getCleanupLogDetailsText(log.details) ||
      t("admin.cleanupLogs.details.empty")
    );
  };

  return (
    <Paper className={classes.panel} p="lg" radius={0}>
      <Stack spacing="md">
        <Group className={classes.header} position="apart" spacing="sm">
          <Group className={classes.heading} align="flex-start" noWrap>
            <ThemeIcon className={classes.icon} radius={0} size={42}>
              <TbHistory size={23} />
            </ThemeIcon>
            <Stack spacing={2}>
              <Title order={4}>
                <FormattedMessage id="admin.cleanupLogs.title" />
              </Title>
              <Text size="sm" color="dimmed">
                <FormattedMessage id="admin.cleanupLogs.description" />
              </Text>
            </Stack>
          </Group>
          <Group spacing="xs" noWrap>
            <Badge color="green" variant="light">
              <FormattedMessage id="admin.cleanup.readOnly" />
            </Badge>
            {logs && (
              <Badge color="gray" variant="light">
                {t("admin.cleanupLogs.totalDeleted", {
                  count: countFormatter.format(totalDeleted),
                })}
              </Badge>
            )}
            <HoverTip label={t("admin.cleanupLogs.refresh")}>
              <ActionIcon
                variant="light"
                color="blue"
                loading={isRefreshing}
                onClick={loadLogs}
              >
                <TbRefresh size={18} />
              </ActionIcon>
            </HoverTip>
          </Group>
        </Group>
        <Box className={classes.body}>
          {isLoading ? (
            <Stack spacing="xs">
              {[...Array(3)].map((_, index) => (
                <Skeleton key={index} height={32} radius="sm" />
              ))}
            </Stack>
          ) : logs === null ? (
            <Alert
              color="red"
              icon={<TbAlertCircle size={18} />}
              title={t("admin.cleanupLogs.error.title")}
            >
              <FormattedMessage id="admin.cleanupLogs.error.description" />
            </Alert>
          ) : logs.length === 0 ? (
            <Text size="sm" color="dimmed">
              <FormattedMessage id="admin.cleanupLogs.empty" />
            </Text>
          ) : (
            <Stack spacing="xs">
              <Box className={classes.tableWrap}>
                <Table highlightOnHover verticalSpacing="xs">
                  <thead>
                    <tr>
                      <th>
                        <FormattedMessage id="admin.cleanupLogs.table.job" />
                      </th>
                      <th>
                        <FormattedMessage id="admin.cleanupLogs.table.status" />
                      </th>
                      <th>
                        <FormattedMessage id="admin.cleanupLogs.table.deleted" />
                      </th>
                      <th>
                        <FormattedMessage id="admin.cleanupLogs.table.details" />
                      </th>
                      <th>
                        <FormattedMessage id="admin.cleanupLogs.table.time" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedLogs.map((log) => (
                      <tr key={log.id}>
                        <td>
                          <Text size="sm" weight={500}>
                            {t(`admin.cleanupLogs.job.${log.jobName}`)}
                          </Text>
                        </td>
                        <td>
                          <Badge color={getCleanupLogStatusColor(log.status)}>
                            {t(`admin.cleanupLogs.status.${log.status}`)}
                          </Badge>
                        </td>
                        <td>
                          <Text size="sm">
                            {countFormatter.format(log.deletedCount)}
                          </Text>
                        </td>
                        <td>
                          <Text size="sm" color="dimmed" lineClamp={1}>
                            {getLogDetails(log)}
                          </Text>
                        </td>
                        <td>
                          <Text size="sm">{formatDate(log.createdAt)}</Text>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Box>
              {logs.length > displayedLogs.length && (
                <Text size="xs" color="dimmed">
                  {t("admin.cleanupLogs.more", {
                    shown: countFormatter.format(displayedLogs.length),
                    total: countFormatter.format(logs.length),
                  })}
                </Text>
              )}
            </Stack>
          )}
        </Box>
      </Stack>
    </Paper>
  );
};

export default AdminCleanupLogs;
