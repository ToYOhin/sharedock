import {
  Button,
  Center,
  createStyles,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { Dropzone as MantineDropzone } from "@mantine/dropzone";
import { ForwardedRef, useRef } from "react";
import { TbCloudUpload, TbUpload } from "react-icons/tb";
import { FormattedMessage } from "react-intl";
import useTranslate from "../../hooks/useTranslate.hook";
import { FileUpload } from "../../types/File.type";
import { byteToHumanSizeString } from "../../utils/fileSize.util";
import toast from "../../utils/toast.util";

const useStyles = createStyles((theme) => ({
  wrapper: {
    position: "relative",
    marginBottom: 38,
  },

  dropzone: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor:
      theme.colorScheme === "dark"
        ? theme.colors.dark[4]
        : theme.colors.gray[3],
    paddingTop: `calc(${theme.spacing.xl} * 1.25)`,
    paddingRight: theme.spacing.lg,
    paddingBottom: `calc(${theme.spacing.xl} * 1.85)`,
    paddingLeft: theme.spacing.lg,
    backgroundColor: "transparent",
    transition: "border-color 150ms ease, background-color 150ms ease",

    "&:hover": {
      borderColor:
        theme.colors[theme.primaryColor][theme.colorScheme === "dark" ? 4 : 6],
      backgroundColor:
        theme.colorScheme === "dark"
          ? theme.fn.rgba(theme.colors[theme.primaryColor][9], 0.18)
          : theme.colors[theme.primaryColor][0],
    },

    borderRadius: 0,
  },

  icon: {
    color: theme.white,
    backgroundColor: theme.colors[theme.primaryColor][theme.colorScheme === "dark" ? 8 : 7],
    borderRadius: 0,
    boxShadow: "none",
  },

  control: {
    position: "absolute",
    bottom: -20,
    borderRadius: 0,
    boxShadow: "none",
  },
}));

const Dropzone = ({
  title,
  isUploading,
  maxShareSize,
  currentFilesSize = 0,
  onFilesChanged,
}: {
  title?: string;
  isUploading: boolean;
  maxShareSize: number;
  currentFilesSize?: number;
  onFilesChanged: (files: FileUpload[]) => void;
}) => {
  const t = useTranslate();

  const { classes } = useStyles();
  const openRef = useRef<() => void>();
  return (
    <div className={classes.wrapper}>
      <MantineDropzone
        onReject={(e) => {
          toast.error(e[0].errors[0].message);
        }}
        disabled={isUploading}
        openRef={openRef as ForwardedRef<() => void>}
        onDrop={(files: FileUpload[]) => {
          const fileSizeSum = files.reduce((n, { size }) => n + size, 0);

          if (fileSizeSum + currentFilesSize > maxShareSize) {
            toast.error(
              t("upload.dropzone.notify.file-too-big", {
                maxSize: byteToHumanSizeString(maxShareSize),
              }),
            );
          } else {
            files = files.map((newFile) => {
              newFile.uploadingProgress = 0;
              return newFile;
            });
            onFilesChanged(files);
          }
        }}
        className={classes.dropzone}
        radius={0}
      >
        <div style={{ pointerEvents: "none" }}>
          <Stack align="center" spacing="xs">
            <ThemeIcon className={classes.icon} size={64} radius="xl">
              <TbCloudUpload size={34} />
            </ThemeIcon>
            <Text align="center" weight={700} size="lg" mt="sm">
              {title || <FormattedMessage id="upload.dropzone.title" />}
            </Text>
            <Text align="center" size="sm" color="dimmed" maw={560}>
              <FormattedMessage
                id="upload.dropzone.description"
                values={{ maxSize: byteToHumanSizeString(maxShareSize) }}
              />
            </Text>
          </Stack>
        </div>
      </MantineDropzone>
      <Center>
        <Button
          className={classes.control}
          variant="light"
          size="sm"
          radius="xl"
          disabled={isUploading}
          onClick={() => openRef.current && openRef.current()}
        >
          {<TbUpload />}
        </Button>
      </Center>
    </div>
  );
};
export default Dropzone;
