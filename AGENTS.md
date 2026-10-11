# Simulator authoring rules

This repository owns the hardware-free NICo/DPF learning course. Read the
[course-authoring skill](user-documantion/skills/dpf-course-authoring/SKILL.md)
for lesson, diagram and YAML changes.

- Keep source, prepared examples and runtime dependencies self-contained.
- Preserve exact uploaded PNGs. Use SVG overlays or separate diagrams for motion.
- Show all topics on the left; keep DPU 101 short and explain OS before containers.
- Learners should use prepared examples without mandatory file editing.
- Explain each YAML's target cluster, reconciler and effect on the DPU.
- Distinguish simulations, historical evidence and real kind-cluster operations.
- Never include passwords, tokens, kubeconfigs, private keys or runtime logs
  in Git.
- Keep `.runtime/` private and ignored. Preserve cluster ownership and workspace
  when restarting or moving the app. A UI change does not authorize a cluster
  reset.
- Do not contact physical DPUs/BMCs or deploy to a real lab for simulator checks.
- The build server `nico-build-01` is exclusively for builds and artifact publishing;
  do not use it for course hosting, lab backups or hardware provisioning.
- Regenerate `web/yaml-examples.json` from `examples/dpf/` after editing examples.
- Run relevant unit, shell lifecycle and browser checks before claiming success.
- Check animation controls, reduced motion, navigation and mobile layout for
  visual changes. Keep new assets in the server's explicit allowlist.
- Put user guides and plans under `user-documantion/` (intentional spelling).
- Give fenced Markdown blocks a language identifier.
