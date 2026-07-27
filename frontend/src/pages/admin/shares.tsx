import { Box, Group, Space, Text, Title } from "@mantine/core";
import { useModals } from "@mantine/modals";
import { useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";
import Meta from "../../components/Meta";
import ManageShareTable from "../../components/admin/shares/ManageShareTable";
import DiskUsage from "../../components/admin/shares/DiskUsage";
import useTranslate from "../../hooks/useTranslate.hook";
import shareService from "../../services/share.service";
import { MyShare } from "../../types/share.type";
import toast from "../../utils/toast.util";
import useEditorialPageStyles from "../../styles/editorialPage.style";

const Shares = () => {
  const [shares, setShares] = useState<MyShare[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const modals = useModals();
  const t = useTranslate();
  const { classes: editorialClasses } = useEditorialPageStyles();

  const getShares = () => {
    setIsLoading(true);
    shareService.list().then((shares) => {
      setShares(shares);
      setIsLoading(false);
    });
  };

  const deleteShare = (share: MyShare) => {
    modals.openConfirmModal({
      title: t("admin.shares.edit.delete.title", {
        id: share.id,
      }),
      children: (
        <Text size="sm">
          <FormattedMessage id="admin.shares.edit.delete.description" />
        </Text>
      ),
      labels: {
        confirm: t("common.button.delete"),
        cancel: t("common.button.cancel"),
      },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        shareService
          .remove(share.id)
          .then(() => setShares(shares.filter((v) => v.id != share.id)))
          .catch(toast.axiosError);
      },
    });
  };

  useEffect(() => {
    getShares();
  }, []);

  return (
    <Box className={editorialClasses.page}>
      <Meta title={t("admin.shares.title")} />
      <Group className={editorialClasses.header} position="apart" align="flex-start">
        <Box>
          <Text className={editorialClasses.eyebrow}>Admin / shared files</Text>
          <Title className={editorialClasses.title} mb={0} order={1}>
            <FormattedMessage id="admin.shares.title" />
          </Title>
          <Text color="dimmed" mt={4} size="sm">
            <FormattedMessage id="admin.shares.description" />
          </Text>
        </Box>
        <Box className={editorialClasses.headerAside}>
          <Text className={editorialClasses.pageNumber}>02</Text>
          <DiskUsage />
        </Box>
      </Group>

      <ManageShareTable
        shares={shares}
        updateShare={(updatedShare) =>
          setShares(
            shares.map((share) =>
              share.id === updatedShare.id ? updatedShare : share,
            ),
          )
        }
        deleteShare={deleteShare}
        isLoading={isLoading}
      />
      <Space h="xl" />
    </Box>
  );
};

export default Shares;
