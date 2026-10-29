# Product Design Workflow at BigIn

2026-09-22, recorded by @Danh Nguyen

## Overview

This document describes the Product Design workflow currently in use at Bigin, compiled by Danh Nguyen (Head of Design) for Tam Mai to include in `bigin-skill`, the implementation framework for Phase 2 (Workflow) of the AI First initiative.

- **Purpose:** standardize the steps, inputs, outputs, and decision principles of the Product Design workflow, as a foundation for building it into an AI skill.
- **Audience:** the `bigin-skill` build team (Tam Mai) and the Product and Design team, for reference.
- **Scope:** the full end to end workflow, from intake, moodboarding, branding, core feature design, and the design system build, through review, handoff, and implementation verification.

This document is a working draft covering stages 1 to 6. The review criteria and handoff process will be extended as further requirements are identified.

## Design philosophy

A digital product exists only through the people who use it. So clarity about what a user is doing and what happens next, together with feedback that is immediate and unambiguous, is a precondition of the design and not a finishing layer. Clarity is what lets someone reach the value the product holds. Attachment follows that value, not the absence of friction.

### What the interface owes the user

1. **The user is never lost.** At any point a person can say where they are, what brought them here, and what comes next. The product follows one continuous reading direction, left to right and top to bottom, the de facto standard across digital work.
2. **Position carries meaning.** Where something sits states how important it is and where it falls in a sequence. Order is never arbitrary.
3. **Attention is the scarce resource, not screen space.** A screen that shows everything has decided nothing. Cut what sits on the page rather than ask someone to hold it in their head.
4. **The interface says what it does, and answers back.** Every control is named by the action it performs, and every action gets a visible response. A product that says Ok has told the user nothing, and an action with no response leaves the user guessing.

### How the workflow operates

1. **Structure before surface.** Nothing is styled until it is proven to work, because attractive is the easiest way to move a weak structure past a review.
2. **Constraints decide, taste argues.** When a constraint is broken, the design changes and the constraint stays.
3. **Custom work earns itself.** Start from what already ships. Everything custom is maintenance that someone pays for later.

Every rule in the stages below traces back to one of the beliefs above. A rule that traces to none of them does not belong.

## Stage 1, Intake and Moodboarding

**Goal:** understand the client's problem correctly and turn it into a named layout archetype, backed by reference material.

**Input:** either of two entry paths.

- **Path A, direct client meeting:** the Head of Design attends a meeting with the client and the requirement is gathered first hand.
- **Path B, existing requirement document:** the BA team or a front tier colleague, for example Long Van or Minh Truong, has already met the client and produced an analysis document or a proposal carrying the complete requirement.

The path decides which steps below run. Path B skips Step 1 and changes the source material for Step 2. Steps 3 and 4 run the same way on both paths, because no BA document covers design research.

**Steps:**

1. **Discovery meeting (Path A only, skipped on Path B):** Danh joins the client meeting to understand what product they want to build, how the core feature should work, and what market problem it solves. In many cases the client only knows they want to digitalize their product or workflow, without knowing how to implement it. This step often needs further clarification rather than accepting a vague brief. On Path B it is replaced by a read through of the analysis document or proposal, with a follow up only if something material is missing.
2. **Synthesis and classification (both paths, source differs):** synthesize the content and classify it against industry standards to define a suitable overall layout. On Path A the source is the meeting notes. On Path B the source is the analysis document or proposal, which usually makes this step faster.
3. **Moodboard research (both paths, nothing saved):** search Pinterest, Dribbble, and similar sources to capture layouts, widgets, and modules that best match the keywords appearing most often in the core feature description. If the core feature is not yet concrete, broaden the search to relevant keywords.
4. **Pitch deck synthesis (both paths, nothing saved):** package the matching moodboards into a pitch deck, with an explanation of why each moodboard fits the client's problem, and name the layout archetype the research points to.

**Output:** three things. First, a named layout archetype, for example dashboard with sidebar, workspace with left nav and right inspector, or content led site. Second, a pitch deck containing the moodboards and the reasoning behind each choice. Third, a note on whether the product carries a promotional register alongside the functional UI, meaning surfaces that announce new features, carry promotional content, or push a strong CTA. The moodboards usually reveal this already. It is recorded here because it constrains the typeface choice in Stage 2 and adds surfaces in Stage 3.

The archetype is the conclusion of the research written down as one line, so later stages have something concrete to build on instead of mood only. It sets the frame, not the detail. The exact navigation pattern inside that archetype is decided in Stage 3, once the Product Requirement is locked.

> Note: this stage can loop with Stage 2, Branding, before finalizing, ahead of the official Product Requirement.

## Stage 2, Brand Foundations

**Goal:** lock the visual identity for the whole product, based on the layout vision from Stage 1. Three decisions come out of this stage, the color palette, the typeface, and the icon style direction.

**Case 1, client already has a brand guideline:**

- Pick the primary color from the client's brand guideline.
- Build it into **5 shades** to cover interactive states (hover, active, disabled, and so on).
- Combine it with a neutral color set so the overall palette follows the ratio, **60% Neutral, 30% Secondary, 10% Accent (Primary)**.
- Take the typeface from the guideline and map it to roles, for example display, heading, body, and UI label. One family can carry every role, or the roles can split across two families, typically one for display and heading and another for body and UI. What gets recorded is the role to family mapping, not just a font name.

**Case 2, client has no branding yet:**

- Pick a color based on what the product's category typically uses, or a color that fits the psychological state the product should create in users.
- Pick a typeface the same way, by category convention or by the intended psychological state, and decide the same role to family mapping, one family or two.
- Still apply the same 5 shade and 60, 30, 10 rules as above.

**Purpose of the 60, 30, 10 ratio (both cases):** establish a clear action hierarchy so the user can always identify the main action by its prominence. At each decision point in a task flow, there is one main action. Two competing primary CTAs at the same decision point fail this principle, even if the palette follows the ratio. Supporting actions must remain visually subordinate.

**Typeface checks before locking (both cases):**

- If Stage 1 flagged a promotional register, the typeface has to hold up at large size and heavy weight, which not every good body typeface does. Test it at display size before locking, because this check can change the choice.
- If two families are used, check that they pair, meaning compatible x height and enough contrast in character that the pairing reads as deliberate.
- Cap the weights that will actually ship. Two families multiply the webfont payload, so decide the weights per role here rather than later.

**Icon style direction (both cases):** decide the style icons have to follow, for example outline or filled, stroke weight, and corner treatment. Only the direction is set here, not the icon set itself. The set is chosen in Stage 4 from what the design system ships, and it has to satisfy this direction.

**Not decided in this stage:**

- The type scale, meaning sizes, line heights, and weights per role. That depends on information density and layout, and the design system usually ships its own scale. Stage 4 maps the typeface onto it.
- The icon set, which follows the design system chosen in Stage 4.
- Logo and custom brand marks, which are a production task, and where logo-generator and svg-icon-generator come in.

**Output:** a color palette (primary 5 shades, plus neutral, plus secondary and accent), a chosen typeface with its roles, and an icon style direction. None of it is applied until Stage 4, step 3. It is locked this early because it comes out of the client facing pitch deck, not because the structure needs it.

> Stages 1 and 2 can loop back and forth several times before finalizing.

> **Shortcut:** an analysis document or proposal from BA or frontline rarely covers branding, so this stage is usually not affected. The one exception is if that document already includes the client's brand guideline, in which case Case 1 above applies directly and no separate branding research is needed.

## Stage 3, Structural Decisions from the Product Requirement

**Input:** a concrete Product Requirement, usually provided by the BA team or the frontline person who worked directly with the client to lock feature scope and requirements, plus the layout archetype from Stage 1.

**Nature of this stage:** decisions only, no visual artifact. Nothing is drawn here. The output is a written spec that Stage 4 builds against.

**Clarify the main objects before making structural decisions:**

For each main object the user works with, establish its content source, what the user can change, its lifecycle, and who can access or act on it. When content is reused, establish how changes reach the places that use it. Read these answers from the Product Requirement first, and ask only where a missing answer affects the structure or behavior. Do not silently turn an assumption into a product requirement.

- **Content source:** where the content comes from, and whether reused content is an independent copy, a reference to the current source, or a retained version that can be updated later.
- **Editing scope:** what users can create, select, arrange, change, or remove, and whether those actions affect only this object or also its source.
- **Lifecycle:** which states the object passes through, what action moves it between states, and when changes become visible to others. For a published object, clarify whether further edits go live immediately or require another publish action.
- **Access and actions:** who can view, edit, share, or publish, where those actions apply. If sharing exists, clarify what access a link or invitation grants.
- **Change propagation (when content is reused):** whether source updates apply automatically or by user choice, how users learn what changed, and whether they can choose which destinations receive an update.

Record the applicable decisions in the structural spec and use them to derive the screens, available actions, and task flows below. Resolve missing answers that would change those decisions before the affected screens are built in Stage 4.

**Decisions to make:**

1. **Screen inventory:** the screens the locked requirement implies, and which of them are top level destinations.
2. **Navigation placement:** where navigation sits inside the archetype, for example sidebar, topbar, icon rail, bottom bar on mobile, or split view. This is not a closed list. The archetype and the criteria below decide it.
3. **Navigation behavior:** how that navigation behaves, for example persistent, collapsible, expand on hover, or overlay drawer. Placement and behavior are two separate axes and are decided separately.
4. **Shell:** the rest of the master layout, meaning the content region, where global actions live, where notifications surface, and how the shell responds across breakpoints.
5. **Entry routes and task flows:** record each intended route into the feature, including the navigation bar, submenus, and links from other features. Separately record, for every task inside the feature, its starting state, sequence, and completed outcome. Access and completion each have their own 3 step limit.
6. **Promotional surfaces (only if Stage 1 flagged a promotional register):** where feature announcements, promotional content, and strong CTAs appear, and whether each one interrupts the task in progress or sits inline in the shell.

**Criteria for the navigation decision:**

- Number of top level destinations. Past roughly 7, a topbar breaks down even with grouping.
- Depth of the hierarchy under each destination.
- Whether the content needs horizontal room. Data tables, canvases, and editors favor an icon rail or a collapsible sidebar.
- How often users switch between destinations. Frequent switching favors persistent navigation over overlay.
- Target devices and breakpoints.

**Layout and interaction rules (applied throughout):**

- **The 3 step rule, feature access:** each intended entry route must reach the feature in no more than 3 steps, whether through the navigation bar, a submenu, or another feature.
- **The 3 step rule, task completion:** once inside the feature, completing any task must take no more than 3 steps. This is checked separately from feature access. A modal display counts as one step when opening it is part of the task, or as the starting point when the task genuinely begins in an already open modal. Record the actual sequence so required navigation or actions are not hidden by moving the starting point.
- **One main action per decision point:** the user must be able to identify one clear next main action. Two competing primary CTAs at the same point fail the flow. Supporting actions may be present with subordinate emphasis.
- **Consistency includes behavior:** equivalent roles and states use the same visual rules, and equivalent tasks use the same interaction pattern across features. A shared small task cannot follow one flow in feature A and a different flow in feature B. Validate both visual and behavioral consistency in Stage 5.
- **Alignment and ordering:** alignment follows one axis and one direction across the whole system. Items inside a navigation container are ordered by frequency of use, the most frequently used first. A column navigation orders top to bottom, a horizontal top bar orders left to right, by the same criterion.
- **The 6 by 6 rule:** a page shows at most 6 cards or blocks of content, and each card or block presents at most 6 items. Forms take the same shape, at most 6 blocks with at most 6 fields each. One level further down, a selection field with more than 6 options becomes a dropdown selection, while a field with 6 or fewer lists every option in full, with a select all control when the field is multiple choice.
- **Notification persistence:** modeled on macOS notifications. An important notification appears and stays until the user takes any action. A notification that is not important dismisses itself after 4 seconds. The policy is set here because it belongs to the shell.
- **Restricted access is never a blocked click:** a user without access to a feature or an action is still allowed to click it. The click opens an explanation of why it is restricted and what unlocks it, for example buying a subscription, contacting a named person, or completing a prerequisite step.
- The navigation decision is justified against both 3 step limits. If the chosen placement or behavior pushes feature access or a task past its limit, revise the navigation or flow rather than changing the required outcome or hiding steps.
- A promotional surface that interrupts a task adds a step to that task. If a core task already sits at 3 steps, the promotion goes inline instead of over the task.
- Other UX principles around layout still to be added in future updates.

**Output:** a written structural spec covering the main objects and their content sources, editing scope, lifecycle, access, and change propagation where applicable; the screen inventory; the navigation placement and behavior with the reasoning behind each; the shell definition; and the entry routes and task flows checked separately against their 3 step limits. No screens and no pixels at this point.

## Stage 4, Core Feature Build on a Design System

**Goal:** turn the Stage 3 structural spec into real screens without producing a wireframe, by building directly on an existing design system and validating the structure before any styling.

**Design system choice:** BigIn Design System, NuxtUI, or another design system, depending on the client's preference.

**Steps:**

1. **Build on defaults, no customization:** assemble the screens in the Stage 3 spec with the chosen design system's components as they come, without custom styling. No wireframe deliverable is produced at this point.
2. **Qualify with the internal team:** work with the internal team to qualify that the structure, flow, and behavior of the core feature are correct.
3. **Customize after qualification:** once qualified, customize variables and design tokens, then apply the Stage 2 foundations, meaning the color palette and the typeface mapped onto the design system's type scale. The icon set is chosen here from what the design system ships, and has to match the icon style direction set in Stage 2. If Stage 2 chose two font families, bind both, since most design system scales assume a single family. If Stage 1 flagged a promotional register, extend the scale upward here with the display sizes and weights those surfaces need, because a design system's scale is built for functional UI and usually stops below display size.

**Component rules (applied while assembling, from step 1 onward):**

- **CTA wording:** a CTA is always a verb or a verb phrase. Never Ok, never Yes. In a modal the CTA and the modal title complement each other and read as one statement, so a dialog titled Delete confirmation takes buttons along the lines of Delete anyway and Keep it.
- **Button to modal naming:** when a button opens a modal, the modal title is the noun form of that button's verb, and the modal's closing action is its own verb phrase. A button labeled Invite members opens a modal titled Inviting members, closed by Send invitations.
- **Button icons:** a leading icon marks a button that opens a modal or navigates to another feature. A trailing icon marks submit, moving forward, or the next step. When neither applies, the button carries no icon.
- **Disabled buttons:** avoid them. When one is unavoidable it always carries a message in the form "Do X to enable this button", naming what the user has to complete, so the disabled state explains itself instead of stalling the user.

**Output:** core feature screens built on a validated structure, styled with the product's own tokens, and carrying the Stage 2 foundations, meaning color, typography, and an icon set that matches the agreed style direction.

> Note: the unstyled design system build takes the place a wireframe would normally hold. It carries the same validation purpose, while staying accurate to what will actually ship.

## Stage 5, Design Review and Acceptance

**Goal:** verify that the feature is reachable, its tasks can be completed clearly, and its visual and interaction rules remain consistent with the rest of the product.

**Input:** the Stage 3 structural spec, the Stage 4 screens and working interactions, the agreed design tokens and components, and existing product flows for equivalent tasks.

**Nature of this stage:** scenario based verification of the complete design. Stage 4 qualifies structure before styling; this stage checks the resulting design, including action hierarchy and consistency, before handoff. Walk through the interactions rather than accepting screenshots alone as evidence of a working flow.

**Required checks:**

| Check | How to verify | Pass condition |
| --- | --- | --- |
| Feature access | Walk every intended entry route from its recorded starting point, including direct navigation, submenus, and routes from other features. Record each step. | Every route reaches the feature within 3 steps. A passing direct route does not compensate for a failing route elsewhere. |
| Task completion | Walk every task inside the feature from its recorded starting state to its completed outcome. Count this separately from feature access. | Every task completes within 3 steps. Required actions and modal transitions are included, and the outcome is visibly confirmed. |
| Main action clarity | Inspect every decision point in each flow, including modal and intermediate states. Identify the action the user should recognize as primary and check its prominence against supporting actions. | One main action is unmistakable at that decision point. Two competing primary CTAs fail. The 60, 30, 10 palette must support this hierarchy; matching the ratio alone is insufficient. |
| Visual consistency | Compare screens, components, and states against the shared system and equivalent uses elsewhere in the product. Inspect neutral and primary colors, other color roles, typography, spacing, padding, margins, sizing, borders, radii, and icons. | Every equivalent role and state follows the same token and component rules. No isolated values or local styling departures. Different semantic roles may use different defined tokens; the mapping remains consistent everywhere. |
| Flow consistency | Compare repeated tasks across features, including their entry controls, action order, component patterns, labels, confirmation, and result feedback. | The same task uses the same interaction pattern wherever it appears. If feature A and feature B implement an equivalent small task differently, the design fails even when both flows are individually within 3 steps. |

These checks apply across the roles, states, and target breakpoints defined in the structural spec. Check the existing Stage 3 layout and interaction rules and Stage 4 component rules as well. The required checks above are the initial acceptance criteria and can be extended in later revisions.

**Steps:**

1. **Prepare the scenarios:** list the entry routes and tasks from Stage 3, with starting states, expected outcomes, and relevant roles and breakpoints. Identify equivalent tasks elsewhere in the product for comparison.
2. **Review with the internal team:** walk the scenarios and apply each required check. For each result, record the route or task, the actual sequence and step count where relevant, the screen or state, and pass or fail. For consistency checks, record the shared token, component, or existing flow used as the reference. Mark a check that cannot yet be exercised as unverified, not passed.
3. **Correct and recheck:** return navigation and flow failures to Stage 3, and component, styling, or implementation failures to Stage 4. Resolve competing CTAs by clarifying the main action and its hierarchy. Resolve consistency failures through the shared pattern, then recheck other places affected by that change.
4. **Record acceptance:** the design is ready for handoff when all applicable checks pass and the internal team has qualified the corrected result. Keep the reviewed design version and the review record together. An unresolved failure or unverified required check prevents acceptance.

**Output:** an accepted design version and a review record containing scenarios, evidence, results, and resolved findings. This record becomes the verification baseline for Stage 6.

## Stage 6, Handoff and Implementation Verification

**Goal:** carry the accepted design into implementation and verify that the delivered behavior and visual system still meet the same criteria.

**Input:** the accepted Stage 5 design and review record, the structural spec, and the shared design system with the product's tokens.

**Handoff package:**

- The accepted screens and interactions, with a clear version reference.
- The structural spec, including entry routes, task sequences, object behavior, access rules, and target breakpoints.
- The token and component references used by the design, including action hierarchy and any shared task patterns reused across features.
- The defined states and feedback needed to implement each interaction without inventing behavior.
- The Stage 5 scenarios and pass criteria, including separate counts for feature access and task completion.

**Steps:**

1. **Walk through with implementation and QA:** demonstrate how users enter the feature, complete each task, and see its result. Identify the existing components and flows to reuse. Resolve missing behavior in the spec and design before the affected work proceeds.
2. **Implement from the accepted references:** use the shared tokens, components, and interaction patterns. If a constraint requires a design change, update the relevant spec and design and repeat the affected Stage 5 checks before treating the change as accepted.
3. **Verify the running feature:** repeat the Stage 5 scenarios against the actual implementation. Recheck both 3 step limits, one main action per decision point, visual consistency, and flow consistency across features. A passing design review does not automatically pass the implementation.
4. **Correct and recheck discrepancies:** record the expected and actual behavior or appearance, correct the issue, and rerun the affected scenarios. If a shared component, token, or flow changes, also verify the other uses affected by it.
5. **Close the handoff:** record the verified implementation version and results once every applicable check passes. Keep the design, spec, and implementation aligned. Unresolved failures or unverified required checks keep verification open.

**Output:** the handoff package and an implementation verification record showing that the delivered feature meets the accepted design criteria. This stage covers design conformance; engineering and functional testing remain necessary for behavior beyond these design checks.
