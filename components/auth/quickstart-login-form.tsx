"use client";

import { useActionState, useState } from "react";

import { loginAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INITIAL_LOGIN_STATE, type LoginActionState } from "@/lib/auth/forms";
import type { QuickstartUser } from "@/lib/data/quickstart-users";

type QuickstartLoginFormProps = {
  initialDepartmentId: string;
  initialMessage?: string;
  pin: string;
  redirectTo: string;
  user: QuickstartUser;
};

export function QuickstartLoginForm({
  initialDepartmentId,
  initialMessage,
  pin,
  redirectTo,
  user,
}: QuickstartLoginFormProps) {
  const initialState: LoginActionState = initialMessage
    ? {
        message: initialMessage,
      }
    : INITIAL_LOGIN_STATE;
  const [state, action, pending] = useActionState(loginAction, initialState);
  const [departmentId, setDepartmentId] = useState(initialDepartmentId);

  return (
    <Card className="w-full border-border/70 bg-card/85 shadow-[0_28px_90px_-44px_rgba(15,23,42,0.5)] backdrop-blur">
      <CardHeader className="space-y-3">
        <CardTitle className="text-3xl">Quick sign in</CardTitle>
        <CardDescription className="text-base leading-7">
          Review the department and start the session.
        </CardDescription>
      </CardHeader>

      <form action={action}>
        <CardContent className="space-y-5">
          <input name="userId" type="hidden" value={user.id} />
          <input name="departmentId" type="hidden" value={departmentId} />
          <input name="redirectTo" type="hidden" value={redirectTo} />

          <div className="space-y-2">
            <Label htmlFor="quickstart-user">User</Label>
            <Input
              className="h-12"
              id="quickstart-user"
              readOnly
              value={user.displayName}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quickstart-department">Department</Label>
            <Select
              disabled={user.departments.length <= 1}
              onValueChange={setDepartmentId}
              value={departmentId}
            >
              <SelectTrigger id="quickstart-department" className="h-12">
                <SelectValue placeholder="Select a department" />
              </SelectTrigger>
              <SelectContent>
                {user.departments.map((department) => (
                  <SelectItem key={department.id} value={department.id}>
                    {department.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quickstart-pin">PIN</Label>
            <Input
              autoComplete="current-password"
              className="h-12"
              id="quickstart-pin"
              inputMode="numeric"
              name="pin"
              readOnly
              type="password"
              value={pin}
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
            disabled={pending || !departmentId}
            type="submit"
          >
            {pending ? "Signing in..." : "Sign in"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
