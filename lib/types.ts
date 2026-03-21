export type DepartmentSummary = {
  id: string;
  name: string;
  slug: string;
};

export type LoginDirectoryUser = {
  id: string;
  displayName: string;
  departments: DepartmentSummary[];
};

export type ActiveAppUser = {
  id: string;
  displayName: string;
  department: DepartmentSummary | null;
  departments: DepartmentSummary[];
};

export type AppSessionContext = {
  isConfigured: boolean;
  user: ActiveAppUser | null;
};
