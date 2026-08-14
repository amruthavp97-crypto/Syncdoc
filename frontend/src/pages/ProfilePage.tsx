import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { useAppSelector } from "@/app/hooks";

interface ProfileResponse {
  user: {
    name: string;
    email: string;
    bio?: string;
    skills: string[];
    country?: string;
    timezone?: string;
  };
  stats: { documentsCreated: number; documentsShared: number };
}

export default function ProfilePage() {
  const currentUser = useAppSelector((s) => s.auth.user);
  const queryClient = useQueryClient();
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");

  const { data } = useQuery({
    queryKey: ["profile", currentUser?.id],
    queryFn: async () => (await api.get<ProfileResponse>(`/users/${currentUser!.id}`)).data,
    enabled: Boolean(currentUser),
  });

  useEffect(() => {
    if (data?.user) {
      setBio(data.user.bio || "");
      setSkills((data.user.skills || []).join(", "));
    }
  }, [data]);

  const saveProfile = useMutation({
    mutationFn: () =>
      api.patch("/users/me", {
        bio,
        skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
  });

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold font-display">Profile</h1>

      <div className="glass-card p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-brand-gradient grid place-items-center text-xl font-bold">
          {currentUser?.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
        </div>
        <div>
          <div className="text-lg font-semibold">{currentUser?.name}</div>
          <div className="text-sm text-ink-500">{currentUser?.email}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="stat-card">
          <span className="text-ink-500 text-sm">Documents created</span>
          <span className="text-2xl font-bold font-display">{data?.stats.documentsCreated ?? "—"}</span>
        </div>
        <div className="stat-card">
          <span className="text-ink-500 text-sm">Documents shared with you</span>
          <span className="text-2xl font-bold font-display">{data?.stats.documentsShared ?? "—"}</span>
        </div>
      </div>

      <div className="glass-card p-6 space-y-4">
        <div>
          <label className="text-sm text-ink-500 mb-1.5 block">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="input-field resize-none"
            placeholder="Tell your team a bit about yourself…"
          />
        </div>
        <div>
          <label className="text-sm text-ink-500 mb-1.5 block">Skills (comma separated)</label>
          <input
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            className="input-field"
            placeholder="Product design, TypeScript, Technical writing"
          />
        </div>
        <button onClick={() => saveProfile.mutate()} disabled={saveProfile.isPending} className="btn-gradient">
          {saveProfile.isPending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
