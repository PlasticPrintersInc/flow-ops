"use client";

import { useActionState, useState } from "react";

import { loginAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INITIAL_LOGIN_STATE } from "@/lib/auth/forms";
import type { LoginDirectoryUser } from "@/lib/types";

type LoginFormProps = {
  recentUserIds: string[];
  redirectTo: string;
  users: LoginDirectoryUser[];
};

export function LoginForm({ recentUserIds, redirectTo, users }: LoginFormProps) {
  const [state, action, pending] = useActionState(loginAction, INITIAL_LOGIN_STATE);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");

  const recentUsers = recentUserIds
    .map((userId) => users.find((user) => user.id === userId))
    .filter((user): user is LoginDirectoryUser => Boolean(user));

  const remainingUsers = users.filter((user) => !recentUserIds.includes(user.id));
  const selectedUser = users.find((user) => user.id === selectedUserId) ?? null;
  const departments = selectedUser?.departments ?? [];
  const hasSelectedDepartment = departments.some((department) => department.id === selectedDepartmentId);
  const resolvedDepartmentId = hasSelectedDepartment
    ? selectedDepartmentId
    : departments.length === 1
      ? departments[0].id
      : "";

  return (
    <Card className="w-full border-border/70 bg-card/85 shadow-[0_28px_90px_-44px_rgba(15,23,42,0.5)] backdrop-blur">
      <CardHeader className="space-y-3">
        <CardTitle className="text-3xl">Sign in to Flow Ops</CardTitle>
        <CardDescription className="text-base leading-7">Select your name, department, and PIN.</CardDescription>
      </CardHeader>

      <form action={action}>
        <CardContent className="space-y-5">
          <input name="userId" type="hidden" value={selectedUserId} />
          <input name="departmentId" type="hidden" value={resolvedDepartmentId} />
          <input name="redirectTo" type="hidden" value={redirectTo} />

          <div className="space-y-2">
            <Label htmlFor="user-select">User</Label>
            <Select
              value={selectedUserId}
              onValueChange={(value) => {
                setSelectedUserId(value);
                setSelectedDepartmentId("");
              }}
            >
              <SelectTrigger id="user-select" className="h-12">
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {recentUsers.length > 0 ? (
                  <SelectGroup>
                    <SelectLabel>Recent users</SelectLabel>
                    {recentUsers.map((user) => (
                      <SelectItem key={`recent-${user.id}`} value={user.id}>
                        {user.displayName}
                      </SelectItem>
                    ))}
                    <SelectSeparator />
                  </SelectGroup>
                ) : null}

                <SelectGroup>
                  <SelectLabel>{recentUsers.length > 0 ? "All users" : "Users"}</SelectLabel>
                  {remainingUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.displayName}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="department-select">Department</Label>
            <Select
              disabled={!selectedUser || departments.length === 0}
              value={resolvedDepartmentId}
              onValueChange={setSelectedDepartmentId}
            >
              <SelectTrigger id="department-select" className="h-12">
                <SelectValue
                  placeholder={
                    selectedUser ? "Select a department" : "Choose an user first"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {departments.map((department) => (
                  <SelectItem key={department.id} value={department.id}>
                    {department.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedUser && departments.length === 0 ? (
              <p className="text-sm text-destructive">
                This user does not currently have department access configured.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="pin">PIN</Label>
            <Input
              autoComplete="current-password"
              className="h-12"
              id="pin"
              inputMode="numeric"
              name="pin"
              placeholder="Enter PIN"
              type="password"
            />
          </div>

          {state.message ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {state.message}
            </div>
          ) : null}
        </CardContent>

        <CardFooter className="flex flex-col items-stretch gap-3">
          <Button
            className="h-12"
            disabled={pending || !selectedUserId || !resolvedDepartmentId}
            type="submit"
          >
            {pending ? "Signing in..." : "Sign in"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
