import { Stack, Text } from "@mantine/core";
import { FormattedMessage } from "react-intl";
import ShareTagBadges from "./ShareTagBadges";

const ShareNameCell = ({
  name,
  description,
  tags,
}: {
  name?: string | null;
  description?: string | null;
  tags?: string[] | null;
}) => {
  return (
    <Stack spacing={2}>
      <Text size="sm">{name || "-"}</Text>
      {description && (
        <Text
          size="xs"
          color="dimmed"
          title={description}
          sx={{
            maxWidth: 280,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          <FormattedMessage id="account.shares.table.note" />: {description}
        </Text>
      )}
      <ShareTagBadges tags={tags} />
    </Stack>
  );
};

export default ShareNameCell;
