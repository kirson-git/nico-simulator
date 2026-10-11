# NICo Simulator

An interactive, hardware-free course for learning NVIDIA BlueField DPUs and
DPF. Explore diagrams, inspect complete YAML examples, rehearse host Ubuntu
installation, and practice Kubernetes commands in a dedicated local cluster.

The course keeps all topics in the left sidebar, with explanations and exercises
on the right. Lessons and YAMLs are prepared in advance; learners do not need to
edit files to follow them.

## Included lessons

| Lesson | What you can do |
| --- | --- |
| DPU 101 | Learn what is inside a DPU and how its OS differs from the host OS. |
| DPU vs NIC mode | Play, pause and step through control ownership and packet flow. |
| OS → containers | Follow BFB provisioning, Arm Linux boot, cluster join and services. |
| Kubernetes basics | Use a real Bash terminal, apply a prepared Europe example, check progress and reset the exercise. |
| DPU configuration | Inspect eight complete YAMLs and see what each field affects. |
| Host Ubuntu | Rehearse virtual ISO mounting and an automatic installation in the browser. |

The concept lessons, YAML walkthrough and host installation are simulations.
The Kubernetes exercise runs real commands against an isolated two-node **kind**
cluster. This course does not install DPF, provision physical DPUs, mount an ISO
on a real server, or deploy HBN. Additional hands-on lessons are marked **Planned**.

The hardware introduction discusses BlueField-4. The prepared DPF 26.4 YAMLs
are teaching copies from a BlueField-3 lab; this is not a BlueField-4 deployment
compatibility claim. The original uploaded diagrams remain unchanged, with
nearby explanations of their historical labels.

## Quick start

Use a **Linux x86-64 (amd64)** machine with Docker Engine running, Bash, curl,
Python 3 and kubectl available in `PATH`. Your account must be able to run Docker.
The first build/start needs internet access to download dependencies and images.
The launcher downloads and verifies its pinned kind binary automatically.

```bash
git clone git@github.com:kirson-git/nico-simulator.git
cd nico-simulator
./workshop.sh --build
./workshop.sh --start
```

Open [http://localhost:8780](http://localhost:8780) on that machine.
The launcher creates `kind-dpf-training`, starts the course container, and waits
for the two training nodes to be ready.

### Open from your Mac

Run this in iTerm2 on your Mac and leave it running. Replace `nico-lab` with your
SSH alias or `username@server` if needed.

```bash
ssh -N -o ExitOnForwardFailure=yes -L 8780:127.0.0.1:8780 nico-lab
```

Then open [http://localhost:8780](http://localhost:8780) in your Mac browser.
If port 8780 is already in use on your Mac, forward another local port:

```bash
ssh -N -o ExitOnForwardFailure=yes -L 8781:127.0.0.1:8780 nico-lab
```

Open [http://localhost:8781](http://localhost:8781) instead. The launcher supports
Linux amd64; native macOS/Apple Silicon startup is not implemented. A Mac can
access the course through this tunnel to the Linux host.

## Manage the workshop

Run exactly one flag per invocation. No argument or `--help` prints help;
unknown flags and multiple arguments exit with an error.

| Command | Behavior |
| --- | --- |
| `./workshop.sh --build` | Build the pinned `dpf-workshop:0.1.0` container image. |
| `./workshop.sh --start` | Create or reuse the owned training cluster; start or replace the course container. Preserve learner files. |
| `./workshop.sh --status` | Show the course container and training nodes; fail if the course container is absent. |
| `./workshop.sh --logs` | Print server logs, including automated Kubernetes commands and results. |
| `./workshop.sh --stop` | Stop the course container; retain the cluster and workspace. |
| `./workshop.sh --delete-cluster` | Remove this workshop container and owned kind cluster; retain the learner workspace volume. |
| `./workshop.sh --help` | Show supported flags and requirements. |

Host command logs and the private training kubeconfig live in `.runtime/`, which
is excluded from Git and Docker builds. Server logs record automated operations;
they are not a complete transcript of arbitrary commands typed in the terminal.
The browser's Kubernetes reset deletes only the `tenant-europe` exercise namespace
and restores its prepared YAML inside the training environment.

Use one checkout per Docker host: the launcher uses fixed container, cluster,
volume and port names. Keep `.runtime/` with the checkout when moving an existing
local installation. A fresh clone refuses to take over an existing cluster whose
identity it does not own. Never commit that runtime directory.

## Course authoring

```text
web/                         Lessons, navigation, diagrams, fonts and exact PNGs
examples/dpf/                Prepared YAML sources and original-file provenance
lessons/                     Runnable Kubernetes exercise
bin/build-yaml-examples.py    Build the YAML bundle used by the browser
server.mjs                   HTTP server and browser terminal bridge
lesson.mjs                   Training cluster validation and exercise grading
tests/                       Unit, launcher lifecycle and browser checks
user-documantion/            Authoring skill, testing guide and migration notes
workshop.sh                  Docker/kind lifecycle commands
```

To update a YAML walkthrough, edit the corresponding prepared file under
`examples/dpf/`, then regenerate the browser bundle:

```bash
python3 bin/build-yaml-examples.py
```

The examples contain fictional IPs and DPU identities. `manifest.json` retains
historical source paths and hashes; those original lab files are not required
and are not included. The bundle also records each local training source/hash.
These examples are for inspection, not deployment as-is to a physical lab.

Follow [AGENTS.md](AGENTS.md) and the
[DPF course-authoring skill](user-documantion/skills/dpf-course-authoring/SKILL.md).
Keep the short lessons, original PNGs, readable animations and complete prepared
YAMLs. Explain what each YAML affects and distinguish simulated results from
recorded evidence. Add new browser assets to the explicit allowlist in `server.mjs`.

## Verification

After building the image:

```bash
docker run --rm --entrypoint npm dpf-workshop:0.1.0 test
python3 -m unittest discover -s tests -p 'test_*.py'
bash -n workshop.sh
```

See [the testing guide](user-documantion/testing.txt) for browser checks.

## Access and attribution

The service binds to `127.0.0.1:8780` and accepts localhost browser origins.
Use the SSH tunnel for remote access. It is a single-learner workshop with a real
shell and no web login; keep it on loopback rather than exposing it publicly.
Its container receives only the training kubeconfig, not the host Docker socket
or your administration kubeconfig.

The terminal bridge is adapted from
[k8s-101-launchable](https://github.com/ansjindal/k8s-101-launchable).
See [THIRD_PARTY_NOTICES.txt](THIRD_PARTY_NOTICES.txt) for its MIT notice.
Bundled images and fonts retain their respective owners' rights; this repository
does not grant additional rights to those assets. This is a learning project,
not an official NVIDIA product.
