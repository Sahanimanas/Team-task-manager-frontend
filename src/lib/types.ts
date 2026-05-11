export type GlobalRole = "ADMIN" | "MEMBER";
export type ProjectRole = "ADMIN" | "MEMBER";
export type TeamRole = "ADMIN" | "MEMBER";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export type User = {
  id: string;
  email: string;
  name: string;
  role: GlobalRole;
};

export type UserSummary = {
  id: string;
  email: string;
  name: string;
};

export type Project = {
  id: string;
  name: string;
  description?: string | null;
  ownerId: string;
  owner?: UserSummary;
  teamId?: string | null;
  team?: { id: string; name: string } | null;
  _count?: { tasks: number; members: number };
  createdAt: string;
};

export type Member = {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectRole;
  user: UserSummary;
};

export type Team = {
  id: string;
  name: string;
  description?: string | null;
  ownerId: string;
  owner?: UserSummary;
  _count?: { members: number; projects: number };
  createdAt: string;
};

export type TeamMember = {
  id: string;
  teamId: string;
  userId: string;
  role: TeamRole;
  user: UserSummary;
};

export type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  projectId: string;
  assigneeId?: string | null;
  createdById: string;
  assignee?: UserSummary | null;
  createdBy?: UserSummary;
  project?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
};

export type Notification = {
  id: string;
  type: string;
  message: string;
  read: boolean;
  taskId?: string | null;
  projectId?: string | null;
  createdAt: string;
};

export type DashboardData = {
  myTasks: Task[];
  overdue: Task[];
  recent: Task[];
  stats: {
    projects: number;
    todo: number;
    inProgress: number;
    done: number;
    overdueCount: number;
  };
};
