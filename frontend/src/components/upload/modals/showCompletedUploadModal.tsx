import {
  Alert,
  Box,
  Button,
  Collapse,
  createStyles,
  Group,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { useModals } from "@mantine/modals";
import { ModalsContextProps } from "@mantine/modals/lib/context";
import { useState } from "react";
import moment from "moment";
import { useRouter } from "next/router";
import { TbCheck, TbClock, TbQrcode, TbTrash } from "react-icons/tb";
import { FormattedMessage } from "react-intl";
import useTranslate, {
  translateOutsideContext,
} from "../../../hooks/useTranslate.hook";
import { CompletedShare } from "../../../types/share.type";
import CopyTextField from "../CopyTextField";
import QRCode from "../../share/QRCode";

const useStyles = createStyles((theme) => ({
  summary: {
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    border: `1px solid ${
      theme.colorScheme === "dark" ? theme.colors.dark[4] : theme.colors.gray[2]
    }`,
    backgroundColor:
      theme.colorScheme === "dark" ? theme.colors.dark[6] : theme.white,
  },

  icon: {
    flex: "0 0 auto",
    color:
      theme.colors[theme.primaryColor][theme.colorScheme === "dark" ? 2 : 7],
    backgroundColor:
      theme.colorScheme === "dark"
        ? theme.fn.rgba(theme.colors[theme.primaryColor][8], 0.28)
        : theme.colors[theme.primaryColor][0],
  },

  qrPanel: {
    padding: theme.spacing.sm,
    borderRadius: theme.radius.md,
    border: `1px solid ${
      theme.colorScheme === "dark" ? theme.colors.dark[4] : theme.colors.gray[2]
    }`,
    backgroundColor:
      theme.colorScheme === "dark" ? theme.colors.dark[7] : theme.colors.gray[0],
  },

  expiration: {
    padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
    borderRadius: theme.radius.sm,
    backgroundColor:
      theme.colorScheme === "dark" ? theme.colors.dark[7] : theme.colors.gray[0],
  },
}));

const showCompletedUploadModal = (
  modals: ModalsContextProps,
  share: CompletedShare,
  appUrl: string,
  defaultAppUrl: string,
) => {
  const t = translateOutsideContext();
  return modals.openModal({
    closeOnClickOutside: false,
    withCloseButton: false,
    closeOnEscape: false,
    size: "lg",
    title: t("upload.modal.completed.share-ready"),
    children: (
      <Body share={share} appUrl={appUrl} defaultAppUrl={defaultAppUrl} />
    ),
  });
};

const Body = ({
  share,
  appUrl,
  defaultAppUrl,
}: {
  share: CompletedShare;
  appUrl: string;
  defaultAppUrl: string;
}) => {
  const modals = useModals();
  const router = useRouter();
  const t = useTranslate();
  const { classes } = useStyles();

  const [showQR, setShowQR] = useState(false);

  const handleToggleQR = () => {
    setShowQR(!showQR);
  };

  const isReverseShare = !!router.query["reverseShareToken"];

  const link = `${appUrl !== defaultAppUrl ? appUrl : window.location.origin}/s/${share.id}`;

  return (
    <Stack align="stretch" spacing="md">
      <Group className={classes.summary} align="flex-start" noWrap>
        <ThemeIcon className={classes.icon} radius="md" size={42}>
          <TbCheck size={24} />
        </ThemeIcon>
        <Box>
          <Text weight={700}>
            {t("upload.modal.completed.summary-title")}
          </Text>
          <Text color="dimmed" mt={4} size="sm">
            {t("upload.modal.completed.summary-description")}
          </Text>
        </Box>
      </Group>

      <CopyTextField
        link={link}
        toggleQR={handleToggleQR}
        linkTextLabel={t("upload.modal.completed.copy.link-text-label")}
        inputLabel={t("upload.modal.completed.copy.input-label")}
        inputDescription={t("upload.modal.completed.copy.input-description")}
        actionLabels={{
          plain: t("upload.modal.completed.copy.private-link"),
          markdown: t("upload.modal.completed.copy.markdown-link"),
          html: t("upload.modal.completed.copy.html-snippet"),
          qr: t("upload.modal.completed.copy.qr-code"),
        }}
      />
      <Collapse in={showQR}>
        <Stack className={classes.qrPanel} spacing="sm">
          <Group spacing="xs" noWrap>
            <ThemeIcon radius="xl" size={28} variant="light">
              <TbQrcode size={17} />
            </ThemeIcon>
            <Box>
              <Text size="sm" weight={700}>
                {t("upload.modal.completed.qr.title")}
              </Text>
              <Text color="dimmed" size="xs">
                {t("upload.modal.completed.qr.description")}
              </Text>
            </Box>
          </Group>
          <QRCode link={link} />
        </Stack>
      </Collapse>
      {share.notifyReverseShareCreator === true && (
        <Text
          size="sm"
          sx={(theme) => ({
            color:
              theme.colorScheme === "dark"
                ? theme.colors.gray[3]
                : theme.colors.dark[4],
          })}
        >
          {t("upload.modal.completed.notified-reverse-share-creator")}
        </Text>
      )}

      <Alert
        color="gray"
        icon={<TbTrash size={16} />}
        title={t("upload.modal.completed.delete-link.title")}
        variant="light"
      >
        <Text size="sm">
          {t("upload.modal.completed.delete-link.description")}
        </Text>
      </Alert>

      <Group className={classes.expiration} spacing="xs" noWrap>
        <ThemeIcon radius="xl" size={24} variant="light">
          <TbClock size={15} />
        </ThemeIcon>
        <Text color="dimmed" size="xs">
          {/* If our share.expiration is timestamp 0, show a different message */}
          {moment(share.expiration).unix() === 0
            ? t("upload.modal.completed.never-expires")
            : t("upload.modal.completed.expires-on", {
                expiration: moment(share.expiration).format("LLL"),
              })}
        </Text>
      </Group>

      <Button
        onClick={() => {
          modals.closeAll();
          if (isReverseShare) {
            router.reload();
          } else {
            router.push("/upload");
          }
        }}
      >
        <FormattedMessage id="common.button.done" />
      </Button>
    </Stack>
  );
};

export default showCompletedUploadModal;
