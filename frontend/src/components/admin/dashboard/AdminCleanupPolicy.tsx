import {
  Badge,
  Box,
  createStyles,
  Group,
  Paper,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { TbSettingsAutomation } from "react-icons/tb";
import { FormattedMessage } from "react-intl";
import useTranslate from "../../../hooks/useTranslate.hook";
import {
  CLEANUP_POLICY_ITEMS,
  CleanupPolicyItem,
  hasManualCleanupTrigger,
} from "../../../utils/cleanupPolicy.util";

const getScheduleColor = (schedule: CleanupPolicyItem["schedule"]) => {
  if (schedule === "daily_midnight") return "grape";
  if (schedule === "every_6_hours") return "indigo";
  return "blue";
};

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

  tableWrap: {
    overflowX: "auto",
    border: `1px solid ${
      theme.colorScheme === "dark" ? theme.colors.dark[4] : theme.colors.gray[2]
    }`,
    borderRadius: 0,
  },
}));

const AdminCleanupPolicy = () => {
  const t = useTranslate();
  const { classes } = useStyles();

  return (
    <Paper className={classes.panel} p="lg" radius={0}>
      <Stack spacing="md">
        <Group className={classes.header} position="apart" spacing="sm">
          <Group className={classes.heading} align="flex-start" noWrap>
            <ThemeIcon className={classes.icon} radius={0} size={42}>
              <TbSettingsAutomation size={23} />
            </ThemeIcon>
            <Stack spacing={2}>
              <Title order={4}>
                <FormattedMessage id="admin.cleanupPolicy.title" />
              </Title>
              <Text size="sm" color="dimmed">
                <FormattedMessage id="admin.cleanupPolicy.description" />
              </Text>
            </Stack>
          </Group>
          <Group spacing="xs" noWrap>
            <Badge color="green" variant="light">
              <FormattedMessage id="admin.cleanup.readOnly" />
            </Badge>
            <Badge
              color={hasManualCleanupTrigger() ? "orange" : "gray"}
              variant="light"
            >
              {t(
                hasManualCleanupTrigger()
                  ? "admin.cleanupPolicy.manualTrigger.enabled"
                  : "admin.cleanupPolicy.manualTrigger.disabled",
              )}
            </Badge>
          </Group>
        </Group>
        <Stack spacing="xs">
          <Box className={classes.tableWrap}>
            <Table highlightOnHover verticalSpacing="xs">
              <thead>
                <tr>
                  <th>
                    <FormattedMessage id="admin.cleanupPolicy.table.target" />
                  </th>
                  <th>
                    <FormattedMessage id="admin.cleanupPolicy.table.schedule" />
                  </th>
                  <th>
                    <FormattedMessage id="admin.cleanupPolicy.table.rule" />
                  </th>
                  <th>
                    <FormattedMessage id="admin.cleanupPolicy.table.logging" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {CLEANUP_POLICY_ITEMS.map((item) => (
                  <tr key={item.key}>
                    <td>
                      <Text size="sm" weight={500}>
                        {t(`admin.cleanupPolicy.item.${item.key}.target`)}
                      </Text>
                    </td>
                    <td>
                      <Badge color={getScheduleColor(item.schedule)}>
                        {t(`admin.cleanupPolicy.schedule.${item.schedule}`)}
                      </Badge>
                    </td>
                    <td>
                      <Stack spacing={0}>
                        <Text size="sm">
                          {t(`admin.cleanupPolicy.condition.${item.condition}`)}
                        </Text>
                        <Text size="xs" color="dimmed">
                          {t(
                            `admin.cleanupPolicy.defaultConfig.${item.defaultConfig}`,
                          )}
                        </Text>
                      </Stack>
                    </td>
                    <td>
                      <Text size="sm" color="dimmed">
                        {t(
                          `admin.cleanupPolicy.logBehavior.${item.logBehavior}`,
                        )}
                      </Text>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Box>
          <Text size="xs" color="dimmed">
            <FormattedMessage id="admin.cleanupPolicy.note" />
          </Text>
        </Stack>
      </Stack>
    </Paper>
  );
};

export default AdminCleanupPolicy;
