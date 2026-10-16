# Imposter — Project Specification & UX Behavior

**Document purpose:** Agent handoff for the private MVP  
**Product name:** *Imposter* (working name)  
**Release target:** Private use by the owner's friend group on Discord; public release is a future decision, not part of this MVP.  
**Platform:** Responsive web app; mobile-first, desktop second.  
**Deployment direction:** Cloudflare and a monorepo. The project owner will choose the specific Cloudflare services, frameworks, tooling, and repository structure.

---

## 1. Product Overview

Imposter is a web companion for a face-to-face or Discord voice-chat party game. Every participant uses their own device to join the same room and privately view a role card. Most players receive the same secret word. One randomly selected player is the **Imposter** and does not receive the word.

Players talk in Discord voice chat and describe the word without making it too obvious. The Imposter listens, tries to infer the word, and describes what they think it might be while attempting to blend in. The app does **not** provide voice chat or manage the discussion. It synchronizes the room, distributes private cards, and runs a timer. At the end, the host facilitates the vote verbally and reveals all cards in the app.

### Product goals

1. Make it easy for friends to sign in, create a room, and invite each other with a short room code.
2. Give every participant a private, individual role card on their own device.
3. Select one Imposter and one familiar, medium-difficulty word for each round.
4. Keep the room state, readiness, round start, timer, and card reveal synchronized for all connected participants.
5. Keep UX and implementation scope small enough for a private MVP.

### Core principles

- **The app supports the game; it does not adjudicate the game.**
- **Secrets must remain private until the host reveals all cards.**
- **The host controls starting rounds and revealing cards.**
- **Everyone must be ready before a round can start.**
- **No reconnection or host-transfer flow is required for the MVP.**
- **The owner controls visual design. This document specifies UX behavior, not colors, typography, or a visual theme.**

---

## 2. In Scope

- Public landing page.
- Account creation using email, password, and username.
- Login using email and password.
- Authenticated users can create rooms or join an existing room using its code.
- A generated room code and a live lobby.
- Host and participant player cards.
- Ready/not-ready state.
- Host-configurable timer with 15-, 20-, 25-, and 30-minute presets plus a custom duration.
- Random selection of a word from a curated, built-in word pool.
- Random selection of one Imposter each round.
- Private, hideable/revealable personal cards.
- A server-authoritative countdown visible to all participants.
- New players are refused once a round has started; they may try to join after that round has ended and the room is accepting players again.
- Host-triggered reveal of every player's role after the timer ends and the verbal vote has happened outside the app.
- Ready-up and repeat-round flow.
- Basic disconnect handling: remove disconnected participants; close the room if the host disconnects.
- Mobile-first responsive layout, with desktop support.
- Clear loading, empty, validation, and error states.

## 3. Out of Scope

Do not add these unless the project owner requests them later:

- In-app voice or text chat.
- In-app voting, vote counting, or winner detection.
- Automatic word-guess submission or immediate win conditions.
- Scoreboards, rankings, profiles beyond required account identity, achievements, or persistent game statistics.
- Public matchmaking, public room discovery, or a spectator mode.
- Custom word entry or user-created word packs.
- Bots, AI players, or automated moderation of the spoken discussion.
- Reconnection/rejoin recovery, host migration, or host transfer.
- Monetization, ads, subscriptions, or public-launch growth features.
- Any particular frontend framework, backend framework, database, realtime service, authentication library, monorepo tool, or Cloudflare product selection. The owner chooses these.

---

## 4. Users and Permissions

### Visitor
- Can view the landing page and learn what the game is.
- Must create an account or log in before creating or joining a room.

### Authenticated participant
- Can create a room and become its host, or join another room with its code.
- Can set their own ready state while the room is waiting for the next round.
- Can reveal and hide only their own secret card before the global reveal.
- Can see the shared timer, participant names, and their statuses.
- Cannot start a round or reveal everyone's cards unless they are the host.
- Cannot inspect another participant's hidden role or word.

### Host
- Is also a regular participant and occupies a player card.
- Can configure the timer while the room is waiting for a round.
- Can start a round only when all current participants are ready and the room meets the minimum player count agreed for implementation.
- Can trigger the global card reveal once the timer has ended.
- If the host disconnects, the room closes for everyone. There is no host transfer.

**Important:** The host must not receive privileged access to other players' secret roles or words before the global reveal. Host status grants room controls, not access to hidden game assignments.

---

## 5. User Journey

1. Visitor opens the landing page.
2. Visitor selects **Sign Up** or **Log In**.
3. New user creates an account with email, password, and username. Existing user logs in with email and password.
4. Authenticated user returns to the main entry point and chooses **Create Room** or **Join Room**.
5. **Create Room:** the app creates the room immediately, generates a unique code, and opens its lobby. No room setup wizard is shown.
6. **Join Room:** the user enters the room code. If the room is waiting for a round, they join the lobby. If a round is in progress, joining is refused with a clear message.
7. Players mark themselves **Ready**. The host configures the timer. The host can start only when everyone is ready and the minimum player-count rule is satisfied.
8. The app assigns one random Imposter and one random word from the curated word bank to the other participants. The round begins and the synchronized timer starts.
9. Each player taps their own card to reveal their word or Imposter role. They can hide it again.
10. Players discuss the word in Discord voice chat. The app does not manage this discussion.
11. When the timer reaches zero, the app stops the countdown and enters an **Awaiting Reveal** state. Players vote verbally outside the app.
12. After the vote, the host selects **Reveal Cards**. All roles are shown to all participants.
13. The room returns to a between-round state. Everyone must mark themselves Ready again before the host can start another round. The room code remains the same.

---

## 6. UX and Screen Requirements

The owner is responsible for visual style. The following specifies content, actions, and behavior only.

### 6.1 Landing page

Must contain:
- A concise explanation of the Imposter game.
- **Create Room** and **Join Room** as the primary actions.
- **Log In** and **Sign Up** actions.

Behavior:
- Visitors can view the page without an account.
- Selecting Create Room or Join Room while signed out routes the user to authentication first. After successful authentication, return them to the intended action where practical; do not silently create/join a room before authentication completes.
- Once signed in, Create Room and Join Room are available.

### 6.2 Sign-up page

Fields:
- Username.
- Email.
- Password.

Behavior:
- Validate required fields and email format.
- Show actionable validation and account-creation errors without clearing all valid input unnecessarily.
- Do not display passwords in plain text by default; provide a show/hide control if desired by the implementation.
- On success, authenticate the user and return them to the intended destination or landing page.
- Email verification and password-recovery requirements were not defined in discovery; do not introduce a custom flow without agreement from the owner.

### 6.3 Login page

Fields:
- Email.
- Password.

Behavior:
- Validate required fields.
- Show a clear message for invalid credentials or other login failures without exposing sensitive account details.
- On success, return to the intended destination or landing page.

### 6.4 Join Room

Content:
- Room-code input.
- Join action.
- Clear way to return to the landing page.

Behavior:
- Trim surrounding whitespace and normalize code case if the selected code format supports it.
- Invalid or nonexistent code: show a useful error.
- Room already in an active round: refuse entry and explain that the user can join after the round finishes, if the room remains available.
- Valid room in a joinable state: add the participant to the lobby and broadcast the updated participant list.
- Joining must be authenticated.

### 6.5 Waiting lobby

This is the main room screen and should not require a separate room-configuration screen.

Must show:
- Room code, with a copy action.
- Participant cards, including the host's card.
- Username on each card.
- A clear Ready / Not Ready status.
- Ready action for the current user.
- Timer preset and custom-duration controls for the host.
- Start Round control for the host.
- A concise indication when the host cannot start yet, such as some players not being ready.

Player slots:
- Show the current participants as cards.
- It is acceptable to show a small number of empty placeholders initially, but do not impose a maximum player limit. Add participant cards as more users join.
- No fixed player cap was requested.

Readiness:
- Each participant controls their own readiness.
- A player who has not marked Ready is Not Ready.
- The host is a participant and must also be Ready.
- The host cannot start until every participant currently in the room is Ready and the minimum player-count rule is satisfied.
- Any join or departure before a round starts must update the lobby for all remaining users and be reflected in the all-ready check.

Timer settings:
- Presets: **15 minutes**, **20 minutes**, **25 minutes**, and **30 minutes**.
- Also support a custom duration entered in minutes.
- The host chooses the duration while the room is waiting for a round.
- Timer settings cannot be changed while a round is active or awaiting reveal.
- The selected duration may persist for subsequent rounds until the host changes it.
- Reject empty, nonnumeric, zero, or negative custom values. Define reasonable accepted custom bounds during implementation and make the validation visible.

Start Round:
- Only the host can start.
- Start is unavailable until all players are Ready and the minimum player count is met.
- Starting locks the room to new joiners for the duration of that round.
- On start, readiness controls are hidden or disabled until the between-round state.

### 6.6 Active round

Must show:
- Countdown timer prominently at the top.
- Participant cards with usernames and relevant status.
- The current user's own card, which can be tapped/clicked to reveal or hide their assigned information.

Private-card behavior:
- Ordinary participant's card reveals the secret word.
- Imposter's card reveals that the user is the Imposter and does **not** display the secret word.
- Tapping the card again hides its secret content.
- Before the global reveal, other players' cards must not reveal their words or roles, including to the host.
- Each user can reveal/hide their own card independently; one user's action must not reveal another user's secret.
- When a player card is not the current user's card, it must not expose hidden data through its UI or client-accessible data model.

Timer behavior:
- The server is authoritative for round start time, duration, and expiration.
- All participants see a synchronized countdown based on authoritative time, not independent client-only timers.
- Backgrounding a phone, refreshing a display, or slowing a browser must not extend the round.
- Only the host can initiate the round.
- The timer cannot be paused or reset by participants unless the owner adds that requirement later.

Gameplay boundary:
- Players talk in Discord voice chat or in person.
- The app does not listen to, record, transcribe, or process the voice conversation.
- The app does not accept guesses, run a vote, track votes, or calculate a winner.

### 6.7 Timer expired / awaiting reveal

When the timer reaches zero:
- Stop the countdown at zero and clearly indicate that time has expired.
- Keep individual roles private until the host reveals all cards.
- Show the host a **Reveal Cards** action.
- Other users see a waiting state indicating that the host will reveal the cards after the vote.
- The group votes verbally outside the app. Do not add an in-app vote or winner selection.
- Prevent a new round from starting before the reveal has happened.

### 6.8 Global card reveal / between rounds

When the host selects **Reveal Cards** after time has expired:
- Show each participant's username and role to all room members.
- Clearly identify the Imposter.
- Show the round's secret word to all participants, including the Imposter.
- This is a reveal of assignments, not an automatic declaration of the winner.
- Return the room to a between-round lobby state.
- Reset readiness so everyone must click Ready again.
- The host may start the next round only once everyone is Ready and the minimum player-count rule is satisfied.
- Keep the same room and room code for repeated rounds unless the room closes.

### 6.9 Disconnect and room-closure behavior

Participant disconnect:
- Once the backend determines that a non-host participant is disconnected/offline, remove that participant from the room and update all remaining clients.
- Do not offer a reconnection flow, rejoin recovery, or a manual connection-troubleshooting sequence.
- Use a server-side presence/heartbeat policy to identify disconnects. The exact timeout is an implementation detail; avoid treating an unverified single missed packet as proof of disconnection.

Host disconnect:
- Once the backend determines that the host is disconnected/offline, close the room for everyone.
- Remove/terminate the room's active state and notify remaining participants with a clear message, for example: **“The host disconnected. This room has closed. Return to the home page to create or join another room.”**
- Provide a path back to the landing page.
- Do not transfer ownership to another participant.

If a room closes or a room code becomes invalid while a user is trying to join, show an understandable error and a route back to the landing page.

### 6.10 Loading, empty, and error states

Provide clear, consistent states for:
- Account creation/login in progress.
- Creating a room.
- Joining a room.
- Waiting for participants.
- Waiting for readiness.
- Starting a round / assigning roles.
- Timer expired and awaiting reveal.
- Room not found or invalid code.
- Attempt to join during an active round.
- Room closed by host disconnection.
- Permission errors (non-host tries host-only action).
- Temporary request failure.

Errors must explain what happened and what the user can do next. Do not show stack traces, infrastructure details, secret values, or raw internal errors to users.

---

## 7. Game Rules and Random Assignment

### Word pool

- Use a built-in, curated word list only for the MVP.
- Select one word randomly each round.
- Target **medium difficulty**: familiar everyday vocabulary that people commonly hear or use, but not so obvious that the round becomes trivial.
- Good areas include household objects, food, places, common activities, technology, entertainment, jobs, and familiar public places.
- Avoid obscure vocabulary, niche specialist terms, rare objects, and words that require specialist knowledge.
- Words should be reasonably describable from multiple angles so the regular players can discuss them without immediately saying the answer.
- Examples of the intended level: *elevator*, *headphones*, *airport*, *popcorn*, *photographer*. These illustrate the difficulty target; they are not the full word list.
- Do not provide a custom-word entry feature in the MVP.

### Role assignment

- Select exactly one Imposter at random from the eligible participants for each round.
- Give all other participants the same secret word.
- The Imposter receives only the Imposter role, not the secret word.
- The host is eligible to be randomly selected as Imposter.
- Re-randomize the Imposter and word on each new round. Do not add a turn-taking/fairness rotation unless requested.
- Use server-side random assignment; do not trust a client to choose or report its own role.

### Physical/Discord voting rule (context only)

At timer expiry, the players vote verbally outside the app:
- If they identify and vote for the Imposter, the non-Imposter players win.
- If they vote for a non-Imposter, the Imposter wins.

The app does **not** record the vote, validate the vote, decide who was voted for, or display a computed winner. The reveal simply exposes the assignments so the people playing can determine the outcome themselves.

---

## 8. Room Lifecycle and State Model

Implement an explicit room lifecycle so the clients cannot disagree about which actions are valid.

1. **Waiting Lobby** — room created; participants can join; timer can be set; users can Ready/Not Ready; host may start only when the start conditions are satisfied.
2. **Active Round** — roles and word have been assigned; new joiners are refused; countdown is running; users can privately reveal/hide their own cards.
3. **Awaiting Reveal** — timer expired; voting takes place outside the app; role secrecy remains in force; host can reveal all cards.
4. **Between Rounds / Revealed** — assignments are visible to everyone; readiness is reset; existing participants can Ready up; host can start another round once start conditions are satisfied.
5. **Closed** — room closed, including when the host disconnects; clients are notified and cannot continue playing in that room.

### Valid transitions

- Create Room → Waiting Lobby.
- Waiting Lobby → Active Round (host action + all Ready + minimum player count satisfied).
- Active Round → Awaiting Reveal (timer expires).
- Awaiting Reveal → Between Rounds / Revealed (host action).
- Between Rounds / Revealed → Active Round (host action + all Ready + minimum player count satisfied).
- Any live state → Closed (host disconnects).

New participants may join only while the room is in Waiting Lobby or Between Rounds / Revealed, not while the round is Active or Awaiting Reveal. If someone joins between rounds, they must be Ready along with everyone else before the next round can begin.

**Open product detail:** The exact minimum number of players required to start was not settled during discovery. Do not silently invent a rule; confirm with the project owner before implementation. There is no maximum player limit requested.

---

## 9. Functional Requirements

### Authentication
- **FR-001:** A visitor can view the landing page without authentication.
- **FR-002:** Creating or joining a room requires authentication.
- **FR-003:** Sign-up collects username, email, and password.
- **FR-004:** Login uses email and password.

### Rooms and lobby
- **FR-005:** An authenticated user can create a room without a setup wizard.
- **FR-006:** A created room has a unique room code and immediately opens its lobby.
- **FR-007:** An authenticated user can join a joinable room using its code.
- **FR-008:** The lobby displays the host and all current participants as player cards.
- **FR-009:** There is no fixed player cap in the product requirements.
- **FR-010:** Every participant can change their own Ready / Not Ready state while waiting for a round.
- **FR-011:** The host can start a round only when all participants are Ready and the agreed minimum player count is met.
- **FR-012:** Joining is refused while the room is in Active Round or Awaiting Reveal.

### Timer and rounds
- **FR-013:** The host can select 15, 20, 25, or 30 minutes, or enter a custom duration in minutes.
- **FR-014:** Starting a round locks the current participant set against new joins until the round has ended and the room is accepting joins again.
- **FR-015:** Starting a round assigns one Imposter and one shared secret word.
- **FR-016:** The countdown is synchronized and server-authoritative.
- **FR-017:** Timer expiration moves the room to Awaiting Reveal; it does not automatically reveal roles.
- **FR-018:** The host can reveal all roles only after the timer expires.
- **FR-019:** After global reveal, the room resets readiness and allows the host to start another round once the start conditions are met.

### Secret information
- **FR-020:** Each participant can reveal/hide only their own secret card before the global reveal.
- **FR-021:** All regular players in a round receive the same word.
- **FR-022:** The Imposter does not receive the word before reveal.
- **FR-023:** No participant, including the host, can access another player's hidden role or word before the global reveal.
- **FR-024:** After global reveal, all players can see all roles and the word.

### Disconnect behavior
- **FR-025:** A disconnected non-host participant is removed from the room after the backend's defined presence policy identifies the disconnect.
- **FR-026:** A disconnected host causes the room to close for all participants.
- **FR-027:** There is no reconnection flow or host-transfer mechanism.

---

## 10. Security, Privacy, and Reliability Requirements

These are essential even for a private MVP because the game depends on keeping assignments secret.

- **SEC-001 — Server authority:** The server validates room membership, host permissions, readiness, game state transitions, timer duration, timer expiry, and role assignment. Clients must not be the source of truth for these values.
- **SEC-002 — Per-player secret delivery:** Before reveal, send each participant only their own role information. Do not broadcast the entire role/word assignment to all clients and rely on the UI to hide it.
- **SEC-003 — No accidental leakage:** Do not expose secret assignments in public room snapshots, normal participant events, URLs, client-side page data, browser-visible debug output, or error messages before reveal.
- **SEC-004 — Host is not privileged for secrets:** Host permissions do not grant access to other players' assignments before reveal.
- **SEC-005 — Membership checks:** Validate that every request/action is made by an authenticated member of the relevant room.
- **SEC-006 — Host-only actions:** Enforce start-round and reveal-card permissions server-side, not only by hiding buttons.
- **SEC-007 — State validation:** Reject invalid transitions (for example, starting before everyone is Ready, revealing before timer expiry, or changing the timer during an active round).
- **SEC-008 — Code safety:** Room codes must be unique and sufficiently difficult to guess for the intended private use. Add basic protection against repeated invalid join attempts.
- **SEC-009 — Authentication safety:** Passwords must be handled by an appropriate authentication implementation and never stored as plaintext. Do not expose secrets in logs.
- **REL-001 — Consistent state:** Room membership, readiness, timer state, and round phase must be consistent across participants.
- **REL-002 — Timer resilience:** The countdown must remain correct if a client's tab is backgrounded, its phone sleeps, or it refreshes; do not base expiry solely on a client interval.
- **REL-003 — Idempotent actions:** Repeated start/reveal requests or duplicate network events must not assign multiple rounds, reveal early, or move the room into an invalid state.
- **REL-004 — Cleanup:** Closed rooms must become unusable and their live state must be cleaned up according to the owner's chosen infrastructure approach.

---

## 11. Responsive and Interaction Requirements

- Design and test mobile layouts first; desktop is the secondary target.
- The core actions—Create Room, Join Room, Ready, reveal/hide own card, host Start Round, and host Reveal Cards—must be usable on a phone without requiring hover.
- Player cards must remain readable and easy to tap on small screens as the participant count grows.
- The timer and current phase must remain easy to identify at a glance.
- Do not rely on color alone to communicate Ready/Not Ready or host status; pair status with text or another clear indicator.
- Hidden card content must remain concealed when the user hides their own card or the app initially renders.
- Handle refresh/loading states without briefly rendering another player's private data.
- Provide appropriate disabled/loading states to prevent accidental repeated actions.
- Visual direction, layout styling, typography, color, illustration, and animation are owned by the project owner and are intentionally unspecified here.

---

## 12. Acceptance Checklist

The MVP should not be considered ready until the following scenarios pass on mobile and desktop browsers where applicable.

### Authentication and entry
- [ ] Visitor can open and use the landing page without an account.
- [ ] Visitor attempting Create Room or Join Room is routed through authentication first.
- [ ] Sign-up requires username, email, and password.
- [ ] User can log in using email and password.

### Room creation and joining
- [ ] Creating a room immediately opens a lobby and displays a generated code.
- [ ] The host appears as a participant in the lobby.
- [ ] Another authenticated user can join with the correct code and appears for everyone.
- [ ] Invalid room codes show a useful error.
- [ ] There is no fixed player cap imposed by the UI or product logic.
- [ ] A user trying to join during an active round is refused with a clear message.

### Readiness and starting
- [ ] Each user can toggle their own Ready / Not Ready state.
- [ ] The host cannot start while at least one participant is Not Ready.
- [ ] The host cannot start before the agreed minimum player count is met.
- [ ] Only the host can start.
- [ ] Everyone sees the round transition and a consistent timer.

### Secret roles and cards
- [ ] Exactly one participant is randomly assigned as Imposter per round.
- [ ] All other participants receive the same word.
- [ ] The host can be selected as Imposter.
- [ ] The Imposter's private card shows the Imposter role and not the word.
- [ ] A regular player's private card shows the word.
- [ ] Each player can hide their own card after viewing it.
- [ ] Before global reveal, no player (including the host) can retrieve another participant's role or word through ordinary client data/events.
- [ ] The selected word is from the intended familiar, medium-difficulty pool.

### Timer, reveal, and repeat rounds
- [ ] All four presets are available and use minutes: 15, 20, 25, and 30.
- [ ] Custom minutes input validates invalid values.
- [ ] The countdown remains correct when a browser is backgrounded or a phone sleeps.
- [ ] When time expires, the room moves to Awaiting Reveal but does not expose roles automatically.
- [ ] Only the host can reveal, and revealing is unavailable before expiry.
- [ ] Global reveal shows every participant's role and the word to everyone.
- [ ] The app does not calculate or display a winner or collect votes.
- [ ] Readiness resets after reveal, and another round cannot start until everyone is Ready.
- [ ] The same room can run multiple rounds with newly randomized assignments.

### Disconnects and errors
- [ ] A non-host participant determined disconnected is removed from the lobby/room.
- [ ] Host disconnect closes the room and all participants see a clear explanation.
- [ ] There is no host migration or reconnection flow.
- [ ] Closed or invalid rooms cannot continue a round.
- [ ] Users see helpful messages instead of raw infrastructure errors.

---

## 13. Decisions Reserved for the Project Owner

Do not make these choices on the owner's behalf:

1. Specific Cloudflare services and deployment configuration.
2. Frontend/backend frameworks, monorepo tooling, package boundaries, database, realtime transport, and authentication provider.
3. Final visual design and styling.
4. Minimum number of players required to start a round. No maximum was requested.
5. Allowed minimum and maximum values for a custom timer duration.
6. Any account verification or password-recovery flow beyond the agreed email/password/username sign-up and email/password login.

The implementation agent should inspect the existing repository and the owner's preferred tooling before making architecture changes. If the project is starting from an empty repository, it should present proposed stack/repository choices to the owner rather than choosing Cloudflare services or monorepo tooling unilaterally.

---

## 14. Agent Handoff Instructions

Use this document as the source of product behavior for the Imposter MVP.

Before coding:
1. Inspect the current repository and identify what already exists. Do not assume a blank project if files are present.
2. Summarize the requirements and identify only genuinely blocking ambiguities. The minimum player count and custom timer bounds are explicitly unresolved; get the owner's decision before implementing those rules.
3. Propose a repo-aware implementation sequence and testing strategy for the owner to review.
4. Do not decide visual styling, Cloudflare services, frameworks, or monorepo tooling on the owner's behalf.
5. Do not add features from the out-of-scope list without explicit approval.
6. Treat secret-role isolation and server-authoritative room/timer state as release-blocking correctness requirements, not optional polish.

During implementation, keep behavior testable, validate permissions on the server, and test the full flow with at least three separate authenticated browser sessions once the minimum-player rule is confirmed.
