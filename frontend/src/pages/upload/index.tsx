import {
  Box,
  Button,
  createStyles,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { useModals } from "@mantine/modals";
import { cleanNotifications } from "@mantine/notifications";
import { AxiosError } from "axios";
import pLimit from "p-limit";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  TbClock,
  TbLink,
  TbShieldCheck,
  TbTerminal2,
  TbUpload,
} from "react-icons/tb";
import { FormattedMessage } from "react-intl";
import Meta from "../../components/Meta";
import Dropzone from "../../components/upload/Dropzone";
import FileList from "../../components/upload/FileList";
import showCompletedUploadModal from "../../components/upload/modals/showCompletedUploadModal";
import showCreateUploadModal from "../../components/upload/modals/showCreateUploadModal";
import useConfig from "../../hooks/config.hook";
import useConfirmLeave from "../../hooks/confirm-leave.hook";
import useTranslate from "../../hooks/useTranslate.hook";
import useUser from "../../hooks/user.hook";
import shareService from "../../services/share.service";
import { FileUpload } from "../../types/File.type";
import { CreateShare, Share } from "../../types/share.type";
import toast from "../../utils/toast.util";
import { useRouter } from "next/router";

const promiseLimit = pLimit(3);
let errorToastShown = false;
let createdShare: Share;

const useStyles = createStyles((theme) => ({
  page: {
    paddingBottom: theme.spacing.xl,
  },

  intro: {
    marginBottom: theme.spacing.lg,
    padding: `${theme.spacing.sm}px 0 ${theme.spacing.xl}px`,
    borderTop: `1px solid ${theme.colorScheme === "dark" ? theme.colors.dark[4] : "rgba(24, 25, 28, 0.18)"}`,
    borderBottom: `1px solid ${theme.colorScheme === "dark" ? theme.colors.dark[4] : "rgba(24, 25, 28, 0.18)"}`,
    borderRadius: 0,
    backgroundColor: "transparent",
    boxShadow: "none",
  },

  introTop: {
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.spacing.md,

    [theme.fn.smallerThan("sm")]: {
      alignItems: "stretch",
      flexDirection: "column",
    },
  },

  headingGroup: {
    minWidth: 0,
  },

  heroIcon: {
    flex: "0 0 auto",
    backgroundColor: theme.colors[theme.primaryColor][theme.colorScheme === "dark" ? 8 : 7],
    color: theme.white,
  },

  title: {
    fontSize: "clamp(2rem, 4vw, 3.4rem)",
    lineHeight: 0.98,
    letterSpacing: "-0.045em",

    [theme.fn.smallerThan("sm")]: {
      fontSize: 24,
    },
  },

  description: {
    maxWidth: 620,
    lineHeight: 1.55,
  },

  shareButton: {
    flex: "0 0 auto",

    [theme.fn.smallerThan("sm")]: {
      width: "100%",
    },
  },

  signalGrid: {
    marginTop: theme.spacing.lg,
  },

  signal: {
    minHeight: 50,
    padding: `${theme.spacing.sm}px 0 0`,
    borderTop: `2px solid ${theme.colors[theme.primaryColor][theme.colorScheme === "dark" ? 4 : 6]}`,
    borderRadius: 0,
    backgroundColor: "transparent",
  },

  signalIcon: {
    color:
      theme.colorScheme === "dark"
        ? theme.colors[theme.primaryColor][2]
      : theme.colors[theme.primaryColor][7],
    backgroundColor: "transparent",
  },
}));

const Upload = ({
  maxShareSize,
  isReverseShare = false,
  simplified,
}: {
  maxShareSize?: number;
  isReverseShare: boolean;
  simplified: boolean;
}) => {
  const modals = useModals();
  const router = useRouter();
  const t = useTranslate();
  const { classes } = useStyles();

  const { user } = useUser();
  const config = useConfig();
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [isUploading, setisUploading] = useState(false);

  useConfirmLeave({
    message: t("upload.notify.confirm-leave"),
    enabled: isUploading,
  });

  const chunkSize = useRef(parseInt(config.get("share.chunkSize")));

  maxShareSize ??= user?.shareSizeLimit
    ? parseInt(user.shareSizeLimit)
    : parseInt(config.get("share.maxSize"));

  const currentFilesSize = useMemo(() => {
    return files.reduce((acc, file) => acc + file.size, 0);
  }, [files]);

  const autoOpenCreateUploadModal = config.get("share.autoOpenShareModal");

  const uploadFiles = async (share: CreateShare, files: FileUpload[]) => {
    setisUploading(true);

    try {
      const isReverseShare = router.pathname != "/upload";
      const totalSize = files.reduce((acc, file) => acc + file.size, 0);
      createdShare = await shareService.create(
        { ...share, size: totalSize },
        isReverseShare,
      );
    } catch (e) {
      toast.axiosError(e);
      setisUploading(false);
      return;
    }

    const fileUploadPromises = files.map(async (file, fileIndex) =>
      // Limit the number of concurrent uploads to 3
      promiseLimit(async () => {
        let fileId;

        const setFileProgress = (progress: number) => {
          setFiles((files) =>
            files.map((file, callbackIndex) => {
              if (fileIndex == callbackIndex) {
                file.uploadingProgress = progress;
              }
              return file;
            }),
          );
        };

        setFileProgress(1);

        let chunks = Math.ceil(file.size / chunkSize.current);

        // If the file is 0 bytes, we still need to upload 1 chunk
        if (chunks == 0) chunks++;

        for (let chunkIndex = 0; chunkIndex < chunks; chunkIndex++) {
          const from = chunkIndex * chunkSize.current;
          const to = from + chunkSize.current;
          const blob = file.slice(from, to);
          try {
            await shareService
              .uploadFile(
                createdShare.id,
                blob,
                {
                  id: fileId,
                  name: file.name,
                },
                chunkIndex,
                chunks,
              )
              .then((response) => {
                fileId = response.id;
              });

            setFileProgress(((chunkIndex + 1) / chunks) * 100);
          } catch (e) {
            if (
              e instanceof AxiosError &&
              e.response?.data.error == "unexpected_chunk_index"
            ) {
              // Retry with the expected chunk index
              chunkIndex = e.response!.data!.expectedChunkIndex - 1;
              continue;
            } else {
              setFileProgress(-1);
              // Retry after 5 seconds
              await new Promise((resolve) => setTimeout(resolve, 5000));
              chunkIndex = -1;

              continue;
            }
          }
        }
      }),
    );

    Promise.all(fileUploadPromises);
  };

  const showCreateUploadModalCallback = (files: FileUpload[]) => {
    showCreateUploadModal(
      modals,
      {
        isUserSignedIn: user ? true : false,
        isReverseShare,
        appUrl: config.get("general.appUrl"),
        defaultAppUrl: config.get("general.appUrl", true),
        allowUnauthenticatedShares: config.get(
          "share.allowUnauthenticatedShares",
        ),
        enableEmailRecepients: config.get("email.enableShareEmailRecipients"),
        maxExpiration: config.get("share.maxExpiration"),
        defaultExpiration: config.get("share.defaultExpiration"),
        shareIdLength: config.get("share.shareIdLength"),
        simplified,
      },
      files,
      uploadFiles,
    );
  };

  const handleDropzoneFilesChanged = (files: FileUpload[]) => {
    if (autoOpenCreateUploadModal) {
      setFiles(files);
      showCreateUploadModalCallback(files);
    } else {
      setFiles((oldArr) => [...oldArr, ...files]);
    }
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (modals.modals.length > 0) {
        return;
      }

      const clipboardData = e.clipboardData;

      if (!clipboardData) {
        return;
      }

      if (clipboardData?.getData("text/plain")) {
        const pastedText = clipboardData.getData("text/plain");
        if (!pastedText) {
          return;
        }

        // Create a sanitised file name from the pasted text
        const safeName = pastedText
          .substring(0, 50)
          .replace(/[^a-zA-Z0-9 ]/g, "")
          .trim();
        const fileName = `${safeName || "clipboard_paste"}.txt`;

        const file = new File([pastedText], fileName, {
          type: "text/plain",
        });
        const fileUpload = file as FileUpload;
        fileUpload.uploadingProgress = 0;

        if (autoOpenCreateUploadModal) {
          setFiles([fileUpload]);
          showCreateUploadModalCallback([fileUpload]);
        } else {
          setFiles((oldArr) => [...oldArr, fileUpload]);
        }
      }
    };

    window.addEventListener("paste", handlePaste);

    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [autoOpenCreateUploadModal, modals.modals.length]);

  useEffect(() => {
    // Check if there are any files that failed to upload
    const fileErrorCount = files.filter(
      (file) => file.uploadingProgress == -1,
    ).length;

    if (fileErrorCount > 0) {
      if (!errorToastShown) {
        toast.error(
          t("upload.notify.count-failed", { count: fileErrorCount }),
          {
            withCloseButton: false,
            autoClose: false,
          },
        );
      }
      errorToastShown = true;
    } else {
      cleanNotifications();
      errorToastShown = false;
    }

    // Complete share
    if (
      files.length > 0 &&
      files.every((file) => file.uploadingProgress >= 100) &&
      fileErrorCount == 0
    ) {
      shareService
        .completeShare(createdShare.id)
        .then((share) => {
          setisUploading(false);
          showCompletedUploadModal(
            modals,
            share,
            config.get("general.appUrl"),
            config.get("general.appUrl", true),
          );
          setFiles([]);
        })
        .catch(() => toast.error(t("upload.notify.generic-error")));
    }
  }, [files]);

  const uploadSignals = [
    {
      icon: <TbShieldCheck size={16} />,
      id: "upload.page.signal.private",
      defaultMessage: "Private relay",
    },
    {
      icon: <TbClock size={16} />,
      id: "upload.page.signal.temporary",
      defaultMessage: "Expiration-aware",
    },
    {
      icon: <TbTerminal2 size={16} />,
      id: "upload.page.signal.automation",
      defaultMessage: "ShareX and scripts",
    },
  ];

  return (
    <Box className={classes.page}>
      <Meta title={t("upload.title")} />
      <Paper className={classes.intro} radius={0}>
        <Stack spacing={0}>
          <Group className={classes.introTop} noWrap>
            <Group
              className={classes.headingGroup}
              align="flex-start"
              spacing="md"
              noWrap
            >
              <ThemeIcon className={classes.heroIcon} size={48} radius={0}>
                <TbUpload size={26} />
              </ThemeIcon>
              <Box>
                <Title className={classes.title} order={1}>
                  <FormattedMessage
                    id={
                      isReverseShare
                        ? "upload.page.title.reverse"
                        : "upload.page.title.default"
                    }
                    defaultMessage={
                      isReverseShare
                        ? "Send files back"
                        : "Send a private file handoff"
                    }
                  />
                </Title>
                <Text className={classes.description} color="dimmed" mt={6}>
                  <FormattedMessage
                    id={
                      isReverseShare
                        ? "upload.page.description.reverse"
                        : "upload.page.description.default"
                    }
                    defaultMessage={
                      isReverseShare
                        ? "Add the requested files here. ShareDock will notify the receiver when the handoff is ready."
                        : "Drop files or paste text, then turn them into a clean ShareDock link for screenshots, logs, builds, and handoffs."
                    }
                  />
                </Text>
              </Box>
            </Group>
            <Button
              className={classes.shareButton}
              leftIcon={<TbLink size={18} />}
              loading={isUploading}
              disabled={files.length <= 0}
              onClick={() => showCreateUploadModalCallback(files)}
            >
              <FormattedMessage id="common.button.share" />
            </Button>
          </Group>
          <SimpleGrid
            className={classes.signalGrid}
            cols={3}
            spacing="sm"
            breakpoints={[{ maxWidth: "sm", cols: 1 }]}
          >
            {uploadSignals.map((signal) => (
              <Group
                key={signal.id}
                className={classes.signal}
                spacing="xs"
                noWrap
              >
                <ThemeIcon
                  className={classes.signalIcon}
                  variant="light"
                  radius={0}
                  size={26}
                >
                  {signal.icon}
                </ThemeIcon>
                <Text size="sm" weight={600}>
                  <FormattedMessage
                    id={signal.id}
                    defaultMessage={signal.defaultMessage}
                  />
                </Text>
              </Group>
            ))}
          </SimpleGrid>
        </Stack>
      </Paper>
      <Dropzone
        title={
          !autoOpenCreateUploadModal && files.length > 0
            ? t("share.edit.append-upload")
            : undefined
        }
        maxShareSize={maxShareSize}
        currentFilesSize={currentFilesSize}
        onFilesChanged={handleDropzoneFilesChanged}
        isUploading={isUploading}
      />
      {files.length > 0 && (
        <FileList<FileUpload> files={files} setFiles={setFiles} />
      )}
    </Box>
  );
};
export default Upload;
