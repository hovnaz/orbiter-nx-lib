import { NoProductRolesNotice } from './NoProductRolesNotice';

export interface NoSchoolRolesNoticeProps {
  /** When provided, shown as a hint about which org has no roles for the user. */
  organizationName?: string;
}

/**
 * Back-compat thin wrapper around {@link NoProductRolesNotice}. New code
 * should use the generic version directly.
 */
export function NoSchoolRolesNotice({ organizationName }: Readonly<NoSchoolRolesNoticeProps>) {
  return (
    <NoProductRolesNotice productName="School" organizationName={organizationName} />
  );
}
