import { useAuth } from "../context/AuthContext";

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-800">Profile</h1>
      <div className=" border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 text-primary text-lg font-semibold">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <span className="text-lg font-semibold">{initials || "A"}</span>
            )}
          </div>
          <div>
            <p className="text-lg font-semibold text-zinc-900">{user.name}</p>
            <p className="text-sm text-zinc-500">{user.email}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <ProfileField label="Vendor ID" value={String(user.vendor_id)} />
          <ProfileField label="Restaurant Name" value={user.name} />
          <ProfileField label="Email" value={user.email} />
          <ProfileField label="Phone" value={user.phone} />
          <ProfileField label="Subdomain" value={user.subdomain} />
          <ProfileField
            label="Razorpay Key"
            value={user.razorpay_key_id || "Not available"}
          />
        </div>
      </div>
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
      <p className="mb-1 text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="text-sm font-medium text-zinc-900">{value}</p>
    </div>
  );
}
