import { Badge, Group } from "@mantine/core";

const ShareTagBadges = ({ tags }: { tags?: string[] | null }) => {
  const visibleTags = tags?.filter(Boolean) ?? [];

  if (visibleTags.length === 0) return null;

  return (
    <Group spacing={4}>
      {visibleTags.map((tag) => (
        <Badge
          key={tag}
          size="xs"
          radius="sm"
          variant="light"
          title={tag}
          sx={{ maxWidth: 140, textTransform: "none" }}
          styles={{
            inner: {
              overflow: "hidden",
              textOverflow: "ellipsis",
            },
          }}
        >
          {tag}
        </Badge>
      ))}
    </Group>
  );
};

export default ShareTagBadges;
