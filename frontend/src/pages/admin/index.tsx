import {
  Box,
  Center,
  Col,
  createStyles,
  Grid,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import Link from "next/link";
import { useEffect, useState } from "react";
import { TbLink, TbRefresh, TbSettings, TbUsers } from "react-icons/tb";
import { FormattedMessage } from "react-intl";
import Meta from "../../components/Meta";
import AdminCleanupLogs from "../../components/admin/dashboard/AdminCleanupLogs";
import AdminCleanupPolicy from "../../components/admin/dashboard/AdminCleanupPolicy";
import AdminCleanupPreview from "../../components/admin/dashboard/AdminCleanupPreview";
import AdminOverview from "../../components/admin/dashboard/AdminOverview";
import useTranslate from "../../hooks/useTranslate.hook";
import configService from "../../services/config.service";
import useEditorialPageStyles from "../../styles/editorialPage.style";

const useStyles = createStyles((theme) => ({
  item: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "space-between",
    textAlign: "left",
    height: 132,
    padding: theme.spacing.lg,
    borderRadius: 0,
    border: 0,
    borderTop: `2px solid ${theme.colors[theme.primaryColor][theme.colorScheme === "dark" ? 4 : 6]}`,
    backgroundColor: "transparent",
    transition: "transform 150ms ease, border-color 150ms ease",
    "&:hover": {
      borderColor: theme.colors[theme.primaryColor][theme.colorScheme === "dark" ? 3 : 6],
      transform: "translateY(-3px)",
    },
  },

  itemIndex: {
    color: theme.colorScheme === "dark" ? theme.colors.dark[1] : theme.colors.gray[5],
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.12em",
  },
}));

const Admin = () => {
  const { classes, theme } = useStyles();
  const { classes: editorialClasses } = useEditorialPageStyles();
  const t = useTranslate();

  const [managementOptions, setManagementOptions] = useState([
    {
      title: t("admin.button.users"),
      icon: TbUsers,
      route: "/admin/users",
    },
    {
      title: t("admin.button.shares"),
      icon: TbLink,
      route: "/admin/shares",
    },
    {
      title: t("admin.button.config"),
      icon: TbSettings,
      route: "/admin/config/general",
    },
  ]);

  useEffect(() => {
    configService
      .isNewReleaseAvailable()
      .then((isNewReleaseAvailable) => {
        if (isNewReleaseAvailable) {
          setManagementOptions((currentOptions) => {
            const updateRoute =
              "https://github.com/ToYOhin/sharedock/releases/latest";

            if (currentOptions.some((option) => option.route === updateRoute)) {
              return currentOptions;
            }

            return [
              ...currentOptions,
              {
                title: "Update",
                icon: TbRefresh,
                route: updateRoute,
              },
            ];
          });
        }
      })
      .catch();
  }, []);

  return (
    <Box className={editorialClasses.page}>
      <Meta title={t("admin.title")} />
      <Box className={editorialClasses.header}>
        <Box>
          <Text className={editorialClasses.eyebrow}>Admin / control room</Text>
          <Title className={editorialClasses.title} order={1}>
            <FormattedMessage id="admin.title" />
          </Title>
        </Box>
        <Text className={editorialClasses.pageNumber}>01</Text>
      </Box>
      <Stack
        justify="space-between"
        spacing="xl"
        style={{ minHeight: "calc(100vh - 180px)" }}
      >
        <Stack spacing="xl">
          <AdminOverview />
          <AdminCleanupPolicy />
          <AdminCleanupPreview />
          <AdminCleanupLogs />
          <Grid>
            {managementOptions.map((item, index) => {
              return (
                <Col xs={6} key={item.route}>
                  <Paper
                    component={Link}
                    href={item.route}
                    key={item.title}
                    className={classes.item}
                  >
                    <Group position="apart" w="100%" align="flex-start">
                      <item.icon
                        color={
                          theme.colors[theme.primaryColor][
                            theme.colorScheme === "dark" ? 3 : 7
                          ]
                        }
                        size={30}
                      />
                      <Text className={classes.itemIndex}>0{index + 1}</Text>
                    </Group>
                    <Text weight={700}>{item.title}</Text>
                  </Paper>
                </Col>
              );
            })}
          </Grid>
        </Stack>

        <Center>
          <Text size="xs" color="dimmed">
            <FormattedMessage id="admin.version" /> {process.env.VERSION}
          </Text>
        </Center>
      </Stack>
    </Box>
  );
};

export default Admin;
