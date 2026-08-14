"use client";

import { useState, useEffect, useCallback } from "react";
import { Users2, Plus, LogOut, Ban, Gavel } from "lucide-react";
import {
  getAuctionGroupState, createBidGroup, joinBidGroup, leaveBidGroup, cancelBidGroup, placeGroupBid,
  type GroupStateResult,
} from "@/app/(shop)/auctions/group-actions";

export default function AuctionGroupBiddingBox({
  auctionId, entryFeePaid, minNextBid,
}: { auctionId: string; entryFeePaid: boolean; minNextBid: number }) {
  const [state, setState] = useState<GroupStateResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [pledgeInput, setPledgeInput] = useState("");
  const [joiningGroupId, setJoiningGroupId] = useState<string | null>(null);
  const [joinPledge, setJoinPledge] = useState("");
  const [groupBidAmount, setGroupBidAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const result = await getAuctionGroupState(auctionId);
    setState(result);
    setLoading(false);
  }, [auctionId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      refresh();
    }, 0);
    return () => clearTimeout(timer);
  }, [refresh]);

  if (!entryFeePaid || loading) return null;

  async function handleCreate() {
    setError(null);
    const pledge = Number(pledgeInput);
    if (!groupName.trim() || !pledge || pledge <= 0) { setError("نام گروه و مبلغ سهم را وارد کنید."); return; }
    setBusy(true);
    const result = await createBidGroup(auctionId, groupName.trim(), pledge);
    setBusy(false);
    if (result?.error) { setError(result.error); return; }
    setShowCreate(false);
    setGroupName("");
    setPledgeInput("");
    setMessage("گروه با موفقیت ساخته شد. حالا می‌توانید از دیگران بخواهید به گروه شما ملحق شوند.");
    refresh();
  }

  async function handleJoin(groupId: string) {
    setError(null);
    const pledge = Number(joinPledge);
    if (!pledge || pledge <= 0) { setError("مبلغ سهم خود را وارد کنید."); return; }
    setBusy(true);
    const result = await joinBidGroup(groupId, auctionId, pledge);
    setBusy(false);
    if (result?.error) { setError(result.error); return; }
    setJoiningGroupId(null);
    setJoinPledge("");
    setMessage("با موفقیت به گروه پیوستید.");
    refresh();
  }

  async function handleLeave() {
    if (!state?.myGroup) return;
    if (!confirm("آیا از خروج از این گروه مطمئن هستید؟")) return;
    setBusy(true);
    const result = await leaveBidGroup(state.myGroup.id, auctionId);
    setBusy(false);
    if (result?.error) { setError(result.error); return; }
    refresh();
  }

  async function handleCancel() {
    if (!state?.myGroup) return;
    if (!confirm("آیا از لغو این گروه مطمئن هستید؟")) return;
    setBusy(true);
    const result = await cancelBidGroup(state.myGroup.id, auctionId);
    setBusy(false);
    if (result?.error) { setError(result.error); return; }
    refresh();
  }

  async function handleGroupBid() {
    if (!state?.myGroup) return;
    setError(null);
    const amount = Number(groupBidAmount);
    if (!amount || amount < minNextBid) { setError(`مبلغ پیشنهاد گروهی باید حداقل ${minNextBid.toLocaleString("fa-IR")} تومان باشد.`); return; }
    if (amount > state.myGroup.totalPledged) { setError(`مبلغ پیشنهاد نمی‌تواند بیش از مجموع سهم‌های گروه (${state.myGroup.totalPledged.toLocaleString("fa-IR")} تومان) باشد.`); return; }
    if (!confirm(`آیا از ثبت پیشنهاد گروهی ${amount.toLocaleString("fa-IR")} تومانی مطمئن هستید؟`)) return;
    setBusy(true);
    const result = await placeGroupBid(state.myGroup.id, auctionId, amount);
    setBusy(false);
    if (result?.error) { setError(result.error); return; }
    setMessage("پیشنهاد گروهی با موفقیت ثبت شد.");
    refresh();
  }

  return (
    <div className="proxy-bid-box" style={{ marginTop: 14 }}>
      <p className="text-xs text-gray-600 flex items-center gap-1 mb-2"><Users2 size={13} className="text-blue-500" /> پیشنهاد گروهی</p>

      {error && <p className="text-red-600 text-xs mb-2">{error}</p>}
      {message && <p className="text-green-600 text-xs mb-2">{message}</p>}

      {state?.myGroup ? (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">
            شما عضو گروه «<b>{state.myGroup.name}</b>» هستید — مجموع سهم‌ها: <b>{state.myGroup.totalPledged.toLocaleString("fa-IR")}</b> تومان
          </p>
          <div className="space-y-1">
            {state.myGroup.members.map((m) => (
              <div key={m.userId} className="flex justify-between text-xs text-gray-600 border-b border-gray-100 pb-1">
                <span>{m.name}{m.isLeader ? " (سرگروه)" : ""}{m.isMe ? " — شما" : ""}</span>
                <span>{m.pledgeAmount.toLocaleString("fa-IR")} تومان</span>
              </div>
            ))}
          </div>

          {state.myGroup.isLeader && state.myGroup.status === "OPEN" && (
            <div className="flex gap-2 mt-2">
              <input
                type="number"
                value={groupBidAmount}
                onChange={(e) => setGroupBidAmount(e.target.value)}
                placeholder={`حداقل ${minNextBid.toLocaleString("fa-IR")}`}
                className="admin-input"
                style={{ flex: 1 }}
              />
              <button onClick={handleGroupBid} disabled={busy} className="admin-btn admin-btn-primary flex items-center gap-1">
                <Gavel size={13} /> ثبت پیشنهاد گروه
              </button>
            </div>
          )}
          {state.myGroup.status === "LOCKED" && (
            <p className="text-xs text-amber-600">این گروه پیشنهاد خود را ثبت کرده و دیگر عضو جدید نمی‌پذیرد.</p>
          )}

          <div className="flex gap-2 mt-2">
            {state.myGroup.isLeader ? (
              state.myGroup.status === "OPEN" && (
                <button onClick={handleCancel} disabled={busy} className="admin-btn admin-btn-danger flex items-center gap-1"><Ban size={12} /> لغو گروه</button>
              )
            ) : (
              state.myGroup.status === "OPEN" && (
                <button onClick={handleLeave} disabled={busy} className="admin-btn admin-btn-secondary flex items-center gap-1"><LogOut size={12} /> خروج از گروه</button>
              )
            )}
          </div>
        </div>
      ) : (
        <>
          {state?.openGroups && state.openGroups.length > 0 && (
            <div className="space-y-2 mb-3">
              <p className="text-xs text-gray-500">گروه‌های باز برای پیوستن:</p>
              {state.openGroups.map((g) => (
                <div key={g.id} className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2">
                  <div className="text-xs text-gray-600">
                    <b>{g.name}</b> — سرگروه: {g.leaderName} — {g.memberCount.toLocaleString("fa-IR")} عضو — مجموع سهم: {g.totalPledged.toLocaleString("fa-IR")} تومان
                  </div>
                  {joiningGroupId === g.id ? (
                    <div className="flex gap-1">
                      <input type="number" value={joinPledge} onChange={(e) => setJoinPledge(e.target.value)} placeholder="سهم شما" className="admin-input" style={{ width: 90 }} />
                      <button onClick={() => handleJoin(g.id)} disabled={busy} className="admin-btn admin-btn-primary">ثبت</button>
                    </div>
                  ) : (
                    <button onClick={() => setJoiningGroupId(g.id)} className="admin-btn admin-btn-secondary">پیوستن</button>
                  )}
                </div>
              ))}
            </div>
          )}

          {!showCreate ? (
            <button onClick={() => setShowCreate(true)} className="text-xs text-gray-600 flex items-center gap-1">
              <Plus size={13} className="text-blue-500" /> ساخت گروه پیشنهاد جدید
            </button>
          ) : (
            <div className="space-y-2">
              <input type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="نام گروه (مثلاً «همکاران اداره»)" className="admin-input" />
              <input type="number" value={pledgeInput} onChange={(e) => setPledgeInput(e.target.value)} placeholder="سهم شما (تومان)" className="admin-input" />
              <button onClick={handleCreate} disabled={busy} className="admin-btn admin-btn-primary">ساخت گروه</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}