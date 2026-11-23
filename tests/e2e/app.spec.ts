import { expect, test } from "@playwright/test";

test("compare five pairs, recover progress, show counts and persist demo matches", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /声を聴きはじめる/ }).click();
  await expect(page.locator(".voice-card")).toHaveCount(2);
  const lastChoice = await page.getByRole("button", { name: "どちらでもない", exact: true }).boundingBox();
  const nav = await page.getByRole("navigation", { name: "モバイルナビゲーション" }).boundingBox();
  expect(lastChoice!.y + lastChoice!.height).toBeLessThanOrEqual(nav!.y);
  await page.getByRole("button", { name: "左の声を再生", exact: true }).click();
  await expect(page.locator(".voice-card.left")).toHaveClass(/playing/);
  await page.getByRole("button", { name: "右の声を再生", exact: true }).click();
  await expect(page.locator(".voice-card.right")).toHaveClass(/playing/);
  await expect(page.locator(".voice-card.left")).not.toHaveClass(/playing/);
  await page.getByRole("button", { name: "右の声を停止" }).click();
  await expect(page.locator(".voice-card.right")).not.toHaveClass(/playing/);
  await page.getByRole("button", { name: "左が好き", exact: true }).click();
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem("voice-match:v1")!).session);
  await page.reload();
  await expect(page.locator(".session-progress strong")).toContainText("2");
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem("voice-match:v1")!).session);
  expect(after).toEqual(before);
  for (const choice of ["右が好き", "どちらも好き", "どちらでもない", "どちらも好き"]) await page.getByRole("button", { name: choice, exact: true }).click();
  await expect(page).toHaveURL(/insights/);
  await expect(page.locator(".stat").nth(0)).toContainText("5");
  await expect(page.locator(".stat").nth(1)).toContainText("6");
  await page.reload();
  await expect(page.locator(".history-row")).toHaveCount(5);
  await page.goto("/");
  await expect(page).toHaveURL(/insights/);
  await page.getByRole("link", { name: "気になる声を見返す" }).click();
  await expect(page.locator(".match-card")).toHaveCount(6);
  await page.getByRole("button", { name: "関心を送る", exact: true }).first().click();
  await page.reload();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("voice-match:v1")!).interests.length)).toBe(1);
  await expect(page.getByRole("button", { name: /送信済み|マッチ成立/ })).toHaveCount(1);
  await page.getByRole("button", { name: "この候補を非表示にする" }).first().click();
  await expect(page.locator(".match-card")).toHaveCount(5);
  await page.goto("/profile");
  await page.getByRole("button", { name: "表示を戻す" }).click();
  await page.getByRole("switch", { name: /ステレオ定位/ }).uncheck();
  await page.reload();
  await expect(page.getByRole("switch", { name: /ステレオ定位/ })).not.toBeChecked();
});

test("failed audio is retryable; rapid choices never submit a second pair", async ({ page }) => {
  await page.goto("/"); await page.getByRole("button", { name: /声を聴きはじめる/ }).click();
  await page.route("**/audio/demo/*", route => route.abort());
  await page.getByRole("button", { name: "左の声を再生", exact: true }).click();
  await expect(page.locator("main [role=alert]")).toContainText("音声を読み込めませんでした");
  await page.unroute("**/audio/demo/*");
  await page.getByRole("button", { name: "左の声を再生", exact: true }).click();
  await expect(page.locator(".voice-card.left")).toHaveClass(/playing/);
  await page.getByRole("button", { name: "どちらも好き", exact: true }).dblclick({ delay: 10 });
  const count = await page.evaluate(() => JSON.parse(localStorage.getItem("voice-match:v1")!).session.answers.length);
  expect(count).toBe(1);
});

test("360px layouts fit every route and expose labeled navigation", async ({ page }) => {
  for (const path of ["/", "/welcome", "/record", "/insights", "/matches", "/profile"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByRole("navigation", { name: "モバイルナビゲーション" })).toBeVisible();
  }
});

test("real MediaRecorder fake microphone: minimum, preview, persistence, cancellation and deletion", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium", "Chromium fake media device only; physical Safari recording remains unverified");
  await context.grantPermissions(["microphone"]);
  await page.goto("/record");
  await page.getByRole("button", { name: "録音をはじめる" }).click();
  await expect(page.getByRole("button", { name: "録音を停止" })).toBeVisible();
  await page.getByRole("button", { name: "録音を停止" }).click();
  await expect(page.locator("main [role=alert]")).toContainText("15秒以上");
  await page.getByRole("button", { name: "録音をはじめる" }).click();
  await expect(page.getByRole("timer")).toContainText("00:15", { timeout: 20000 });
  await page.getByRole("button", { name: "録音を停止" }).click();
  await expect(page.getByRole("heading", { name: "公開前プレビュー" })).toBeVisible();
  await page.getByRole("button", { name: "非公開で保存" }).click();
  await expect(page.getByRole("status")).toContainText("非公開で保存しました");
  await page.reload();
  await expect(page.getByRole("heading", { name: "保存済みの録音" })).toBeVisible();
  expect(await page.locator("audio").evaluate(async (audio: HTMLAudioElement) => { await audio.play(); return !audio.paused; })).toBe(true);
  await page.getByRole("button", { name: "録音をはじめる" }).click();
  await expect(page.getByRole("timer")).toContainText("00:15", { timeout: 20000 });
  await page.getByRole("button", { name: "録音を停止" }).click();
  await page.getByRole("button", { name: "取り消す" }).click();
  await expect(page.getByRole("heading", { name: "保存済みの録音" })).toBeVisible();
  await page.goto("/profile");
  await expect(page.locator(".saved-recording")).toHaveCount(1);
  await page.getByRole("checkbox", { name: "端末内デモで公開希望" }).click();
  await expect(page.getByRole("checkbox", { name: "端末内デモで公開希望" })).toBeChecked();
  await page.reload();
  await expect(page.getByRole("checkbox", { name: "端末内デモで公開希望" })).toBeChecked();
  await page.getByRole("checkbox", { name: "端末内デモで公開希望" }).click();
  await expect(page.getByRole("checkbox", { name: "端末内デモで公開希望" })).not.toBeChecked();
  await expect(page.getByRole("checkbox", { name: "端末内デモで公開希望" })).toBeEnabled();
  await page.getByRole("button", { name: "削除", exact: true }).click();
  await page.getByRole("button", { name: "録音を削除する", exact: true }).click();
  await expect(page.locator(".saved-recording")).toHaveCount(0);
  await page.reload();
  await expect(page.locator(".saved-recording")).toHaveCount(0);
});

test("microphone denial, missing recorder and storage quota have actionable errors", async ({ page }) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => { throw new DOMException("denied", "NotAllowedError"); };
  });
  await page.goto("/record");
  await page.getByRole("button", { name: "録音をはじめる" }).click();
  await expect(page.locator("main [role=alert]")).toContainText("サイト設定でマイクを許可");
  await page.evaluate(() => Object.defineProperty(window, "MediaRecorder", { value: undefined, configurable: true }));
  await page.getByRole("button", { name: "録音をはじめる" }).click();
  await expect(page.locator("main [role=alert]")).toContainText("このブラウザでは録音できません");
  await page.goto("/");
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException("full", "QuotaExceededError"); }; });
  await page.getByRole("button", { name: /声を聴きはじめる/ }).click();
  await expect(page.locator("main [role=alert]")).toContainText("空き容量");
  expect(await page.evaluate(() => localStorage.getItem("voice-match:v1"))).toBeNull();
});

test("explicit interests distinguish sent and reciprocal match and persist photo intent", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /声を聴きはじめる/ }).click();
  for (let i = 0; i < 5; i++) await page.getByRole("button", { name: "どちらも好き", exact: true }).click();
  await page.getByRole("link", { name: "気になる声を見返す" }).click();
  await page.locator(".match-card").nth(0).getByRole("button", { name: "関心を送る", exact: true }).click();
  await page.locator(".match-card").nth(1).getByRole("button", { name: "関心を送る", exact: true }).click();
  await expect(page.getByRole("button", { name: "マッチ成立（デモ）", exact: true })).toHaveCount(1);
  await expect(page.getByRole("button", { name: "関心を送信済み（デモ）", exact: true })).toHaveCount(1);
  await page.getByRole("checkbox", { name: /写真の公開を希望する/ }).check();
  await page.reload();
  await expect(page.getByRole("checkbox", { name: /写真の公開を希望する/ })).toBeChecked();
  await expect(page.locator("img")).toHaveCount(0);
});

test("recording auto stops at 30 seconds and releases microphone on leaving", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium", "Chromium fake media device only");
  await context.grantPermissions(["microphone"]);
  await page.addInitScript(() => {
    const getMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = async constraints => {
      const input = await getMedia(constraints);
      (window as typeof window & { testTracks: MediaStreamTrack[] }).testTracks = input.getTracks();
      return input;
    };
  });
  await page.goto("/record");
  await page.getByLabel("話すテーマ").selectOption("weekend");
  await page.getByRole("button", { name: "録音をはじめる" }).click();
  await expect(page.getByRole("heading", { name: "公開前プレビュー" })).toBeVisible({ timeout: 35000 });
  await expect(page.getByRole("timer")).toContainText("00:30");
  expect(await page.evaluate(() => (window as typeof window & { testTracks: MediaStreamTrack[] }).testTracks.every(t => t.readyState === "ended"))).toBe(true);
  await page.getByRole("button", { name: "非公開で保存" }).click();
  await expect(page.getByRole("status")).toContainText("非公開で保存");
  await page.getByLabel("話すテーマ").selectOption("intro");
  await expect(page.locator("audio")).toHaveCount(0);
  await page.getByRole("button", { name: "録音をはじめる" }).click();
  await expect(page.getByRole("button", { name: "録音を停止" })).toBeVisible();
  await page.getByRole("navigation", { name: "モバイルナビゲーション" }).getByRole("link", { name: "マイページ" }).click();
  await expect(page).toHaveURL(/profile/);
  expect(await page.evaluate(() => (window as typeof window & { testTracks: MediaStreamTrack[] }).testTracks.every(t => t.readyState === "ended"))).toBe(true);
  await expect(page.locator(".saved-recording h3")).toHaveText("休日の過ごし方");
});
