import { MultiSelect } from "@mantine/core";
import React, { useState } from "react";
import useTranslate from "../../hooks/useTranslate.hook";

export const MAX_SHARE_TAGS = 12;
export const MAX_SHARE_TAG_LENGTH = 32;

const toShareTag = (value: string) => value.trim().replace(/\s+/g, " ");

export const normalizeShareTags = (tags: string[]) => {
  const normalized: string[] = [];

  tags.forEach((rawTag) => {
    const tag = toShareTag(rawTag);
    const tagKey = tag.toLowerCase();

    if (!tag || tag.length > MAX_SHARE_TAG_LENGTH) return;
    if (normalized.length >= MAX_SHARE_TAGS) return;
    if (normalized.some((item) => item.toLowerCase() === tagKey)) return;

    normalized.push(tag);
  });

  return normalized;
};

const ShareTagsInput = ({
  value,
  onChange,
  onError,
  error,
  label,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  onError?: (error: string | null) => void;
  error?: React.ReactNode;
  label?: React.ReactNode;
}) => {
  const t = useTranslate();
  const [searchValue, setSearchValue] = useState("");

  const canAddTag = (tag: string) => {
    if (!tag) return false;

    if (tag.length > MAX_SHARE_TAG_LENGTH) {
      onError?.(
        t("share.tags.error.too-long", {
          length: MAX_SHARE_TAG_LENGTH,
        }),
      );
      return false;
    }

    const alreadySelected = value.some(
      (item) => item.toLowerCase() === tag.toLowerCase(),
    );

    if (!alreadySelected && value.length >= MAX_SHARE_TAGS) {
      onError?.(t("share.tags.error.too-many", { max: MAX_SHARE_TAGS }));
      return false;
    }

    onError?.(null);
    return true;
  };

  const addTag = (query: string) => {
    const tag = toShareTag(query);

    if (!canAddTag(tag)) {
      setSearchValue("");
      return undefined;
    }

    onChange(normalizeShareTags([...value, tag]));
    setSearchValue("");
    return tag;
  };

  return (
    <MultiSelect
      data={value}
      value={value}
      label={label}
      onChange={(tags) => {
        onError?.(null);
        onChange(normalizeShareTags(tags));
      }}
      placeholder={t("share.tags.placeholder")}
      searchable
      creatable
      clearable
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      getCreateLabel={(query) =>
        `${t("share.tags.create")}: ${toShareTag(query)}`
      }
      onCreate={addTag}
      error={error}
      onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key !== "Enter" && event.key !== "," && event.key !== ";") {
          return;
        }

        event.preventDefault();
        addTag(searchValue);
      }}
    />
  );
};

export default ShareTagsInput;
