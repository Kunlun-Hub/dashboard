"use client";

import { useEffect, useState } from "react";
import { buildDeviceApprovalCopy } from "./DeviceApprovalContent";

export default function DeviceApprovalClient() {
  const [copy, setCopy] = useState(() => buildDeviceApprovalCopy({}));

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    setCopy(
      buildDeviceApprovalCopy({
        lang: searchParams.get("lang"),
        user: searchParams.get("user"),
        device: searchParams.get("device"),
        network: searchParams.get("network"),
      }),
    );
  }, []);

  return (
    <main className={"min-h-screen bg-neutral-100 text-neutral-950"}>
      <div
        className={
          "flex min-h-screen items-start justify-center px-4 pt-[16vh]"
        }
      >
        <section
          className={
            "w-full max-w-md rounded bg-white px-8 py-7 text-center shadow-lg shadow-neutral-300/60"
          }
        >
          <h1 className={"text-2xl font-semibold"}>{copy.title}</h1>
          <p className={"mt-5 text-sm leading-7"}>{copy.message}</p>
          <p className={"mt-2 text-sm leading-7"}>{copy.hint}</p>
        </section>
      </div>
    </main>
  );
}
