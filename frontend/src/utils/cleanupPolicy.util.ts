export type CleanupPolicyKey =
  | "expiredShares"
  | "unfinishedShares"
  | "expiredReverseShares"
  | "expiredAuthTokens"
  | "unactivatedUsers"
  | "temporaryFiles";

export type CleanupPolicyItem = {
  key: CleanupPolicyKey;
  schedule:
    | "every_minute"
    | "hourly"
    | "every_6_hours"
    | "daily_midnight"
    | "hourly_at_minute_1";
  condition:
    | "share_expired_beyond_retention"
    | "unfinished_upload_older_than_1_day"
    | "reverse_share_expired"
    | "auth_token_expired"
    | "unactivated_user_older_than_24_hours"
    | "tmp_chunk_older_than_1_day";
  defaultPolicy:
    | "share_expiration_plus_retention"
    | "stale_unfinished_upload"
    | "reverse_share_expiration"
    | "token_expiration"
    | "unactivated_account_window"
    | "temporary_chunk_retention";
  defaultConfig:
    | "default_7_days_retention_0_days"
    | "fixed_1_day"
    | "reverse_share_chosen_expiration"
    | "token_specific_expiration"
    | "fixed_24_hours";
  logBehavior: "success_when_deleted_failure_when_failed";
};

export const CLEANUP_POLICY_ITEMS: CleanupPolicyItem[] = [
  {
    key: "expiredShares",
    schedule: "every_minute",
    condition: "share_expired_beyond_retention",
    defaultPolicy: "share_expiration_plus_retention",
    defaultConfig: "default_7_days_retention_0_days",
    logBehavior: "success_when_deleted_failure_when_failed",
  },
  {
    key: "unfinishedShares",
    schedule: "every_6_hours",
    condition: "unfinished_upload_older_than_1_day",
    defaultPolicy: "stale_unfinished_upload",
    defaultConfig: "fixed_1_day",
    logBehavior: "success_when_deleted_failure_when_failed",
  },
  {
    key: "expiredReverseShares",
    schedule: "hourly",
    condition: "reverse_share_expired",
    defaultPolicy: "reverse_share_expiration",
    defaultConfig: "reverse_share_chosen_expiration",
    logBehavior: "success_when_deleted_failure_when_failed",
  },
  {
    key: "expiredAuthTokens",
    schedule: "hourly_at_minute_1",
    condition: "auth_token_expired",
    defaultPolicy: "token_expiration",
    defaultConfig: "token_specific_expiration",
    logBehavior: "success_when_deleted_failure_when_failed",
  },
  {
    key: "unactivatedUsers",
    schedule: "hourly",
    condition: "unactivated_user_older_than_24_hours",
    defaultPolicy: "unactivated_account_window",
    defaultConfig: "fixed_24_hours",
    logBehavior: "success_when_deleted_failure_when_failed",
  },
  {
    key: "temporaryFiles",
    schedule: "daily_midnight",
    condition: "tmp_chunk_older_than_1_day",
    defaultPolicy: "temporary_chunk_retention",
    defaultConfig: "fixed_1_day",
    logBehavior: "success_when_deleted_failure_when_failed",
  },
];

export const getCleanupPolicyItemCount = () => CLEANUP_POLICY_ITEMS.length;

export const hasManualCleanupTrigger = () => false;
