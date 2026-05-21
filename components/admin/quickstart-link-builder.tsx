"use client";

import { useMemo, useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { encodeQuickstartPin } from "@/lib/auth/quickstart-codec";
import type { LoginDirectoryUser } from "@/lib/types";

type QuickstartLinkBuilderProps = {
  baseUrl: string;
  users: LoginDirectoryUser[];
};

export function QuickstartLinkBuilder({ baseUrl, users }: QuickstartLinkBuilderProps) {
  const [copied, setCopied] = useState(false);
  const [pin, setPin] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");

  const selectedUser = users.find((user) => user.id === selectedUserId) ?? null;
  const trimmedPin = pin.trim();
  const quickstartUrl = useMemo(() => {
    if (!selectedUser || !trimmedPin) {
      return "";
    }

    const token = encodeQuickstartPin(selectedUser.id, trimmedPin);

    return `${baseUrl}/quickstart/${selectedUser.id}/${token}`;
  }, [baseUrl, selectedUser, trimmedPin]);
  const defaultDepartment = selectedUser
    ? selectedUser.departments.find((department) => department.id === selectedUser.defaultDepartmentId) ??
      selectedUser.departments[0] ??
      null
    : null;

  async function copyLink() {
    if (!quickstartUrl) {
      return;
    }

    await navigator.clipboard.writeText(quickstartUrl);
    setCopied(true);
    window.setTimeout(() => {
      setCopied(false);
    }, 1800);
  }

  return (
    <Card className="border-border/70 bg-card/85 shadow-[0_28px_90px_-44px_rgba(15,23,42,0.5)] backdrop-blur">
      <CardHeader>
        <CardTitle className="text-2xl">Badge quickstart link</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div className="space-y-2">
            <Label htmlFor="quickstart-user-select">User</Label>
            <Select
              onValueChange={(value) => {
                setSelectedUserId(value);
                setCopied(false);
              }}
              value={selectedUserId}
            >
              <SelectTrigger id="quickstart-user-select" className="h-12">
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Active users</SelectLabel>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.displayName}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quickstart-pin">PIN</Label>
            <Input
              autoComplete="off"
              className="h-12"
              id="quickstart-pin"
              inputMode="numeric"
              onChange={(event) => {
                setPin(event.target.value);
                setCopied(false);
              }}
              placeholder="Enter PIN"
              type="password"
              value={pin}
            />
          </div>
        </div>

        <div className="grid gap-3 rounded-2xl border border-border/70 bg-background/75 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="quickstart-output">URL</Label>
            <Input
              className="h-12 font-mono text-xs"
              id="quickstart-output"
              readOnly
              value={quickstartUrl}
            />
          </div>
          <div className="flex gap-2">
            <Button
              aria-label="Copy quickstart URL"
              disabled={!quickstartUrl}
              onClick={copyLink}
              type="button"
              variant="outline"
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
            {quickstartUrl ? (
              <Button asChild type="button" variant="outline">
                <a href={quickstartUrl} rel="noreferrer" target="_blank">
                  <ExternalLink className="size-4" />
                  Open
                </a>
              </Button>
            ) : (
              <Button disabled type="button" variant="outline">
                <ExternalLink className="size-4" />
                Open
              </Button>
            )}
          </div>
        </div>

        {selectedUser ? (
          <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-background/75 p-4">
              <p className="font-medium text-foreground">Default department</p>
              <p className="mt-1">{defaultDepartment?.name ?? "None"}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/75 p-4">
              <p className="font-medium text-foreground">Department access</p>
              <p className="mt-1">
                {selectedUser.departments.length
                  ? selectedUser.departments.map((department) => department.name).join(", ")
                  : "None"}
              </p>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
