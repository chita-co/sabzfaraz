export default function ShopLoading() {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: 40,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: "4px solid rgba(22,163,74,0.15)",
          borderTopColor: "#16a34a",
          animation: "sf-spin 0.8s linear infinite",
        }}
      />
      <p style={{ fontSize: 13, color: "#9ca3af" }}>در حال بارگذاری...</p>
      <style>{`@keyframes sf-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}