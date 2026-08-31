import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HiSun, HiMoon } from "react-icons/hi2";
import { api } from "@/api/client";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { logout } from "@/features/auth/authSlice";
import { useTheme } from "@/hooks/useTheme";

interface ProfileResponse {
  user: { preferences?: { emailNotifications?: boolean } };
}

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const currentUser = useAppSelector((s) => s.auth.user);
  const { theme, setTheme } = useTheme();

  const { data } = useQuery({
    queryKey: ["profile", currentUser?.id],
    queryFn: async () => (await api.get<ProfileResponse>(`/users/${currentUser!.id}`)).data,
    enabled: Boolean(currentUser),
  });

  // Derived directly from the query result rather than mirrored into local
  // state via a useEffect - that pattern is a common source of stale/
  // flickering toggles (the effect only re-syncs on its own timing, so a
  // failed mutation can leave the UI showing a value the server rejected).
  // Defaults to true only when the field has genuinely never been set.
  const emailNotifs = data?.user?.preferences?.emailNotifications ?? true;

  const updatePreferences = useMutation({
    mutationFn: (emailNotifications: boolean) =>
      api.patch("/users/me", { preferences: { emailNotifications } }),
    // Optimistic update with real rollback on failure - previously a failed
    // request would silently leave the switch showing the wrong state with
    // no indication anything went wrong.
    onMutate: async (nextValue) => {
      await queryClient.cancelQueries({ queryKey: ["profile", currentUser?.id] });
      const previous = queryClient.getQueryData<ProfileResponse>(["profile", currentUser?.id]);
      queryClient.setQueryData<ProfileResponse>(["profile", currentUser?.id], (old) =>
        old ? { user: { ...old.user, preferences: { emailNotifications: nextValue } } } : old
      );
      return { previous };
    },
    onError: (_err, _next, context) => {
      if (context?.previous) queryClient.setQueryData(["profile", currentUser?.id], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["profile", currentUser?.id] }),
  });

  const logoutAll = useMutation({
    mutationFn: () => api.post("/auth/logout-all"),
    onSuccess: () => dispatch(logout()),
  });

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold font-display">Settings</h1>

      <SettingsSection title="Appearance">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-sm">Theme</div>
            <p className="text-xs text-ink-500 mt-0.5">Switch between light and dark mode.</p>
          </div>
          <div className="flex items-center gap-1 bg-base-800/60 rounded-full p-1 shadow-clay-inset">
            <button
              onClick={() => setTheme("light")}
              className={`p-2 rounded-full transition-colors ${
                theme === "light" ? "bg-brand-gradient text-white" : "text-ink-500"
              }`}
              title="Light mode"
            >
              <HiSun className="text-sm" />
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`p-2 rounded-full transition-colors ${
                theme === "dark" ? "bg-brand-gradient text-white" : "text-ink-500"
              }`}
              title="Dark mode"
            >
              <HiMoon className="text-sm" />
            </button>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Notifications">
        <ToggleRow
          label="Email notifications"
          description="Get emailed about comments, mentions, and shares."
          checked={emailNotifs}
          disabled={updatePreferences.isPending}
          onChange={(v) => updatePreferences.mutate(v)}
        />
        {updatePreferences.isError && (
          <p className="text-xs text-accent-danger">Couldn't save that change - please try again.</p>
        )}
      </SettingsSection>

      <SettingsSection title="Security">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-sm">Log out of all devices</div>
            <p className="text-xs text-ink-500 mt-0.5">Revokes every active session, including this one.</p>
          </div>
          <button
            onClick={() => logoutAll.mutate()}
            disabled={logoutAll.isPending}
            className="btn-ghost text-sm px-4 py-2 text-accent-danger"
          >
            {logoutAll.isPending ? "Logging out…" : "Log out everywhere"}
          </button>
        </div>
      </SettingsSection>
    </div>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card p-6 space-y-4">
      <h2 className="font-display font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="font-medium text-sm">{label}</div>
        <p className="text-xs text-ink-500 mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        disabled={disabled}
        className={`w-11 h-6 rounded-full transition-colors relative shrink-0 disabled:opacity-60 ${
          checked ? "bg-brand-gradient" : "bg-black/[0.08]"
        }`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
