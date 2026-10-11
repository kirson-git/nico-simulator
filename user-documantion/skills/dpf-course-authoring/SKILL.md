---
name: dpf-course-authoring
description: "Use when creating or editing the DPF learning course, BlueField concept diagrams, browser simulator lessons, or YAML walkthroughs using the l-csi guide as a reference. Does not apply to operating a real cluster or provisioning hardware."
---

# DPF Course Authoring

Turn DPU concepts into short explanations and inspectable, interactive examples.
Use the user's l-csi DOCA Sentry guide as a visual and teaching reference, not as
the source of truth for a different lab's hardware or deployment status.

## Start from the existing course

Locate the `nico-simulator` repository containing `workshop.sh` and `server.mjs`.
Read its applicable
`AGENTS.md` and the requested lesson before editing. The course uses a complete
left topic navigation and a right lesson pane. Keep the requested scope; this
skill does not require redesigning the shell or adding more lessons.

User documentation and reference assets belong under `user-documantion/` (that
spelling is intentional). The simulator runs from the repository root.
For detailed component paths, diagram conventions, and the reference snapshot,
read [the visual reference](references/visual-reference.md).

## Teach one idea at a time

- Keep DPU 101 short: what the card does, its separate Arm computer, control
  ownership in DPU/NIC mode, then OS installation before service containers.
- Distinguish host OS, DPU Arm OS, and BMC. DPF orchestrates provisioning and
  service deployment; installing a BFB alone does not mean HBN is configured.
- Name control traffic separately from packet forwarding. Arm software can
  program hardware rules; do not animate every packet through an Arm CPU.
- A configured VXLAN/HBN example is not automatic DPU-mode behavior. Tenant
  names and namespaces alone do not provide network isolation.
- Use the reference's explanatory sequence where useful. Read
  [the content map](references/content-map.md) for optional later lessons;
  do not add all of them to a small requested edit.

## Diagram and animation conventions

Use editable SVG for architecture: colored regions, readable labels, numbered
arrows, and a small moving token that follows the actual drawn path. Reuse the
course's shared diagram component before creating another animation system.

Retain the user's exact PNGs when requested. Add explanations or separate views
instead of repainting or relabeling the bitmap. Keep historical labels visible
and explain model differences nearby; a legacy 16-core drawing is not evidence
for BlueField-4 specifications.

Place Play/Pause at the upper right of the figure. Include step and replay
controls when the flow has stages. Start paused, respect reduced motion, pause
when hidden or switching views, and dispose handlers on navigation. Pair motion
with a text explanation so color and animation are not the only teachers.
Small screens must keep readable text: use a labeled, keyboard-scrollable diagram
region where shrinking would make labels illegible. Do not clip the page itself.

## YAML, commands, and evidence

Show complete prepared YAMLs and explain which cluster receives each object,
which controller reconciles it, and what changes on the host, BMC, Arm OS, or
network. Keep source filenames traceable. Simulator inputs are baked in; learners
should not have to edit files to complete a lesson unless they explicitly ask
for an editing exercise. Keep optional editor support separate from requirements.

For a manual installation guide, show the actual underlying Helm/kubectl/CLI
commands in execution order, not just a wrapper-script command. Verify them
against the relevant implementation and supported official documentation.
An illustrative command preview is not an execution log. Label simulated and
recorded output separately; redact credentials while preserving useful context.

The private guide's IPs, firmware versions, release candidates, failure reports,
and target architecture are dated lab observations. Recheck them before making
live-status claims. Distinguish an ideal design from what is deployed. Verify
new hardware/software claims in primary NVIDIA sources; preserve the existing
course's BlueField/DPF compatibility boundaries.

When explicitly asked to explain the guide's own values, retain them as dated,
labeled examples. That does not make them defaults for a different simulator or
authorize applying them to a live cluster.

## Validate and publish within scope

Use browser checks for the changed interactions: play/pause/step/replay, view
switches, hash navigation, original asset loading, reduced motion, and mobile
layout. Review the rendered screenshots. Course-only interactions must not make
cluster writes. Rebuild/restart only the course app when needed; preserve the
training cluster and learner workspace. The skill grants no permission to reset
clusters, provision DPUs, reboot servers, or send messages to others.

Keep the saved skill and its installed copy in sync when updating these
conventions. Explicit user instructions override the preferences in this skill.
