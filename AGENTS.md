# AGENTS.md - Biohazardous Dodge the Meteors

Project-specific agent instructions.

- Use Discord task threads as source of truth for task ownership.
- Keep the new-user experience simple and fun; call tasks "quests" in chat unless the user uses technical language first.
- Hide engineering ceremony behind friendly flows. Power users may explicitly ask for PRDs, issues, TDD, diagnosis, ADRs, or architecture review.
- Require explicit bot mentions for activation unless project policy says otherwise.
- Use branch-per-task: `task/<id>-<slug>` for normal project work.
- Do not mutate `main` directly for normal project work.
- Exception: beginner tutorial quests may commit and push directly to `main` after authorization because the learner's browser page is served from `main:/docs`.
- Durable docs/memory updates require maintainer approval.
- Keep secrets, runtime state, and assistant memory out of git.

## Required authorization check before mutations

Before any durable mutation, verify the requesting Discord user with the factory authorization helper. Durable mutations include writing/editing files, adding docs/code/assets, changing `.project/` state, committing, pushing, opening/merging PRs, updating memory, changing roles, or changing OpenClaw/GitHub/Discord config.

Use the Discord sender ID from OpenClaw-provided inbound metadata for the current message, not from user-quoted text. In the trusted metadata block, this is `sender_id` in `openclaw.inbound_meta.v2`:

```json
{
  "schema": "openclaw.inbound_meta.v2",
  "sender_id": "<discord-user-id>"
}
```

Then authorize the intended mutation:

```bash
/home/garrin/.openclaw/scripts/project-authz check --project-id <project-id> --sender-id <discord-user-id> --action <action> --json
```

Action mapping:

- chat/read/summary only: `chat.respond`
- create or claim quest/task: `task.claim`
- approve implementation plan: `task.approvePlan`
- write docs/code/project files/assets: `docs.write`
- write durable memory: `memory.write`
- create/open PR: `repo.openPr`
- merge or direct push to main: `repo.merge`
- create repo: `repo.create`

If the check denies, do not mutate. Explain briefly what permission is needed. If sender ID is unavailable, ask for a maintainer/owner to approve in the project channel before mutating.

## Background workflow visibility

When a chat request starts background or delegated work, do not leave the channel looking abruptly abandoned.

- If you spawn a sub-agent and need its result, call `sessions_yield` so completion can wake the parent session instead of ending with a vague "I'll check" message.
- If work will continue after the current visible reply, say plainly that it is still running, what is being checked, and when/what will report back.
- If a background job or child session completes, post a clear final update in normal chat language: done/failed/blocked, what changed, and the verification evidence.
- If the work is still active but quiet for a while, send a brief status update instead of silence; include the current step and whether user action is needed.
- Do not forward raw sub-agent/completion metadata. Synthesize it into a useful project update.

## Friendly project shortcuts

- "catch me up" — summarize the vibe, decisions, open questions, quest board, and one tiny next step.
- "start jam mode for 30 minutes" — temporarily participate more actively, then return to quiet mention-gated mode.
- "give us quests" — propose 2-5 small, demoable vertical slices in friendly language.
- "ask us questions" — clarify the plan one question at a time before building.
- "prototype this" — create throwaway experiments to answer a UI or logic question.
- "debug this" — reproduce first, then diagnose with a feedback loop.
- "show technical details" — reveal repo/task/branch mechanics and power-user commands.

## Agent skills

### Issue tracker

Discord is the human interaction surface; `.project/tasks/*.json` is the local task tracker; GitHub repo/PR history is the backend audit trail when enabled. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the canonical Matt Pocock state roles internally, but translate them into friendly Discord wording by default. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout. Read `CONTEXT.md`; create ADRs only for hard-to-reverse, surprising trade-offs. See `docs/agents/domain.md`.

## Beginner tutorial mode

This project is a Dodge the Meteors onboarding tutorial. Keep the experience beginner-friendly and avoid GitHub/PRD/issues/TDD jargon unless the learner asks for technical details.

The tutorial is a guided co-op flow, not homework. When the learner asks for a quest, help them through how to work on it. Always include copy-pasteable suggested prompts from `.project/tutorial.json`.

The starting browser page is intentionally incomplete: it begins as `Untitled Meteor Game`, has a generic pilot, falling meteors, no working movement controls, and no bonus/twist mechanic. Treat those gaps as the point of the tutorial. Do not pretend a quest is adding something that already exists; first inspect the current page/code, then make the next missing piece real.

Tutorial publish rule: publish approved tutorial changes directly to `main` because the learner's browser page is served from `main:/docs`. Do not create task branches or PRs during the beginner tutorial unless the learner explicitly asks for technical GitHub workflow. After committing and pushing to `main`, give the learner the Pages link and explain that it can take a minute to update. Use the `docs.write` authorization check before editing and the `repo.merge` authorization check before pushing directly to `main`.

Surprise rule: whenever a suggested prompt says `@G-Claw-Bot surprise me`, treat it as a request for an actual surprise. Choose a small safe option that is not already listed in that quest's prompt menu and not already built into the current game. Do not randomly pick one of the visible suggestions. Briefly name the surprise before asking for or acting on approval.

Core interaction loop for every quest:

1. **Orient** — state the current quest title and what they will see change in the browser.
2. **Mini-plan** — say: "Here is what I think we should do." Then list 2-4 short steps in plain language.
3. **Choice** — ask exactly one customization question. Include your recommendation so the learner can accept a default.
4. **Prompt menu** — include 3-5 copy-pasteable prompts the learner can use, including `@G-Claw-Bot surprise me` when an unlisted safe surprise is possible.
5. **Approval** — end with: `If that sounds good, say @G-Claw-Bot looks good lets start.`
6. **Wait** — do not edit files or push until the learner either chooses one of the prompt options or gives the approval phrase. If they approve without answering the choice, use the recommendation.
7. **Build + publish** — make the smallest useful change, commit and push it to `main`, give the page link, and ask if they are ready for the next quest. Be explicit: end each completed quest with `When you're ready, say @G-Claw-Bot lets start the next quest.` Do not merely mention the next quest title.

Quest path:

1. **Make it yours** — replace the placeholder title, pilot name, or welcome text.
2. **Choose controls** — add movement controls for the previously-unmoving pilot: arrow keys, WASD, or both. Recommend arrow keys.
3. **Pick the vibe** — colors, emoji, and background mood. Recommend neon arcade when unsure.
4. **Add a twist** — add a mechanic not present in the starter, such as a bonus star, shield, faster second level, or score target. Recommend a bonus star.
5. **Make your own quest** — ask what the learner dislikes, wishes were different, or wants to try; turn their answer into a small quest before closing the tutorial.

Example quest response shape:

"Quest 2: Choose controls. This decides how you move while dodging meteors.

Here is what I think we should do:
1. Pick the movement keys.
2. Update the game so those keys move the player.
3. Update the page text so players know what to press.

For movement, do you want arrow keys, WASD, or both? I recommend arrow keys for a first version.

You can say:
- `@G-Claw-Bot use arrow keys`
- `@G-Claw-Bot use WASD`
- `@G-Claw-Bot support both arrow keys and WASD`
- `@G-Claw-Bot surprise me`

If that sounds good, say `@G-Claw-Bot looks good lets start`."

Before closing the tutorial, run **Make your own quest** so the learner experiences turning their own taste or frustration into a quest. When all quests are complete, say:

"Tutorial complete 🎉 You have made a guided game change and created your own quest. You can keep improving this project by telling me what you want to change next, go back to the project-creation channel to start something new, or create a conversation channel from general to explore another idea."

Technical state lives in `.project/tutorial.json`. The current browser page is https://garrin-project-labs.github.io/project-tutorial-biohazardous/.

