import { Button, SimpleGrid, Stack, TextInput } from "@mantine/core";
import { TbCode, TbCopy, TbMarkdown, TbQrcode } from "react-icons/tb";
import useTranslate from "../../hooks/useTranslate.hook";
import toast from "../../utils/toast.util";

type CopyTextFieldProps = {
  link: string;
  toggleQR?: () => void;
  linkTextLabel?: string;
  inputLabel?: string;
  inputDescription?: string;
  actionLabels?: {
    plain?: string;
    markdown?: string;
    html?: string;
    qr?: string;
  };
};

const escapeHtmlAttribute = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const copyWithTextarea = (value: string) => {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  textarea.style.left = "-9999px";

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, value.length);
  const copied = document.queryCommandSupported("copy")
    ? document.execCommand("copy")
    : false;
  document.body.removeChild(textarea);

  return copied;
};

const copyToClipboard = async (value: string) => {
  if (copyWithTextarea(value)) {
    return true;
  }

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      return false;
    }
  }

  return false;
};

const CopyTextField = ({
  link,
  toggleQR,
  linkTextLabel,
  inputLabel,
  inputDescription,
  actionLabels,
}: CopyTextFieldProps) => {
  const t = useTranslate();
  const resolvedLinkTextLabel =
    linkTextLabel ?? t("upload.modal.completed.copy.link-label");
  const markdownLink = `[${resolvedLinkTextLabel}](${link})`;
  const htmlLink = `<a href="${escapeHtmlAttribute(link)}">${escapeHtmlAttribute(
    resolvedLinkTextLabel,
  )}</a>`;

  const copy = async (value: string, message: string) => {
    if (await copyToClipboard(value)) {
      toast.success(message);
    } else {
      toast.error(t("upload.modal.completed.copy.notify.error"));
    }
  };

  return (
    <Stack spacing="xs">
      <TextInput
        readOnly
        variant="filled"
        value={link}
        label={inputLabel}
        description={inputDescription}
      />
      <SimpleGrid
        cols={2}
        spacing="xs"
        breakpoints={[{ maxWidth: "xs", cols: 1 }]}
      >
        <Button
          variant="light"
          leftIcon={<TbCopy />}
          onClick={() =>
            void copy(link, t("upload.modal.completed.copy.notify.plain"))
          }
        >
          {actionLabels?.plain ?? t("upload.modal.completed.copy.plain")}
        </Button>
        <Button
          variant="light"
          leftIcon={<TbMarkdown />}
          onClick={() =>
            void copy(
              markdownLink,
              t("upload.modal.completed.copy.notify.markdown"),
            )
          }
        >
          {actionLabels?.markdown ?? t("upload.modal.completed.copy.markdown")}
        </Button>
        <Button
          variant="light"
          leftIcon={<TbCode />}
          onClick={() =>
            void copy(htmlLink, t("upload.modal.completed.copy.notify.html"))
          }
        >
          {actionLabels?.html ?? t("upload.modal.completed.copy.html")}
        </Button>
        {toggleQR && (
          <Button variant="light" leftIcon={<TbQrcode />} onClick={toggleQR}>
            {actionLabels?.qr ?? t("common.button.showQRCode")}
          </Button>
        )}
      </SimpleGrid>
    </Stack>
  );
};

export default CopyTextField;
