import {
  Box,
  Group,
  Paper,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import moment from "moment";
import { useEffect, useState } from "react";
import { IconType } from "react-icons";
import { TbClock, TbDatabase, TbFile, TbLink } from "react-icons/tb";
import { FormattedMessage } from "react-intl";
import useTranslate from "../../../hooks/useTranslate.hook";
import systemService, {
  SystemOverview,
} from "../../../services/system.service";
import { byteToHumanSizeString } from "../../../utils/fileSize.util";

const countFormatter = new Intl.NumberFormat();

type OverviewItem = {
  color: string;
  icon: IconType;
  label: string;
  value: string;
};

const formatCount = (value?: number) =>
  value === undefined ? "-" : countFormatter.format(value);

const AdminOverview = () => {
  const t = useTranslate();
  const [overview, setOverview] = useState<SystemOverview | null>();

  useEffect(() => {
    let isMounted = true;

    systemService
      .getSystemOverview()
      .then((systemOverview) => {
        if (isMounted) {
          setOverview(systemOverview);
        }
      })
      .catch(() => {
        if (isMounted) {
          setOverview(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const isLoading = overview === undefined;

  const items: OverviewItem[] = [
    {
      label: t("admin.overview.storage"),
      value: overview?.diskUsage
        ? `${byteToHumanSizeString(
            overview.diskUsage.used,
          )} / ${byteToHumanSizeString(overview.diskUsage.total)}`
        : t("admin.overview.unavailable"),
      icon: TbDatabase,
      color: "blue",
    },
    {
      label: t("admin.overview.shares"),
      value: formatCount(overview?.shareCount),
      icon: TbLink,
      color: "violet",
    },
    {
      label: t("admin.overview.files"),
      value: formatCount(overview?.fileCount),
      icon: TbFile,
      color: "teal",
    },
    {
      label: t("admin.overview.recentShares"),
      value: formatCount(overview?.recentShareCount),
      icon: TbClock,
      color: "orange",
    },
  ];

  return (
    <Stack spacing="sm">
      <Title order={4}>
        <FormattedMessage id="admin.overview.title" />
      </Title>
      <SimpleGrid
        cols={4}
        spacing="sm"
        breakpoints={[
          { maxWidth: "md", cols: 2 },
          { maxWidth: "xs", cols: 1 },
        ]}
      >
        {items.map((item) => (
          <Paper
            sx={(theme) => ({
              border: 0,
              borderTop: `2px solid ${theme.colors[item.color][
                theme.colorScheme === "dark" ? 4 : 6
              ]}`,
              borderRadius: 0,
              backgroundColor: "transparent",
            })}
            p="md"
            radius={0}
            key={item.label}
          >
            <Group noWrap align="flex-start">
              <ThemeIcon variant="light" color={item.color} radius={0} size="lg">
                <item.icon size={20} />
              </ThemeIcon>
              <Stack spacing={2}>
                <Text size="xs" color="dimmed">
                  {item.label}
                </Text>
                {isLoading ? (
                  <Skeleton height={24} width={92} radius="sm" />
                ) : (
                  <Text size="lg" weight={700}>
                    {item.value}
                  </Text>
                )}
              </Stack>
            </Group>
          </Paper>
        ))}
      </SimpleGrid>
      <Paper
        sx={(theme) => ({
          border: 0,
          borderTop: `1px solid ${
            theme.colorScheme === "dark"
              ? theme.colors.dark[4]
              : theme.colors.gray[3]
          }`,
          borderRadius: 0,
          backgroundColor: "transparent",
        })}
        p="md"
        radius={0}
      >
        <Stack spacing="sm">
          <Title order={5}>
            <FormattedMessage id="admin.overview.expiringShares.title" />
          </Title>
          {isLoading ? (
            <Stack spacing="xs">
              {[...Array(3)].map((_, index) => (
                <Skeleton key={index} height={28} radius="sm" />
              ))}
            </Stack>
          ) : overview?.expiringShares.length ? (
            <Box sx={{ overflowX: "auto" }}>
              <Table verticalSpacing="xs">
                <thead>
                  <tr>
                    <th>
                      <FormattedMessage id="admin.overview.expiringShares.share" />
                    </th>
                    <th>
                      <FormattedMessage id="admin.overview.expiringShares.expiration" />
                    </th>
                    <th>
                      <FormattedMessage id="admin.overview.expiringShares.files" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {overview.expiringShares.map((share) => (
                    <tr key={share.id}>
                      <td>
                        <Stack spacing={0}>
                          <Text size="sm" weight={500}>
                            {share.name || share.id}
                          </Text>
                          {share.name && (
                            <Text size="xs" color="dimmed">
                              {share.id}
                            </Text>
                          )}
                        </Stack>
                      </td>
                      <td>
                        <Text size="sm">
                          {moment(share.expiration).format("LLL")}
                        </Text>
                      </td>
                      <td>
                        <Text size="sm">
                          {countFormatter.format(share.fileCount)}
                        </Text>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Box>
          ) : (
            <Text size="sm" color="dimmed">
              <FormattedMessage id="admin.overview.expiringShares.empty" />
            </Text>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
};

export default AdminOverview;
