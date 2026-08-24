export default function AdminLoading() {
  return (
    <div
      style={{
        minHeight: "50vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "4px solid #e5e7eb",
          borderTopColor: "#16a34a",
          animation: "sf-admin-spin 0.8s linear infinite",
        }}
      />
      <p style={{ fontSize: 13, color: "#9ca3af" }}>در حال بارگذاری...</p>
      <style>{`@keyframes sf-admin-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}