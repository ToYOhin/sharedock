export class SystemInfoDTO {
  used: number;
  total: number;
}

export class ExpiringShareDTO {
  id: string;
  name: string | null;
  expiration: Date;
  fileCount: number;
}

export class SystemOverviewDTO {
  diskUsage: SystemInfoDTO | null;
  shareCount: number;
  fileCount: number;
  recentShareCount: number;
  expiringShares: ExpiringShareDTO[];
}
