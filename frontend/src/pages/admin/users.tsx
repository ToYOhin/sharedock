import {
  Box,
  Button,
  createStyles,
  Group,
  Paper,
  SimpleGrid,
  Space,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { useModals } from "@mantine/modals";
import { useEffect, useState } from "react";
import { TbPlus, TbUsers } from "react-icons/tb";
import { FormattedMessage } from "react-intl";
import Meta from "../../components/Meta";
import ManageUserTable from "../../components/admin/users/ManageUserTable";
import showCreateUserModal from "../../components/admin/users/showCreateUserModal";
import useConfig from "../../hooks/config.hook";
import useTranslate from "../../hooks/useTranslate.hook";
import userService from "../../services/user.service";
import User from "../../types/user.type";
import toast from "../../utils/toast.util";
import useEditorialPageStyles from "../../styles/editorialPage.style";

const useStyles = createStyles((theme) => ({
  panel: {
    backgroundColor: "transparent",
    borderRadius: 0,
    border: 0,
    borderTop: `2px solid ${theme.colors[theme.primaryColor][theme.colorScheme === "dark" ? 4 : 6]}`,
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

  heroIcon: {
    flex: "0 0 auto",
    color: theme.white,
    backgroundColor: theme.colors[theme.primaryColor][theme.colorScheme === "dark" ? 8 : 7],
    borderRadius: 0,
  },

  metric: {
    borderTop: `2px solid ${theme.colors[theme.primaryColor][theme.colorScheme === "dark" ? 4 : 6]}`,
    borderRadius: 0,
    padding: `${theme.spacing.sm}px 0 0`,
  },
}));

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const config = useConfig();
  const modals = useModals();
  const t = useTranslate();
  const { classes } = useStyles();
  const { classes: editorialClasses } = useEditorialPageStyles();

  const totalUsers = users.length;
  const adminUsers = users.filter((user) => user.isAdmin).length;
  const pendingUsers = users.filter((user) => !user.isActivated).length;
  const localUsers = users.filter((user) => !user.isLdap).length;

  const formatMetric = (value: number) => (isLoading ? "..." : value);

  const getUsers = () => {
    setIsLoading(true);
    userService.list().then((users) => {
      setUsers(users);
      setIsLoading(false);
    });
  };

  const deleteUser = (user: User) => {
    modals.openConfirmModal({
      title: t("admin.users.edit.delete.title", {
        username: user.username,
      }),
      children: (
        <Text size="sm">
          <FormattedMessage id="admin.users.edit.delete.description" />
        </Text>
      ),
      labels: {
        confirm: t("common.button.delete"),
        cancel: t("common.button.cancel"),
      },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        userService
          .remove(user.id)
          .then(() => setUsers(users.filter((v) => v.id != user.id)))
          .catch(toast.axiosError);
      },
    });
  };

  useEffect(() => {
    getUsers();
  }, []);

  return (
    <Box className={editorialClasses.page}>
      <Meta title={t("admin.users.title")} />
      <Box className={editorialClasses.header}>
        <Box>
          <Text className={editorialClasses.eyebrow}>Admin / people</Text>
          <Title className={editorialClasses.title} order={1}>
            <FormattedMessage id="admin.users.title" />
          </Title>
        </Box>
        <Text className={editorialClasses.pageNumber}>03</Text>
      </Box>
      <Paper className={classes.panel} p="lg" radius={0} mb="md">
        <Stack spacing="md">
          <Group className={classes.header} position="apart" spacing="md">
            <Group className={classes.heading} align="flex-start" noWrap>
              <ThemeIcon className={classes.heroIcon} radius={0} size={46}>
                <TbUsers size={24} />
              </ThemeIcon>
              <Stack spacing={2}>
                <Title order={3}>
                  <FormattedMessage id="admin.users.title" />
                </Title>
                <Text color="dimmed" size="sm">
                  <FormattedMessage id="admin.users.description" />
                </Text>
              </Stack>
            </Group>
            <Button
              onClick={() =>
                showCreateUserModal(
                  modals,
                  config.get("smtp.enabled"),
                  getUsers,
                )
              }
              leftIcon={<TbPlus size={20} />}
            >
              <FormattedMessage id="admin.users.action.create" />
            </Button>
          </Group>
          <SimpleGrid
            cols={4}
            spacing="sm"
            breakpoints={[
              { maxWidth: "md", cols: 2 },
              { maxWidth: "xs", cols: 1 },
            ]}
          >
            <Box className={classes.metric}>
              <Text size="xs" color="dimmed" transform="uppercase">
                <FormattedMessage id="admin.users.stat.total" />
              </Text>
              <Text size="lg" weight={700}>
                {formatMetric(totalUsers)}
              </Text>
            </Box>
            <Box className={classes.metric}>
              <Text size="xs" color="dimmed" transform="uppercase">
                <FormattedMessage id="admin.users.stat.admins" />
              </Text>
              <Text size="lg" weight={700}>
                {formatMetric(adminUsers)}
              </Text>
            </Box>
            <Box className={classes.metric}>
              <Text size="xs" color="dimmed" transform="uppercase">
                <FormattedMessage id="admin.users.stat.local" />
              </Text>
              <Text size="lg" weight={700}>
                {formatMetric(localUsers)}
              </Text>
            </Box>
            <Box className={classes.metric}>
              <Text size="xs" color="dimmed" transform="uppercase">
                <FormattedMessage id="admin.users.stat.pending" />
              </Text>
              <Text size="lg" weight={700}>
                {formatMetric(pendingUsers)}
              </Text>
            </Box>
          </SimpleGrid>
        </Stack>
      </Paper>

      <ManageUserTable
        users={users}
        getUsers={getUsers}
        deleteUser={deleteUser}
        isLoading={isLoading}
      />
      <Space h="xl" />
    </Box>
  );
};

export default Users;
