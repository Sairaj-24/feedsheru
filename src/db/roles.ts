export const PRIMARY_ROLES = ["provider", "maker", "distributor"] as const;

export type PrimaryRole = (typeof PRIMARY_ROLES)[number];

export function isPrimaryRole(value: unknown): value is PrimaryRole {
  return (
    typeof value === "string" &&
    (PRIMARY_ROLES as readonly string[]).includes(value)
  );
}
