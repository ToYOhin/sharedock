import {
  ActionIcon,
  Badge,
  Box,
  createStyles,
  Group,
  Skeleton,
  Stack,
  Table,
  Text,
} from "@mantine/core";
import { useModals } from "@mantine/modals";
import { TbCheck, TbEdit, TbTrash } from "react-icons/tb";
import User from "../../../types/user.type";
import showUpdateUserModal from "./showUpdateUserModal";
import { FormattedMessage } from "react-intl";
import useTranslate from "../../../hooks/useTranslate.hook";
import { HoverTip } from "../../core/HoverTip";

const useStyles = createStyles((theme) => ({
  tableWrap: {
    display: "block",
    overflowX: "auto",
    border: `1px solid ${
      theme.colorScheme === "dark" ? theme.colors.dark[4] : theme.colors.gray[2]
    }`,
    borderRadius: 0,
  },

  rowActions: {
    minWidth: 82,
  },
}));

const ManageUserTable = ({
  users,
  getUsers,
  deleteUser,
  isLoading,
}: {
  users: User[];
  getUsers: () => void;
  deleteUser: (user: User) => void;
  isLoading: boolean;
}) => {
  const modals = useModals();
  const t = useTranslate();
  const { classes } = useStyles();

  return (
    <Box className={classes.tableWrap}>
      <Table highlightOnHover verticalSpacing="xs" fontSize="sm">
        <thead>
          <tr>
            <th>
              <FormattedMessage id="admin.users.table.username" />
            </th>
            <th>
              <FormattedMessage id="admin.users.table.email" />
            </th>
            <th>
              <FormattedMessage id="admin.users.table.status" />
            </th>
            <th>
              <FormattedMessage id="admin.users.table.access" />
            </th>
            <th>
              <FormattedMessage id="admin.users.table.source" />
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            skeletonRows
          ) : users.length === 0 ? (
            <tr>
              <td colSpan={6}>
                <Stack align="center" spacing={4} py="xl">
                  <Text weight={600}>
                    <FormattedMessage id="admin.users.empty.title" />
                  </Text>
                  <Text align="center" color="dimmed" size="sm">
                    <FormattedMessage id="admin.users.empty.description" />
                  </Text>
                </Stack>
              </td>
            </tr>
          ) : (
            users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <Text weight={600}>{user.username}</Text>
                  </td>
                  <td>
                    <Text color="dimmed" size="sm">
                      {user.email}
                    </Text>
                  </td>
                  <td>
                    <Badge
                      color={user.isActivated ? "green" : "yellow"}
                      variant="light"
                    >
                      {user.isActivated
                        ? t("admin.users.badge.active")
                        : t("admin.users.badge.pending")}
                    </Badge>
                  </td>
                  <td>
                    <Badge
                      color={user.isAdmin ? "blue" : "gray"}
                      leftSection={user.isAdmin ? <TbCheck size={12} /> : null}
                      variant={user.isAdmin ? "light" : "outline"}
                    >
                      {user.isAdmin
                        ? t("admin.users.badge.admin")
                        : t("admin.users.badge.member")}
                    </Badge>
                  </td>
                  <td>
                    <Badge color={user.isLdap ? "violet" : "gray"} variant="dot">
                      {user.isLdap
                        ? t("admin.users.badge.ldap")
                        : t("admin.users.badge.local")}
                    </Badge>
                  </td>
                  <td>
                    <Group className={classes.rowActions} position="right">
                      {user.isLdap ? null : (
                        <HoverTip label={t("common.button.edit")}>
                          <ActionIcon
                            variant="light"
                            color="blue"
                            size={25}
                            onClick={() =>
                              showUpdateUserModal(modals, user, getUsers)
                            }
                          >
                            <TbEdit />
                          </ActionIcon>
                        </HoverTip>
                      )}
                      <HoverTip label={t("common.button.delete")}>
                        <ActionIcon
                          variant="light"
                          color="red"
                          size={25}
                          onClick={() => deleteUser(user)}
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
  );
};

const skeletonRows = [...Array(10)].map((v, i) => (
  <tr key={i}>
    <td>
      <Skeleton key={i} height={20} />
    </td>
    <td>
      <Skeleton key={i} height={20} />
    </td>
    <td>
      <Skeleton key={i} height={20} />
    </td>
    <td>
      <Skeleton key={i} height={20} />
    </td>
    <td>
      <Skeleton key={i} height={20} />
    </td>
    <td>
      <Skeleton key={i} height={20} />
    </td>
  </tr>
));

export default ManageUserTable;
