"use strict";
(() => {
  const id = name => document.getElementById(name);
  const fileInput = id("local-file");
  const expectedSHA = "7699b0abf182c6e13ab086296aab102adfbb8572886d05c086f9487a60b063a5";
  const byteLength = 266736;
  let unmount = () => {};
  let selection = 0;

  function show(source) {
    unmount();
    id("stage").replaceChildren(id("reader-template").content.cloneNode(true));
    unmount = mountReader(source);
    id("mode").textContent = source.recorded ? "AJILE12 · Local recording" : "Fictional practice trace";
    id("intro").textContent = source.recorded
      ? "The team marked a right-wrist reach at " + source.eventTime.toFixed(3) + " seconds on the original recording clock."
      : "Try the controls on an invented electrode layout and two drawn arms. An exact second from a human recording can be opened below.";
    id("source-status").textContent = source.recorded
      ? "Verified recording open on this device. The file stays in this tab until you switch back or close it."
      : "The practice signal and arm paths are generated from simple curves.";
    id("practice-reset").hidden = !source.recorded;
    id("load-error").hidden = true;
  }

  async function readFile(file, ticket) {
    if (file.size !== byteLength) throw Error("This file differs from the one-second format. Use the converter below.");
    if (!globalThis.crypto?.subtle) throw Error("File verification needs a current browser. Open the offline edition or the secure live page.");
    const bytes = await file.arrayBuffer();
    const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
    const hex = Array.from(digest, n => n.toString(16).padStart(2,"0")).join("");
    if (hex !== expectedSHA) throw Error("The file differs from the verified AJILE12 example. Check the source version and rerun the converter.");
    if (ticket !== selection) return;
    const source = JSON.parse(new TextDecoder().decode(bytes));
    source.recorded = true;
    // The converter verifies the original zero-based 500 Hz and 30 Hz clocks.
    source.rowStart = Math.round(source.metadata.ecog_time_s[0] * 500);
    source.frameStart = Math.round(source.metadata.pose_time_s[0] * 30);
    show(source);
  }

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (!file) return;
    const ticket = ++selection;
    fileInput.value = "";
    try {
      await readFile(file, ticket);
    } catch (error) {
      if (ticket !== selection) return;
      id("load-error").textContent = error.message + " The current view is still open.";
      id("load-error").hidden = false;
    }
  });
  id("practice-reset").addEventListener("click", () => {
    selection++;
    show(fictionalReach());
  });
  show(fictionalReach());
})();
